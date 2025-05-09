import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';
import { TelegramService } from '../telegram.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupConfirmCashCommand(
    telegramService: TelegramService,
    userService: UserService,
    rentRequestService: RentRequestService
) {
    const bot = telegramService.bot;
    bot.command('confirm_cash', async (ctx) => handleConfirmCash(ctx, ctx.session, userService, rentRequestService));

    bot.callbackQuery(/^confirm_request_(\d+)$/, async (ctx) => {
        const requestId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        const request = await rentRequestService.findByIdWithRelations(requestId); // отримаємо повний об'єкт із renter

        if (!request || !request.renter) {
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        await rentRequestService.approve(requestId);
        await rentRequestService.markConfirmed(requestId);

        // 🔔 Надсилаємо повідомлення орендарю
        await telegramService.notifyUser(
            request.renter.telegramId,
            `✅ ${t(request.renter.language || 'uk', 'RENT_CONFIRMED_BY_OWNER')} ${request.spot.address.name} — ${request.spot.spotNumber}`
        );

        ctx.session.step = undefined;
        ctx.session.temp = {};

        await ctx.answerCallbackQuery();
        return ctx.reply(t(lang, 'RENT_CONFIRMED'));
    });
}

export async function handleConfirmCash(ctx: Context, session: SessionData, userService: UserService, rentRequestService: RentRequestService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    if (user?.role !== 'OWNER') {
        return ctx.reply(t(lang, 'ONLY_OWNER'));
    }

    const requests = await rentRequestService.findPendingByOwner(user.id);
    if (!requests.length) {
        return ctx.reply(t(lang, 'NO_PENDING_REQUESTS'));
    }

    session.step = 'confirm_cash_select_request';
    session.temp = {};

    await ctx.reply(t(lang, 'SELECT_REQUEST_TO_CONFIRM'), {
        reply_markup: {
            inline_keyboard: requests.map((r) => [
                {
                    text: `${r.spot.address.name} — ${r.spot.spotNumber} (${r.renter.fullName})`,
                    callback_data: `confirm_request_${r.id}`,
                },
            ]),
        },
    });
}

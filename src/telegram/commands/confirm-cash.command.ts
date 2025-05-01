import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';

export function setupConfirmCashCommand(
    bot: BotContext,
    userService: UserService,
    rentRequestService: RentRequestService
) {
    bot.command('confirm_cash', async (ctx) => {
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

        ctx.session.step = 'confirm_cash_select_request';
        ctx.session.temp = {};

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
    });

    bot.callbackQuery(/^confirm_request_(\d+)$/, async (ctx) => {
        const requestId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        await rentRequestService.approve(requestId);
        await rentRequestService.markConfirmed(requestId);

        ctx.session.step = undefined;
        ctx.session.temp = {};

        await ctx.answerCallbackQuery();
        return ctx.reply(t(lang, 'RENT_CONFIRMED'));
    });
}

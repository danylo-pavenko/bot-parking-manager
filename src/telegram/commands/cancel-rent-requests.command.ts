import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';

export function setupCancelRentRequestsCommand(
    bot: BotContext,
    userService: UserService,
    rentRequestService: RentRequestService,
) {
    bot.command('cancel_rent_requests', async (ctx) => {
        if (!ctx.from) return;
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';
        if (!user) return;

        const requests = await rentRequestService.findActiveByRenter(user.id);
        if (!requests.length) {
            return ctx.reply(t(lang, 'NO_ACTIVE_REQUESTS'));
        }

        return ctx.reply(t(lang, 'CHOOSE_REQUEST_TO_CANCEL'), {
            reply_markup: {
                inline_keyboard: requests.map((r) => [
                    {
                        text: `${r.spot.address.name} — ${r.spot.spotNumber}`,
                        callback_data: `cancel_request_${r.id}`,
                    },
                ]),
            },
        });
    });

    bot.callbackQuery(/^cancel_request_(\d+)$/, async (ctx) => {
        const requestId = Number(ctx.match[1]);
        await rentRequestService.deleteById(requestId);

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(t(lang, 'REQUEST_CANCELLED'));
    });

}

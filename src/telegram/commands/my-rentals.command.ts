import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';

export function setupMyRentalsCommand(
    bot: BotContext,
    userService: UserService,
    rentRequestService: RentRequestService
) {
    bot.command('my_rentals', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'RENTER') {
            return ctx.reply(t(lang, 'ONLY_RENTER'));
        }

        const requests = await rentRequestService.findApprovedByRenter(user.id); // знайти ВСІ схвалені

        if (!requests.length) {
            return ctx.reply(t(lang, 'NO_ACTIVE_RENTALS'));
        }

        for (const r of requests) {
            const from = r.startDate?.toLocaleDateString('uk-UA') ?? '-';
            const to = r.endDate?.toLocaleDateString('uk-UA') ?? '-';
            const isCancelled = r.cancelledAt != null;
            const isExpired = r.endDate && new Date(r.endDate) < new Date();

            const statusText = isCancelled
                ? `❌ ${t(lang, 'CANCELLED_ON')} ${r.cancelledAt?.toLocaleDateString('uk-UA')}`
                : isExpired
                    ? `⏳ ${t(lang, 'EXPIRED_ON')} ${r.endDate?.toLocaleDateString('uk-UA')}`
                    : `✅ ${t(lang, 'ACTIVE_UNTIL')} ${to}`;

            await ctx.reply(
                `${r.spot.address.name} — ${r.spot.spotNumber}\n${t(lang, 'FROM')}: ${from}, ${t(lang, 'TO')}: ${to}\n${statusText}`,
                !isCancelled && !isExpired
                    ? {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: t(lang, 'CANCEL_RENT_AFTER_PERIOD'),
                                        callback_data: `cancel_after_${r.id}`,
                                    },
                                ],
                            ],
                        },
                    }
                    : undefined
            );
        }
    });

    bot.callbackQuery(/^cancel_after_(\d+)$/, async (ctx) => {
        const requestId = Number(ctx.match[1]);
        await rentRequestService.cancelAfterEndDate(requestId);

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(t(lang, 'RENT_CANCELLED_AFTER_PERIOD'));
    });
}

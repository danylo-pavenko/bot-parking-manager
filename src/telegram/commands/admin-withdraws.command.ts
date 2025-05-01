import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';

export function setupAdminWithdrawsCommand(bot: BotContext, userService: UserService) {
    bot.command('admin_withdraws', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'ADMIN') {
            return ctx.reply(t(lang, 'ONLY_ADMIN'));
        }

        const pendingWithdrawals = await userService.getPendingWithdrawals(); // реалізуй цю функцію

        if (!pendingWithdrawals.length) {
            return ctx.reply(t(lang, 'NO_PENDING_WITHDRAWS'));
        }

        const keyboard = pendingWithdrawals.map((w) => [
            {
                text: `${w.user.fullName || w.user.username || 'Користувач'} — ${w.amount} грн`,
                callback_data: `approve_withdraw_${w.id}`,
            },
        ]);

        ctx.session.step = undefined;

        return ctx.reply(t(lang, 'PENDING_WITHDRAWS_LIST'), {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    });

    bot.callbackQuery(/^approve_withdraw_(\d+)$/, async (ctx) => {
        const withdrawId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'ADMIN') {
            return ctx.reply(t(lang, 'ONLY_ADMIN'));
        }

        await ctx.answerCallbackQuery();
        await userService.approveWithdrawal(withdrawId); // реалізуй цю функцію
        return ctx.editMessageText(t(lang, 'WITHDRAW_APPROVED'));
    });
}

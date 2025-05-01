import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';

export function setupWithdrawCommand(bot: BotContext, userService: UserService) {
    bot.command('withdraw', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (!user || user.role !== 'OWNER') {
            return ctx.reply(t(lang, 'ONLY_OWNER'));
        }

        const balance = await userService.getBalance(telegramId);

        if (balance <= 0) {
            return ctx.reply(t(lang, 'NO_FUNDS_AVAILABLE'));
        }

        ctx.session.step = 'withdraw_confirm';
        ctx.session.temp.amount = balance;

        return ctx.reply(t(lang, 'WITHDRAW_CONFIRM', { bala: balance }), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: t(lang, 'CONFIRM'), callback_data: 'withdraw_confirm_yes' }],
                    [{ text: t(lang, 'CANCEL'), callback_data: 'withdraw_confirm_no' }],
                ],
            },
        });
    });

    bot.callbackQuery('withdraw_confirm_yes', async (ctx) => {
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        await ctx.answerCallbackQuery();

        const success = await userService.withdrawBalance(telegramId);
        ctx.session.step = undefined;
        ctx.session.temp = {};

        if (!success) {
            return ctx.editMessageText(t(lang, 'WITHDRAW_FAILED'));
        }

        return ctx.editMessageText(t(lang, 'WITHDRAW_SUCCESS'));
    });

    bot.callbackQuery('withdraw_confirm_no', async (ctx) => {
        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';

        await ctx.answerCallbackQuery();
        ctx.session.step = undefined;
        ctx.session.temp = {};
        return ctx.editMessageText(t(lang, 'WITHDRAW_CANCELED'));
    });
}

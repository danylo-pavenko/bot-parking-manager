import { UserService } from 'src/user/user.service';
import { BotContext } from '../types';
import { t } from '../bot_messages';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupLanguageCommand(bot: BotContext, userService: UserService) {
    bot.command('language', async (ctx) => handleLanguage(ctx, userService));

    bot.callbackQuery(/^lang_set_(uk|en)$/, async (ctx) => {
        const lang = ctx.match[1] as 'uk' | 'en';
        const telegramId = String(ctx.from.id);
        await userService.updateLanguage(telegramId, lang);
        ctx.session.step = undefined;
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(t(lang, 'LANGUAGE_UPDATED'));
    });
}

export async function handleLanguage(ctx: Context, userService: UserService) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';
    await ctx.reply(t(lang, 'CHOOSE_LANGUAGE'), {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🇺🇦 Українська', callback_data: 'lang_set_uk' },
                    { text: '🇬🇧 English', callback_data: 'lang_set_en' },
                ],
            ],
        },
    });
}

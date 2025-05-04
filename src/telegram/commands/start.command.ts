import { UserService } from 'src/user/user.service';
import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserRole } from 'src/entities/user.entity';

export function setupStartCommand(bot: BotContext, userService: UserService) {
    bot.command('start', async (ctx) => {
        if (!ctx.from) {
            return;
        }
        const telegramId = String(ctx.from.id);
        const username = ctx.from.username;

        let user = await userService.findByTelegramId(telegramId);
        if (!user) {
            user = await userService.create({ telegramId, username });
        }

        ctx.session.step = 'language_selection';

        await ctx.reply(`${t('uk', 'CHOOSE_LANGUAGE')} / ${t('en', 'CHOOSE_LANGUAGE')}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🇺🇦 Українська', callback_data: 'lang_uk' },
                        { text: '🇬🇧 English', callback_data: 'lang_en' },
                    ],
                ],
            },
        });
    });

    bot.callbackQuery(/^role_(OWNER|RENTER|GUARD)$/, async (ctx) => {
        const role = ctx.match[1] as UserRole;
        const telegramId = String(ctx.from.id);
        await userService.updateRole(telegramId, role);
        ctx.session.step = undefined;
        
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        await ctx.answerCallbackQuery();
        await ctx.editMessageText(t(lang, 'REGISTRATION_DONE'));

        if (role === UserRole.RENTER) {
            await ctx.reply(t(lang, 'SUGGEST_RENTER_SEARCH'), {
                reply_markup: {
                    inline_keyboard: [[
                        { text: t(lang, 'SEARCH_NOW'), callback_data: 'search_now' },
                    ]],
                },
            });
        }
    });

    bot.callbackQuery('search_now', async (ctx) => {
        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        ctx.session.step = 'search_input';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'SEARCH_ENTER_STREET'));
    });
}

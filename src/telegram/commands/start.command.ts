import { UserService } from 'src/user/user.service';
import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserRole } from 'src/entities/user.entity';
import { getGuardMenu, getOwnerMenu, getRenterMenu } from '../menus/main-menu';
import { InlineKeyboard } from 'grammy';

export function setupStartCommand(bot: BotContext, userService: UserService) {
    bot.command('start', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const username = ctx.from.username;

        let user = await userService.findByTelegramId(telegramId);

        // Якщо користувач вже зареєстрований
        if (user?.language && user?.role) {
            const lang = user.language;
            const role = user.role;

            const roleName = t(lang, `ROLE_${role}`);
            const info = [
                `👤 ${user.fullName || '—'}`,
                `🧑 Username: @${user.username || '—'}`,
                `🎭 ${t(lang, 'YOUR_ROLE')}: ${roleName}`,
            ];

            const keyboard =
                role === 'OWNER' ? getOwnerMenu(lang) :
                    role === 'RENTER' ? getRenterMenu(lang) :
                        getGuardMenu(lang);

            return ctx.reply(info.join('\n'), {
                reply_markup: keyboard,
            });
        }

        // Якщо користувач новий або не завершив реєстрацію
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

    bot.command('menu', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        
        const lang = user.language;
        
        let menu: InlineKeyboard;
        switch (user.role) {
          case 'OWNER':
            menu = getOwnerMenu(lang);
            break;
          case 'RENTER':
            menu = getRenterMenu(lang);
            break;
          case 'GUARD':
            menu = getGuardMenu(lang);
            break;
          default:
            return;
        }
        await ctx.reply(t(lang, 'MAIN_MENU_CHOOSE_ACTION'), { reply_markup: menu });
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

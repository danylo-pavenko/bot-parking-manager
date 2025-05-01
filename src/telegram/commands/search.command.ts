import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';

export function setupSearchCommand(
    bot: BotContext,
    userService: UserService
) {
    bot.command('search', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'RENTER') {
            return ctx.reply(t(lang, 'ONLY_RENTER'));
        }

        ctx.session.step = 'search_input';
        return ctx.reply(t(lang, 'SEARCH_ENTER_STREET'));
    });
}

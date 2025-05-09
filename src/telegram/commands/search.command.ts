import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupSearchCommand(
    bot: BotContext,
    userService: UserService
) {
    bot.command('search', async (ctx) => handleSearch(ctx, ctx.session, userService));
}

export async function handleSearch(ctx: Context, session: SessionData, userService: UserService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    session.step = 'search_input';
    return ctx.reply(t(lang, 'SEARCH_ENTER_STREET'));
}

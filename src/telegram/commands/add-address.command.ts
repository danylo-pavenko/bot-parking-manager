import { UserService } from 'src/user/user.service';
import { BotContext } from '../types';
import { t } from '../bot_messages';
import { SessionData } from '../session';
import { Context } from 'grammy';

export function setupAddAddressCommand(bot: BotContext, userService: UserService) {
    bot.command('add_address', (ctx) => handleAddAddress(ctx, ctx.session, userService));
}

export async function handleAddAddress(ctx: Context, session: SessionData, userService: UserService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    if (user?.role !== 'OWNER') {
        return ctx.reply(t(lang, 'ONLY_OWNER'));
    }

    session.step = 'add_address_input';
    return ctx.reply(t(lang, 'ENTER_ADDRESS_NAME'));
}

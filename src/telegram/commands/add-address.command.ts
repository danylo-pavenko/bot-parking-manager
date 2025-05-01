import { UserService } from 'src/user/user.service';
import { BotContext } from '../types';
import { t } from '../bot_messages';

export function setupAddAddressCommand(bot: BotContext, userService: UserService) {
    bot.command('add_address', async (ctx) => {
        if (!ctx.from) {
            return
        }
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'OWNER') {
            return ctx.reply(t(lang, 'ONLY_OWNER'));
        }

        ctx.session.step = 'add_address_input';
        await ctx.reply(t(lang, 'ENTER_ADDRESS_NAME'));
    });
}

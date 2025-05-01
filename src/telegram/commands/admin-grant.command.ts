import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/entities/user.entity';

export function setupAdminGrantCommand(bot: BotContext, userService: UserService) {
    bot.command('admin_grant', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'ADMIN') {
            return ctx.reply(t(lang, 'ONLY_ADMIN'));
        }

        ctx.session.step = 'grant_admin_input';
        return ctx.reply(t(lang, 'ENTER_USERNAME_TO_GRANT_ADMIN'));
    });
}

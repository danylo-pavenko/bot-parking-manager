import { Context } from 'grammy';
import { BotContext } from '../types';
import { UserService } from 'src/user/user.service';
import { t } from '../bot_messages';

export function setupJoinAsPartnerCommand(bot: BotContext, userService: UserService) {
    bot.command('join_as_partner', (ctx) => handleJoinAsPartner(ctx, userService));
}

export async function handleJoinAsPartner(ctx: Context, userService: UserService) {
    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    return ctx.reply(
        t(lang, 'PARTNER_INFO') + '\n\n' +
        '📞 +380 95 895 9421\n' +
        '📩 dep.services@depsoftware.com\n\n' +
        t(lang, 'PARTNER_NEXT_STEPS')
    );
}

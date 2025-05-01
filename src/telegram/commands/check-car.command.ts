import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';

export function setupCheckCarCommand(
    bot: BotContext,
    userService: UserService
) {
    bot.command('check_car', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'GUARD') {
            return ctx.reply(t(lang, 'ONLY_GUARD'));
        }

        ctx.session.step = 'enter_car_plate';
        return ctx.reply(t(lang, 'ENTER_CAR_PLATE'));
    });
}

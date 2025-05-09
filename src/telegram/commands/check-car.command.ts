import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupCheckCarCommand(
    bot: BotContext,
    userService: UserService
) {
    bot.command('check_car', async (ctx) => handleCheckCar(ctx, ctx.session, userService));
}

export async function handleCheckCar(ctx: Context, session: SessionData, userService: UserService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    if (user?.role !== 'GUARD') {
        return ctx.reply(t(lang, 'ONLY_GUARD'));
    }

    session.step = 'enter_car_plate';
    return ctx.reply(t(lang, 'ENTER_CAR_PLATE'));
}

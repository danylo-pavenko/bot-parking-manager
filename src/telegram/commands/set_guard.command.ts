import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupSetGuardCommand(
    bot: BotContext,
    userService: UserService,
    addressService: AddressService
) {
    bot.command('set_guard', async (ctx) => handleSetGuard(ctx, ctx.session, userService, addressService));

    bot.callbackQuery(/^guard_address_(\d+)$/, async (ctx) => {
        const addressId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        const guardId = ctx.session.temp.guardId;
        if (!guardId) {
            ctx.session.step = undefined;
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        await addressService.assignGuard(addressId, guardId);

        ctx.session.step = undefined;
        ctx.session.temp = {};
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'GUARD_ASSIGNED'));
    });
}

export async function handleSetGuard(ctx: Context, session: SessionData, userService: UserService, addressService: AddressService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    if (user?.role !== 'OWNER') {
        return ctx.reply(t(lang, 'ONLY_OWNER'));
    }

    session.step = 'set_guard_wait_username';
    session.temp = {};

    await ctx.reply(t(lang, 'ENTER_GUARD_USERNAME'));
}

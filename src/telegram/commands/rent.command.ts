import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupRentCommand(
    bot: BotContext,
    userService: UserService,
    addressService: AddressService,
) {
    bot.command('rent', async (ctx) => handleRent(ctx, ctx.session, userService, addressService));

    bot.callbackQuery(/^rent_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        const spot = await addressService.findSpotById(spotId);
        if (!spot) {
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        if (!spot.isActive) {
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'SPOT_NOT_ACTIVE'));
        }

        if (spot.renter) {
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'SPOT_ALREADY_RENTED'));
        }

        if (spot.owner.id === user!.id) {
            await addressService.reserveSpotForOwner(spotId, user!.id);
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'SPOT_RESERVED'));
        }

        ctx.session.temp.spotId = spotId;
        ctx.session.step = 'rent_input_fio';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'RENT_ENTER_FIO'));
    });
}

export async function handleRent(ctx: Context, session: SessionData, userService: UserService, addressService: AddressService) {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';

    if (user?.role === 'GUARD') {
        return ctx.reply(t(lang, 'ONLY_RENTER'));
    }

    const spots = await addressService.findAvailableSpots();
    if (!spots.length) {
        return ctx.reply(t(lang, 'NO_SPOTS_AVAILABLE'));
    }

    session.step = 'rent_select_spot';
    session.temp = {};

    await ctx.reply(t(lang, 'RENT_SELECT_SPOT'), {
        reply_markup: {
            inline_keyboard: spots.map((s) => [
                {
                    text: `${s.address.name} — ${s.spotNumber}, ${s.price} ${s.currency}`,
                    callback_data: `rent_spot_${s.id}`,
                },
            ]),
        },
    });
}

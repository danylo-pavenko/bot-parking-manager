import { BotContext, Lang } from '../types';
import { t } from '../bot_messages';
import { AddressService } from 'src/address/address.service';
import { UserService } from 'src/user/user.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { Context } from 'grammy';
import { SessionData } from '../session';

export function setupMySpotsCommand(
    telegramService: TelegramService,
    userService: UserService,
    addressService: AddressService,
) {
    const bot = telegramService.bot;

    bot.command('my_spots', async (ctx) => handleMySpots(ctx, userService, addressService));

    bot.callbackQuery(/^edit_price_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        ctx.session.temp.spotId = spotId;
        ctx.session.temp.messageId = ctx.callbackQuery.message?.message_id;
        ctx.session.step = 'edit_spot_price';

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'ENTER_NEW_PRICE'));
    });

    bot.callbackQuery(/^delete_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        await addressService.deleteSpotById(spotId);

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();

        const deletedText = `🗑️ ${t(lang, 'SPOT_DELETED')}`;

        if (ctx.callbackQuery.message?.message_id) {
            await ctx.editMessageText(deletedText);
        }
    });


    bot.callbackQuery(/^deactivate_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        await addressService.updateSpotStatus(spotId, false);

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup({
            reply_markup: {
                inline_keyboard: getSpotButtons({ ...ctx.session.temp, id: spotId, isActive: false }, lang),
            },
        });
    });

    bot.callbackQuery(/^activate_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        await addressService.updateSpotStatus(spotId, true);

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.editMessageReplyMarkup({
            reply_markup: {
                inline_keyboard: getSpotButtons({ ...ctx.session.temp, id: spotId, isActive: true }, lang),
            },
        });
    });

    bot.callbackQuery(/^reserve_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);

        if (!user) return;
        await addressService.reserveSpotForOwner(spotId, user.id);

        const lang = user?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'SPOT_RESERVED'));
    });

    bot.callbackQuery(/^clear_renter_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const lang = (await userService.findByTelegramId(telegramId))?.language || 'uk';

        const clearedSpot = await addressService.clearRenterFromSpot(spotId);
        if (clearedSpot?.renter?.telegramId) {
            await telegramService.notifyUser(
                clearedSpot.renter.telegramId,
                t(clearedSpot.renter.language || 'uk', 'RENT_REMOVED_BY_OWNER')
            );
        }

        const status = t(lang, 'NOT_RENTED');
        const text = `${clearedSpot.address.name} — №${clearedSpot.spotNumber}\n💸 ${clearedSpot.price} ${clearedSpot.currency}\n${status}`;

        await ctx.answerCallbackQuery();

        if (ctx.callbackQuery.message?.message_id) {
            await ctx.editMessageText(text, {
                reply_markup: { inline_keyboard: getSpotButtons(clearedSpot, lang) },
            });
        }
    });

}


export function getSpotButtons(spot: any, lang: Lang): any[][] {
    const toggleButton = spot.isActive
        ? { text: t(lang, 'DEACTIVATE_SPOT'), callback_data: `deactivate_spot_${spot.id}` }
        : { text: t(lang, 'ACTIVATE_SPOT'), callback_data: `activate_spot_${spot.id}` };

    const buttons: any[][] = [
        [
            { text: t(lang, 'EDIT_PRICE'), callback_data: `edit_price_${spot.id}` },
            { text: t(lang, 'DELETE_SPOT'), callback_data: `delete_spot_${spot.id}` },
        ],
        [
            toggleButton,
            { text: t(lang, 'RESERVE_FOR_ME'), callback_data: `reserve_spot_${spot.id}` },
        ],
    ];

    if (spot.renter) {
        buttons.push([
            { text: t(lang, 'CLEAR_RENTER'), callback_data: `clear_renter_${spot.id}` },
        ]);
    }

    return buttons;
}

export async function handleMySpots(ctx: Context, userService: UserService, addressService: AddressService) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const user = await userService.findByTelegramId(telegramId);
    const lang = user?.language || 'uk';
    if (user?.role !== 'OWNER') {
        return ctx.reply(t(lang, 'ONLY_OWNER'));
    }

    const addresses = await addressService.findAllByOwnerWithSpots(user.id);

    if (!addresses.length) {
        return ctx.reply(t(lang, 'NO_SPOTS_AVAILABLE'));
    }

    for (const address of addresses) {
        for (const spot of address.spots) {
            const isReservedByOwner = spot.renter?.id === user.id;
            const renterName = spot.renter?.fullName ?? '-';

            const status = isReservedByOwner
                ? t(lang, 'RESERVED_BY_YOU')
                : spot.renter
                    ? t(lang, 'RENTED_BY', { name: renterName })
                    : t(lang, 'NOT_RENTED');

            await ctx.reply(
                `${address.name} — №${spot.spotNumber}\n💸 ${spot.price} ${spot.currency}\n${status}`,
                {
                    reply_markup: {
                        inline_keyboard: getSpotButtons(spot, lang),
                    },
                }
            );
        }
    }
}

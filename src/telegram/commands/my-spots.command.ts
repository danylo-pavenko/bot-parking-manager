import { BotContext } from '../types';
import { t } from '../bot_messages';
import { AddressService } from 'src/address/address.service';
import { UserService } from 'src/user/user.service';

export function setupMySpotsCommand(
    bot: BotContext,
    userService: UserService,
    addressService: AddressService
) {
    bot.command('my_spots', async (ctx) => {
        const telegramId = String(ctx.from?.id);
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
                await ctx.reply(
                    `${address.name} — №${spot.spotNumber}\n💸 ${spot.price} ${spot.currency}`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: t(lang, 'EDIT_PRICE'),
                                        callback_data: `edit_price_${spot.id}`,
                                    },
                                    {
                                        text: t(lang, 'DELETE_SPOT'),
                                        callback_data: `delete_spot_${spot.id}`,
                                    },
                                ],
                                [
                                    {
                                        text: t(lang, 'DEACTIVATE_SPOT'),
                                        callback_data: `deactivate_spot_${spot.id}`,
                                    },
                                    {
                                        text: t(lang, 'RESERVE_FOR_ME'),
                                        callback_data: `reserve_spot_${spot.id}`,
                                    },
                                ],
                            ],
                        },
                    }
                );
            }
        }
    });

    bot.callbackQuery(/^edit_price_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        ctx.session.temp.spotId = spotId;
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
        await ctx.reply(t(lang, 'SPOT_DELETED'));
    });

    bot.callbackQuery(/^deactivate_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        await addressService.updateSpotStatus(spotId, false); // припустимо `isActive = false`

        const lang = (await userService.findByTelegramId(String(ctx.from.id)))?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'SPOT_DEACTIVATED'));
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
}

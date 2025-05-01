import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';

export function setupAddParkingCommand(bot: BotContext, userService: UserService, addressService: AddressService) {
    bot.command('add_parking', async (ctx) => {
        if (!ctx.from) {
            return
        }
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'OWNER') {
            return ctx.reply(t(lang, 'ONLY_OWNER'));
        }

        const addresses = await addressService.findAllByOwner(user.id);
        if (addresses.length === 0) {
            return ctx.reply(t(lang, 'NO_ADDRESSES_FOUND'));
        }

        ctx.session.step = 'add_parking_choose_address';
        ctx.session.temp = {};

        await ctx.reply(t(lang, 'SELECT_ADDRESS'), {
            reply_markup: {
                inline_keyboard: addresses.map(a => ([
                    { text: a.name, callback_data: `parking_address_${a.id}` }
                ])),
            },
        });
    });

    bot.callbackQuery(/^parking_address_(\d+)$/, async (ctx) => {
        const addressId = Number(ctx.match[1]);
        ctx.session.temp.addressId = addressId;
        ctx.session.step = 'add_parking_number';
        const user = await userService.findByTelegramId(String(ctx.from.id));
        const lang = user?.language || 'uk';
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'ENTER_SPOT_NUMBER'));
    });
}

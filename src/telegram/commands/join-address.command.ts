import { BotContext } from '../types';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { t } from '../bot_messages';

export function setupJoinAddressCommand(
    bot: BotContext,
    userService: UserService,
    addressService: AddressService
) {
    bot.command('join_address', async (ctx) => {
        if (!ctx.from) return;

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

        ctx.session.step = 'joined_address_selection';
        ctx.session.temp = {};

        await ctx.reply(t(lang, 'SELECT_ADDRESS_JOIN'), {
            reply_markup: {
                inline_keyboard: addresses.map((a) => [
                    { text: a.name, callback_data: `join_address_${a.id}` },
                ]),
            },
        });
    });

    bot.callbackQuery(/^join_address_(\d+)$/, async (ctx) => {
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        ctx.session.step = undefined;
        ctx.session.temp = {};

        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'ADDRESS_JOINED'));
    });
}

import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';

export function setupRentCommand(
    bot: BotContext,
    userService: UserService,
    addressService: AddressService
) {
    bot.command('rent', async (ctx) => {
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

        ctx.session.step = 'rent_select_spot';
        ctx.session.temp = {};

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
    });

    bot.callbackQuery(/^rent_spot_(\d+)$/, async (ctx) => {
        const spotId = Number(ctx.match[1]);
        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        ctx.session.temp.spotId = spotId;
        ctx.session.step = 'rent_input_fio';

        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'RENT_ENTER_FIO'));
    });
}

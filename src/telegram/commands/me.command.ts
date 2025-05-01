import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { RentRequestService } from 'src/request/rent-request.service';

export function setupMeCommand(
    bot: BotContext,
    services: {
        userService: UserService;
        addressService: AddressService;
        rentRequestService: RentRequestService;
    }
) {
    bot.command('me', async (ctx) => {
        if (!ctx.from) return;
        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (!user) return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));

        let message = `🧾 ${t(lang, 'YOUR_ROLE')}: ${user.role}\n`;

        // OWNER
        if (user.role === 'OWNER') {
            const spots = await services.addressService.findAllSpotsByOwner(user.id);
            if (spots.length === 0) {
                message += t(lang, 'OWNER_NO_SPOTS');
            } else {
                message += `📍 ${t(lang, 'OWNER_YOUR_SPOTS')}:\n`;
                spots.forEach((s, i) => {
                    message += `${i + 1}. ${s.address.name} – №${s.spotNumber}, ${s.price} ${s.currency}\n`;
                });
            }
        }

        // RENTER
        if (user.role === 'RENTER') {
            const requests = await services.rentRequestService.findApprovedByRenter(user.id);
            if (!requests.length) {
                message += t(lang, 'RENTER_NO_RENT');
            } else {
                message += `📄 ${t(lang, 'RENTER_CURRENT_RENT')}:\n`;
                requests.forEach((r, i) => {
                    message += `${i + 1}. ${r.spot.address.name} – №${r.spot.spotNumber}, ${r.spot.price} ${r.spot.currency}\n`;
                });
            }
        }

        await ctx.reply(message);
    });
}

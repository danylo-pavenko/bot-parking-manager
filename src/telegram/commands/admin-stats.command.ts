import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';
import { AddressService } from 'src/address/address.service';

export function setupAdminStatsCommand(
    bot: BotContext,
    services: {
        userService: UserService;
        rentRequestService: RentRequestService;
        addressService: AddressService;
    }
) {
    bot.command('admin_stats', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'ADMIN') {
            return ctx.reply(t(lang, 'ONLY_ADMIN'));
        }

        const usersCount = await services.userService.countAll();
        const spotsCount = await services.addressService.countSpots();
        const requestsCount = await services.rentRequestService.countAll();

        const message = `
📊 ${t(lang, 'STATS')}:
👤 ${t(lang, 'USERS')}: ${usersCount}
🅿️ ${t(lang, 'SPOTS')}: ${spotsCount}
📄 ${t(lang, 'REQUESTS')}: ${requestsCount}
    `.trim();

        return ctx.reply(message);
    });
}

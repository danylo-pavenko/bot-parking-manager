import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { RentRequestService } from 'src/request/rent-request.service';

export function setupMyRentalsCommand(bot: BotContext, userService: UserService, rentRequestService: RentRequestService) {
    bot.command('my_rentals', async (ctx) => {
        if (!ctx.from) return;

        const telegramId = String(ctx.from.id);
        const user = await userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        if (user?.role !== 'RENTER') {
            return ctx.reply(t(lang, 'ONLY_RENTER'));
        }

        const requests = await rentRequestService.findActiveByRenter(user.id);

        if (!requests.length) {
            return ctx.reply(t(lang, 'NO_ACTIVE_RENTALS'));
        }

        const messages = requests.map((r, i) => {
            const from = r.startDate?.toLocaleDateString('uk-UA') ?? '-';
            const to = r.endDate?.toLocaleDateString('uk-UA') ?? '-';
            return `${i + 1}. ${r.spot.address.name} — ${r.spot.spotNumber}\n${t(lang, 'FROM')}: ${from}, ${t(lang, 'TO')}: ${to}`;
        });

        await ctx.reply(messages.join('\n\n'));
    });
}

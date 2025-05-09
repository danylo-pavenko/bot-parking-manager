import { Context } from 'grammy';
import { AppServices, BotContext } from '../types';
import { handleAddAddress } from '../commands/add-address.command';
import { handleAddParking } from '../commands/add-parking.command';
import { handleJoinAddress } from '../commands/join-address.command';
import { handleSetGuard } from '../commands/set_guard.command';
import { handleMySpots } from '../commands/my-spots.command';
import { handleSearch } from '../commands/search.command';
import { handleJoinAsPartner } from '../commands/join-partner.command';
import { handleMyRentals } from '../commands/my-rentals.command';
import { handleCheckCar } from '../commands/check-car.command';
import { handleMe } from '../commands/me.command';
import { handleLanguage } from '../commands/language.command';
import { handleRent } from '../commands/rent.command';
import { handleCancelRentRequests } from '../commands/cancel-rent-requests.command';
import { handleConfirmCash } from '../commands/confirm-cash.command';

export function registerMainMenuHandlers(bot: BotContext, services: AppServices) {
    bot.callbackQuery('menu_add_address', async (ctx) => handleAddAddress(ctx, ctx.session, services.userService));
    bot.callbackQuery('menu_add_parking', async (ctx) => handleAddParking(ctx, ctx.session, services.userService, services.addressService));
    bot.callbackQuery('menu_join_address', async (ctx) => handleJoinAddress(ctx, ctx.session, services.userService, services.addressService));
    bot.callbackQuery('menu_set_guard', async (ctx) => handleSetGuard(ctx, ctx.session, services.userService, services.addressService));
    bot.callbackQuery('menu_my_spots', async (ctx) => handleMySpots(ctx, services.userService, services.addressService));
    bot.callbackQuery('menu_join_as_partner', async (ctx) => handleJoinAsPartner(ctx, services.userService));
    bot.callbackQuery('menu_confirm_cash', async (ctx) => handleConfirmCash(ctx, ctx.session, services.userService, services.rentRequestService));

    bot.callbackQuery('menu_search', async (ctx) => handleSearch(ctx, ctx.session, services.userService));
    bot.callbackQuery('menu_my_rentals', async (ctx) => handleMyRentals(ctx, services.userService, services.rentRequestService));
    bot.callbackQuery('menu_rent', async (ctx) => handleRent(ctx, ctx.session, services.userService, services.addressService));
    bot.callbackQuery('menu_cancel_rent_requests', async (ctx) => handleCancelRentRequests(ctx, services.userService, services.rentRequestService));

    bot.callbackQuery('menu_check_car', async (ctx) => handleCheckCar(ctx, ctx.session, services.userService));

    bot.callbackQuery('menu_me', async (ctx) => handleMe(ctx, services));
    bot.callbackQuery('menu_language', async (ctx) => handleLanguage(ctx, services.userService));

    // Не забувай
    bot.callbackQuery(/.*/, async (ctx) => {
        await ctx.answerCallbackQuery();
    });
}

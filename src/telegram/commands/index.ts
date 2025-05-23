import { setupStartCommand } from './start.command';
import { setupLanguageCommand } from './language.command';
import { setupAddAddressCommand } from './add-address.command';
import { AppServices } from '../types';
import { setupAddParkingCommand } from './add-parking.command';
import { setupJoinAddressCommand } from './join-address.command';
import { setupSetGuardCommand } from './set_guard.command';
import { setupSearchCommand } from './search.command';
import { setupRentCommand } from './rent.command';
import { setupConfirmCashCommand } from './confirm-cash.command';
import { setupCheckCarCommand } from './check-car.command';
import { setupWithdrawCommand } from './withdraw.command';
import { setupAdminStatsCommand } from './admin-stats.command';
import { setupAdminWithdrawsCommand } from './admin-withdraws.command';
import { setupAdminGrantCommand } from './admin-grant.command';
import { setupMeCommand } from './me.command';
import { TelegramService } from '../telegram.service';
import { setupMySpotsCommand } from './my-spots.command';
import { setupCancelRentRequestsCommand } from './cancel-rent-requests.command';
import { setupMyRentalsCommand } from './my-rentals.command';
import { setupJoinAsPartnerCommand } from './join-partner.command';

export function registerCommands(
    telegramService: TelegramService,
    services: AppServices,
) {
    const bot = telegramService.bot;
    setupStartCommand(bot, services.userService);
    setupLanguageCommand(bot, services.userService);
    setupAddAddressCommand(bot, services.userService);
    setupAddParkingCommand(bot, services.userService, services.addressService);
    setupJoinAddressCommand(bot, services.userService, services.addressService);
    setupSetGuardCommand(bot, services.userService, services.addressService);
    setupSearchCommand(bot, services.userService);
    setupRentCommand(bot, services.userService, services.addressService);
    setupConfirmCashCommand(telegramService, services.userService, services.rentRequestService);
    setupCheckCarCommand(bot, services.userService);
    // setupWithdrawCommand(bot, services.userService);
    setupAdminStatsCommand(bot, services);
    setupAdminWithdrawsCommand(bot, services.userService);
    setupAdminGrantCommand(bot, services.userService);
    setupMeCommand(bot, services);
    setupMySpotsCommand(telegramService, services.userService, services.addressService);
    setupCancelRentRequestsCommand(bot, services.userService, services.rentRequestService);
    setupMyRentalsCommand(bot, services.userService, services.rentRequestService);
    setupJoinAsPartnerCommand(bot, services.userService);
}

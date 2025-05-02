import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { RentRequestService } from 'src/request/rent-request.service';

import { setupStartCommand } from './start.command';
import { setupLanguageCommand } from './language.command';
import { setupAddAddressCommand } from './add-address.command';
import { BotContext } from '../types';
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

export function registerCommands(
    telegramService: TelegramService,
    services: {
        userService: UserService;
        addressService: AddressService;
        rentRequestService: RentRequestService;
    }
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
    setupConfirmCashCommand(bot, services.userService, services.rentRequestService);
    setupCheckCarCommand(bot, services.userService);
    setupWithdrawCommand(bot, services.userService);
    setupAdminStatsCommand(bot, services);
    setupAdminWithdrawsCommand(bot, services.userService);
    setupAdminGrantCommand(bot, services.userService);
    setupMeCommand(bot, services);
    setupMySpotsCommand(bot, services.userService, services.addressService);
}

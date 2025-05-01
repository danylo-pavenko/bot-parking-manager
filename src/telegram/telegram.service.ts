import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Bot, Context, session } from 'grammy';
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate';
import { ConfigService } from '../config/config.service';
import { UserService } from '../user/user.service';
import { AddressService } from '../address/address.service';
import { RentRequestService } from '../request/rent-request.service';
import { SessionData } from './session';

import { registerCommands } from './commands';
import { registerTextHandler } from './handlers/text.handler';

@Injectable()
export class TelegramService implements OnModuleDestroy {
    private readonly bot: Bot<Context & HydrateFlavor<Context> & { session: SessionData }>;

    constructor(
        private config: ConfigService,
        private userService: UserService,
        private addressService: AddressService,
        private rentRequestService: RentRequestService,
    ) {
        this.bot = new Bot(this.config.botToken);
        this.bot.use(session({ initial: (): SessionData => ({ temp: {} }) }));
        this.bot.use(hydrate());

        registerCommands(this.bot, {
            userService: this.userService,
            addressService: this.addressService,
            rentRequestService: this.rentRequestService,
        });

        registerTextHandler(this.bot, {
            userService: this.userService,
            addressService: this.addressService,
            rentRequestService: this.rentRequestService,
        });
    }

    async launch() {
        await this.bot.start();
        console.log('Bot started');
    }

    async onModuleDestroy() {
        await this.bot.stop();
    }
}

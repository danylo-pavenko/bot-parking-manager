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
import { RentRequest } from 'src/entities/rent-request.entity';
import { t } from './bot_messages';
import { AppServices, BotContext } from './types';
import { registerMainMenuHandlers } from './menus/main-menu.handlers';

@Injectable()
export class TelegramService implements OnModuleDestroy {

    public readonly bot: BotContext;

    constructor(
        private config: ConfigService,
        private userService: UserService,
        private addressService: AddressService,
        private rentRequestService: RentRequestService,
    ) {
        this.bot = new Bot(this.config.botToken);
        this.bot.use(session({ initial: (): SessionData => ({ temp: {} }) }));
        this.bot.use(hydrate());
        const appServices: AppServices = {
            userService: this.userService,
            addressService: this.addressService,
            rentRequestService: this.rentRequestService,
            configService: config,
        };

        registerCommands(this, appServices);

        registerTextHandler(this, appServices);

        registerMainMenuHandlers(this.bot, appServices);
    }

    async launch() {
        console.log('Bot starting');
        await this.bot.start();
    }

    async onModuleDestroy() {
        await this.bot.stop();
    }

    async notifyOwnerAboutRequest(request: RentRequest) {
        const owner = request.spot.owner;
        const lang = owner?.language || 'uk';
        const message = t(lang, 'NEW_RENT_REQUEST', {
            spot: `${request.spot.address.name} — ${request.spot.spotNumber}`,
            renter: request.renter.fullName,
        });

        await this.bot.api.sendMessage(Number(owner.telegramId), message);
    }


    async sendReminder(telegramId: string, addressName: string, spotNumber: string, endDate: Date): Promise<void> {
        const user = await this.userService.findByTelegramId(telegramId);
        const lang = user?.language || 'uk';

        const msg = t(lang, 'RENT_ENDING_REMINDER')
            .replace('%s', addressName)
            .replace('%s', spotNumber)
            .replace('%s', endDate.toLocaleDateString('uk-UA'));

        await this.bot.api.sendMessage(telegramId, msg);
    }

    async notifyUser(telegramId: string, message: string): Promise<void> {
        try {
            await this.bot.api.sendMessage(telegramId, message);
        } catch (error) {
            console.error(`❌ Failed to send message to user ${telegramId}:`, error.message);
        }
    }
}

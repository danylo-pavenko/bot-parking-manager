import { HydrateFlavor } from "@grammyjs/hydrate";
import { Bot, CallbackQueryContext, CommandContext, Context } from "grammy";
import { SessionData } from "./session";
import { UserService } from "src/user/user.service";
import { AddressService } from "src/address/address.service";
import { RentRequestService } from "src/request/rent-request.service";

export type BotContext = Bot<Context & HydrateFlavor<Context> & { session: SessionData }>;

export type AppServices = { 
    userService: UserService;
    addressService: AddressService;
    rentRequestService: RentRequestService; 
}

export type Lang = 'uk' | 'en';

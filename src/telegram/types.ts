import { HydrateFlavor } from "@grammyjs/hydrate";
import { Bot, Context } from "grammy";
import { SessionData } from "./session";

export type BotContext = Bot<Context & HydrateFlavor<Context> & { session: SessionData }>;

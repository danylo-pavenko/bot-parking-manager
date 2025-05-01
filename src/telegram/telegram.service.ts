import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Bot, Context, session } from 'grammy';
import { hydrate, HydrateFlavor } from '@grammyjs/hydrate';
import { ConfigService } from '../config/config.service';
import { UserService } from '../user/user.service';
import { SessionData } from './session';
import { t } from './bot_messages';
import { UserRole } from 'src/entities/user.entity';
import { AddressService } from 'src/address/address.service';

@Injectable()
export class TelegramService implements OnModuleDestroy {
    private readonly bot: Bot<Context & HydrateFlavor<Context> & { session: SessionData }>;

    constructor(
        private config: ConfigService,
        private userService: UserService,
        private addressService: AddressService,
    ) {
        this.bot = new Bot<Context & HydrateFlavor<Context> & { session: SessionData }>(this.config.botToken);
        this.bot.use(session({
            initial: (): SessionData => ({
                temp: {
                    addressId: undefined,
                    spotNumber: undefined,
                    price: undefined
                }
            })
        }));
        this.bot.use(hydrate());
        this.setup();
    }

    private setup() {
        this.handleStartCommand();
        this.handleLanguageCommand();
        this.handleAddAddressCommand();
        this.handleAddParkingCommand();
        this.handleJoinAddressCommand();

        this.bot.command('set_guard', async (ctx) => {
            await ctx.reply('Призначення охоронця ще не реалізовано');
        });

        this.bot.command('search', async (ctx) => {
            await ctx.reply('Пошук ще не реалізовано');
        });

        this.bot.command('rent', async (ctx) => {
            await ctx.reply('Оренда ще не реалізована');
        });

        this.bot.command('confirm_cash', async (ctx) => {
            await ctx.reply('Підтвердження готівки ще не реалізоване');
        });

        this.bot.command('check_car', async (ctx) => {
            await ctx.reply('Перевірка авто ще не реалізована');
        });

        this.bot.command('withdraw', async (ctx) => {
            await ctx.reply('Вивід коштів ще не реалізовано');
        });

        this.bot.command('admin_stats', async (ctx) => {
            await ctx.reply('Статистика ще не реалізована');
        });

        this.bot.command('admin_withdraws', async (ctx) => {
            await ctx.reply('Заявки на вивід ще не реалізовано');
        });

        this.bot.command('admin_grant', async (ctx) => {
            await ctx.reply('Призначення ADMIN ще не реалізовано');
        });

        this.handleTextInput();
    }

    private handleStartCommand() {
        this.bot.command('start', async (ctx) => {
            if (!ctx.from) return;

            const telegramId = String(ctx.from.id);
            const username = ctx.from.username;

            let user = await this.userService.findByTelegramId(telegramId);
            if (!user) {
                user = await this.userService.create({ telegramId, username });
            }

            ctx.session.step = 'language_selection';

            await ctx.reply(`${t('uk', 'CHOOSE_LANGUAGE')} / ${t('en', 'CHOOSE_LANGUAGE')}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🇺🇦 Українська', callback_data: 'lang_uk' },
                            { text: '🇬🇧 English', callback_data: 'lang_en' },
                        ],
                    ],
                },
            });
        });

        this.bot.callbackQuery(/^lang_(uk|en)$/, async (ctx) => {
            const lang = ctx.match[1] as 'uk' | 'en';
            const telegramId = String(ctx.from.id);

            await this.userService.updateLanguage(telegramId, lang);
            ctx.session.step = 'role_selection';
            await ctx.answerCallbackQuery();

            await ctx.editMessageText(t(lang, 'CHOOSE_ROLE'), {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: t(lang, 'ROLE_OWNER'), callback_data: 'role_OWNER' },
                            { text: t(lang, 'ROLE_RENTER'), callback_data: 'role_RENTER' },
                            { text: t(lang, 'ROLE_GUARD'), callback_data: 'role_GUARD' },
                        ],
                    ],
                },
            });
        });

        this.bot.callbackQuery(/^role_(OWNER|RENTER|GUARD)$/, async (ctx) => {
            const role = ctx.match[1] as 'OWNER' | 'RENTER' | 'GUARD';
            const telegramId = String(ctx.from.id);

            await this.userService.updateRole(telegramId, role as UserRole);
            ctx.session.step = undefined;

            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            await ctx.answerCallbackQuery();
            await ctx.editMessageText(t(lang, 'REGISTRATION_DONE'));
        });
    }

    private handleLanguageCommand() {
        this.bot.command('language', async (ctx) => {
            if (!ctx.from) return;

            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            await ctx.reply(t(lang, 'CHOOSE_LANGUAGE'), {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🇺🇦 Українська', callback_data: 'lang_uk' },
                            { text: '🇬🇧 English', callback_data: 'lang_en' },
                        ],
                    ],
                },
            });
        });

        this.bot.callbackQuery(/^lang_(uk|en)$/, async (ctx) => {
            const lang = ctx.match[1] as 'uk' | 'en';
            const telegramId = String(ctx.from.id);

            await this.userService.updateLanguage(telegramId, lang);
            ctx.session.step = undefined;
            await ctx.answerCallbackQuery();

            await ctx.editMessageText(t(lang, 'LANGUAGE_UPDATED'));
        });
    }

    private handleAddAddressCommand() {
        this.bot.command('add_address', async (ctx) => {
            if (!ctx.from) return;

            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            if (user?.role !== 'OWNER') {
                return ctx.reply(t(lang, 'ONLY_OWNER'));
            }

            ctx.session.step = 'add_address_input';
            await ctx.reply(t(lang, 'ENTER_ADDRESS_NAME'));
        });
    }

    private handleAddParkingCommand() {
        this.bot.command('add_parking', async (ctx) => {
            if (!ctx.from) return;

            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            if (user?.role !== 'OWNER') {
                return ctx.reply(t(lang, 'ONLY_OWNER'));
            }

            const addresses = await this.addressService.findAll();
            if (addresses.length === 0) {
                return ctx.reply(t(lang, 'NO_ADDRESSES_FOUND'));
            }

            ctx.session.step = 'add_parking_choose_address';
            ctx.session.temp = {};

            await ctx.reply(t(lang, 'SELECT_ADDRESS'), {
                reply_markup: {
                    inline_keyboard: addresses.map((a) => [
                        { text: a.name, callback_data: `parking_address_${a.id}` },
                    ]),
                },
            });
        });

        this.bot.callbackQuery(/^parking_address_(\d+)$/, async (ctx) => {
            const addressId = Number(ctx.match[1]);
            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            ctx.session.temp = { addressId };
            ctx.session.step = 'add_parking_number';

            await ctx.answerCallbackQuery();
            await ctx.reply(t(lang, 'ENTER_SPOT_NUMBER'));
        });
    }

    private handleJoinAddressCommand() {
        this.bot.command('join_address', async (ctx) => {
            if (!ctx.from) return;

            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            if (user?.role !== 'OWNER') {
                return ctx.reply(t(lang, 'ONLY_OWNER'));
            }

            const addresses = await this.addressService.findAll();
            if (addresses.length === 0) {
                return ctx.reply(t(lang, 'NO_ADDRESSES_FOUND'));
            }

            ctx.session.step = 'joined_address_selection';
            ctx.session.temp = {};

            await ctx.reply(t(lang, 'SELECT_ADDRESS_JOIN'), {
                reply_markup: {
                    inline_keyboard: addresses.map((a) => [
                        { text: a.name, callback_data: `join_address_${a.id}` },
                    ]),
                },
            });
        });

        this.bot.callbackQuery(/^join_address_(\d+)$/, async (ctx) => {
            const addressId = Number(ctx.match[1]);
            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            ctx.session.step = undefined;
            ctx.session.temp = {};

            await ctx.answerCallbackQuery();
            await ctx.reply(t(lang, 'ADDRESS_JOINED')); // фактично, це просто вибір адреси
            // користувач тепер зможе додати місця через add_parking, вже маючи існуючу адресу
        });
    }

    private handleTextInput() {
        this.bot.on('message:text', async (ctx) => {
            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            switch (ctx.session.step) {
                case 'add_address_input': {
                    const addressName = ctx.message.text.trim();
                    const exists = await this.addressService.findByName(addressName);

                    ctx.session.step = undefined;

                    if (exists) {
                        return ctx.reply(t(lang, 'ADDRESS_EXISTS'));
                    }

                    await this.addressService.create(addressName);
                    return ctx.reply(t(lang, 'ADDRESS_ADDED'));
                }
                case 'add_parking_number': {
                    const number = ctx.message.text.trim();
                    ctx.session.temp.spotNumber = number;
                    ctx.session.step = 'add_parking_price';
                    return ctx.reply(t(lang, 'ENTER_PRICE'));
                }
                case 'add_parking_price': {
                    const price = parseFloat(ctx.message.text.trim());
                    if (isNaN(price)) {
                        return ctx.reply(t(lang, 'INVALID_PRICE'));
                    }
                    ctx.session.temp.price = price;
                    ctx.session.step = 'add_parking_currency';
                    return ctx.reply(t(lang, 'SELECT_CURRENCY'), {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '₴ UAH', callback_data: 'currency_UAH' },
                                    { text: '€ EUR', callback_data: 'currency_EUR' },
                                    { text: '$ USD', callback_data: 'currency_USD' },
                                ],
                            ],
                        },
                    });
                }
                default:
                    await ctx.reply('🤖 Я не зрозумів. Виберіть команду з меню.');
                    return;
            }
        });

        this.bot.callbackQuery(/^currency_(UAH|USD|EUR)$/, async (ctx) => {
            const currency = ctx.match[1] as 'UAH' | 'USD' | 'EUR';
            const telegramId = String(ctx.from.id);
            const user = await this.userService.findByTelegramId(telegramId);
            const lang = user?.language || 'uk';

            const { addressId, spotNumber, price } = ctx.session.temp;
            if (!addressId || !spotNumber || !price) {
                ctx.session.step = undefined;
                return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
            }

            const exists = await this.addressService.spotExists(addressId, spotNumber);
            if (exists) {
                ctx.session.step = undefined;
                return ctx.reply(t(lang, 'SPOT_ALREADY_EXISTS'));
            }

            await this.addressService.createSpot({
                addressId,
                ownerId: user!.id,
                spotNumber,
                price,
                currency,
            });

            ctx.session.step = undefined;
            ctx.session.temp = {};
            await ctx.answerCallbackQuery();
            await ctx.reply(t(lang, 'SPOT_ADDED'));
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

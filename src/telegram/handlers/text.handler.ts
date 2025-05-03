import { BotContext } from '../types';
import { t } from '../bot_messages';
import { UserService } from 'src/user/user.service';
import { AddressService } from 'src/address/address.service';
import { RentRequestService } from 'src/request/rent-request.service';
import { UserRole } from 'src/entities/user.entity';
import { TelegramService } from '../telegram.service';

export function registerTextHandler(
    telegramService: TelegramService,
    services: {
        userService: UserService;
        addressService: AddressService;
        rentRequestService: RentRequestService;
    }
) {
    const bot = telegramService.bot;
    bot.on('message:text', async (ctx) => {
        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        if (!user) return;
        const lang = user.language || 'uk';

        switch (ctx.session.step) {

            // === ADD ADDRESS ===
            case 'add_address_input': {
                const addressName = ctx.message.text.trim();
                const exists = await services.addressService.findByName(addressName);
                ctx.session.step = undefined;
                if (exists) return ctx.reply(t(lang, 'ADDRESS_EXISTS'));

                await services.addressService.create(addressName, user.id);
                return ctx.reply(t(lang, 'ADDRESS_ADDED'));
            }

            // === ADD PARKING ===
            case 'add_parking_number': {
                ctx.session.temp.spotNumber = ctx.message.text.trim();
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

            // === SET GUARD ===
            case 'set_guard_wait_username': {
                const username = ctx.message.text.trim().replace('@', '');
                const guard = await services.userService.findByUsername(username);

                if (!guard) {
                    ctx.session.step = undefined;
                    return ctx.reply(t(lang, 'GUARD_NOT_FOUND'));
                }

                ctx.session.temp.guardId = guard.id;
                ctx.session.step = 'set_guard_wait_address';

                const addresses = await services.addressService.findAll();
                return ctx.reply(t(lang, 'SELECT_ADDRESS_GUARD'), {
                    reply_markup: {
                        inline_keyboard: addresses.map(a => ([
                            { text: a.name, callback_data: `guard_address_${a.id}` },
                        ])),
                    },
                });
            }

            // === SEARCH PARKING SPOTS ===
            case 'search_input': {
                const query = ctx.message.text.trim();
                const spots = await services.addressService.searchAvailableSpotsByStreet(query);
                ctx.session.step = undefined;

                if (!spots.length) {
                    return ctx.reply(t(lang, 'SEARCH_NOT_FOUND'));
                }

                for (const spot of spots) {
                    await ctx.reply(
                        `${spot.address.name} — №${spot.spotNumber}\n💸 ${spot.price} ${spot.currency}`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: t(lang, 'RENT_THIS_SPOT'),
                                            callback_data: `rent_spot_${spot.id}`,
                                        },
                                    ],
                                ],
                            },
                        }
                    );
                }

                return;
            }


            // === RENT PARKING SPOT ===
            case 'rent_input_fio': {
                ctx.session.temp.fullName = ctx.message.text.trim();
                ctx.session.step = 'rent_input_phone';
                return ctx.reply(t(lang, 'RENT_ENTER_PHONE'));
            }

            case 'rent_input_phone': {
                ctx.session.temp.phone = ctx.message.text.trim();
                ctx.session.step = 'rent_input_ipn';
                return ctx.reply(t(lang, 'RENT_ENTER_TIN'));
            }

            case 'rent_input_ipn': {
                ctx.session.temp.ipn = ctx.message.text.trim();
                ctx.session.step = 'rent_input_payment_method';

                return ctx.reply(t(lang, 'RENT_ENTER_PAYMENT'), {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: t(lang, 'PAYMENT_METHOD_CASH'), callback_data: 'payment_CASH' },
                                { text: t(lang, 'PAYMENT_METHOD_CARD'), callback_data: 'payment_CARD' },
                            ],
                        ],
                    },
                });
            }

            // === CHECK CAR PLATE (GUARD) ===
            case 'enter_car_plate': {
                const plate = ctx.message.text.trim().toUpperCase();
                const spots = await services.addressService.findSpotsByCarPlateAndGuard(user.id, plate);
                ctx.session.step = undefined;

                if (!spots.length) {
                    return ctx.reply(t(lang, 'CAR_NOT_FOUND'));
                }

                const messages = spots.map(s =>
                    `${s.address.name} — ${s.spotNumber}, орендар: ${s.renter?.fullName || '-'}`
                );

                return ctx.reply(messages.join('\n'));
            }

            case 'grant_admin_input': {
                const username = ctx.message.text.trim().replace('@', '');
                const targetUser = await services.userService.findByUsername(username);

                ctx.session.step = undefined;

                if (!targetUser) {
                    return ctx.reply(t(lang, 'USER_NOT_FOUND'));
                }

                await services.userService.updateRole(targetUser.telegramId, UserRole.ADMIN);
                return ctx.reply(t(lang, 'ADMIN_GRANTED'));
            }

            default:
                await ctx.reply(t(lang, 'MISSUNDERSTANDING_COMMAND'));
        }
    });

    // === CALLBACK HANDLERS ===

    // CURRENCY SELECTION (ADD PARKING)
    bot.callbackQuery(/^currency_(UAH|USD|EUR)$/, async (ctx) => {
        const currency = ctx.match[1] as 'UAH' | 'USD' | 'EUR';
        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        if (!user) return;
        const lang = user.language || 'uk';

        const { addressId, spotNumber, price } = ctx.session.temp;
        if (!addressId || !spotNumber || !price) {
            ctx.session.step = undefined;
            ctx.session.temp = {};
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        const exists = await services.addressService.spotExists(addressId, spotNumber);
        if (exists) {
            ctx.session.step = undefined;
            ctx.session.temp = {};
            return ctx.reply(t(lang, 'SPOT_ALREADY_EXISTS'));
        }

        await services.addressService.createSpot({
            addressId,
            ownerId: user.id,
            spotNumber,
            price,
            currency,
        });

        ctx.session.step = undefined;
        ctx.session.temp = {};

        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'SPOT_ADDED'));
    });

    // PAYMENT METHOD SELECTION (RENT)
    bot.callbackQuery(/^payment_(CASH|CARD)$/, async (ctx) => {
        const paymentMethod = ctx.match[1] as 'CASH' | 'CARD';
        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        if (!user) return;
        const lang = user.language || 'uk';

        const { spotId, fullName, phone, ipn } = ctx.session.temp;
        if (!spotId || !fullName || !phone || !ipn) {
            ctx.session.step = undefined;
            ctx.session.temp = {};
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        try {
            const request = await services.rentRequestService.create({
                renterId: user.id,
                spotId,
                fullName,
                phone,
                ipn,
                paymentMethod,
            });
            await services.userService.updateFullname(telegramId, fullName);
            ctx.session.step = undefined;
            ctx.session.temp = {};

            await telegramService.notifyOwnerAboutRequest(request);
            await ctx.answerCallbackQuery();
            return ctx.reply(t(lang, 'RENT_REQUEST_SUBMITTED'));
        } catch (err) {
            if (err.message === 'RENT_DUPLICATE_IPN') {
                return ctx.reply(t(lang, 'RENT_DUPLICATE_IPN'));
            }
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }
        return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
    });

    // SET GUARD ADDRESS SELECTION
    bot.callbackQuery(/^guard_address_(\d+)$/, async (ctx) => {
        const addressId = Number(ctx.match[1]);
        const guardId = ctx.session.temp.guardId;
        const telegramId = String(ctx.from.id);
        const user = await services.userService.findByTelegramId(telegramId);
        const lang = (user && user.language) || 'uk';
        if (!user || !guardId) {
            ctx.session.step = undefined;
            ctx.session.temp = {};
            return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
        }

        await services.addressService.assignGuard(addressId, guardId);

        ctx.session.step = undefined;
        ctx.session.temp = {};
        await ctx.answerCallbackQuery();
        await ctx.reply(t(lang, 'GUARD_ASSIGNED'));
    });

    bot.callbackQuery(/^lang_(uk|en)$/, async (ctx) => {
        const lang = ctx.match[1] as 'uk' | 'en';
        const telegramId = String(ctx.from.id);
        await services.userService.updateLanguage(telegramId, lang);
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
}

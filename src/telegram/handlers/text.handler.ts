import { AppServices } from '../types';
import { t } from '../bot_messages';
import { UserRole } from 'src/entities/user.entity';
import { TelegramService } from '../telegram.service';
import { getSpotButtons } from '../commands/my-spots.command';

export function registerTextHandler(
    telegramService: TelegramService,
    services: AppServices,
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
                const telegramId = String(ctx.from.id);
                const user = await services.userService.findByTelegramId(telegramId);
                const lang = user?.language || 'uk';

                ctx.session.step = undefined;

                const spots = await services.addressService.searchAvailableSpots(query);

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
                ctx.session.step = undefined;

                const spotId = ctx.session.temp.spotId;
                if (!spotId) {
                    return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
                }

                const spot = await services.addressService.findSpotById(spotId);
                if (!spot || !spot.owner) {
                    return ctx.reply(t(lang, 'SOMETHING_WENT_WRONG'));
                }

                // Перевіряємо, чи власник має Portmone договори
                if (!spot.owner.portmoneMerchantId || !spot.owner.portmoneSecretKey) {
                    return ctx.reply(t(lang, 'OWNER_NO_PAYMENT'));
                }

                // Зберігаємо дані заявки в базу (PENDING), без підтвердження
                const request = await services.rentRequestService.create({
                    renterId: user!.id,
                    spotId: spot.id,
                    fullName: ctx.session.temp.fullName,
                    phone: ctx.session.temp.phone,
                    ipn: ctx.session.temp.ipn,
                    paymentMethod: 'CARD',
                });

                // Надсилаємо invoice через Telegram
                const price = Math.round(spot.price * 100); // у копійках
                await ctx.replyWithInvoice(
                    `${spot.address.name}, №${spot.spotNumber}`,
                    t(lang, 'PAYMENT_DESCRIPTION'),
                    `rent-${request.id}`,
                    spot.currency,
                    [{ label: t(lang, 'RENT_PAYMENT_LABEL'), amount: price }],
                    {
                        provider_token: services.configService.paymentProviderToken,
                        start_parameter: `rent-${request.id}`,
                        need_name: false,
                        need_email: true,
                        send_email_to_provider: true,
                    }
                );

                return;
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

            case 'edit_spot_price': {
                const price = parseFloat(ctx.message.text.trim());
                const telegramId = String(ctx.from.id);
                const user = await this.userService.findByTelegramId(telegramId);
                const lang = user?.language || 'uk';

                if (isNaN(price)) {
                    return ctx.reply(t(lang, 'INVALID_PRICE'));
                }

                const spotId = ctx.session.temp.spotId;
                await this.addressService.updateSpotPrice(spotId, price);

                const updatedSpot = await this.addressService.findSpotById(spotId);
                if (!updatedSpot) return;

                const isReservedByOwner = updatedSpot.renter?.id === user?.id;
                const renterName = updatedSpot.renter?.fullName ?? '-';
                const status = isReservedByOwner
                    ? t(lang, 'RESERVED_BY_YOU')
                    : updatedSpot.renter
                        ? t(lang, 'RENTED_BY', { name: renterName })
                        : t(lang, 'NOT_RENTED');

                const text = `${updatedSpot.address.name} — №${updatedSpot.spotNumber}\n💸 ${updatedSpot.price} ${updatedSpot.currency}\n${status}`;

                await ctx.api.editMessageText(
                    ctx.chat.id,
                    ctx.session.temp.messageId,
                    text,
                    { reply_markup: { inline_keyboard: getSpotButtons(updatedSpot, lang) } }
                );

                ctx.session.step = undefined;
                ctx.session.temp = {};
            }

            default:
                console.log('Not defined command', ctx.message.text);
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

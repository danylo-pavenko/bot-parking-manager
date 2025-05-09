import { InlineKeyboard } from 'grammy';
import { t } from '../bot_messages';
import { BotContext, Lang } from '../types';

export function getOwnerMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_MY_SPOTS'), 'menu_my_spots')
        .text(t(lang, 'MENU_BTN_ADD_ADDRESS'), 'menu_add_address')
        .text(t(lang, 'MENU_BTN_ADD_PARKING'), 'menu_add_parking')
        .row()
        .text(t(lang, 'MENU_BTN_JOIN_ADDRESS'), 'menu_join_address')
        .text(t(lang, 'MENU_BTN_SET_GUARD'), 'menu_set_guard')
        .row()
        .text(t(lang, 'MENU_BTN_CONFIRM_CASH'), 'menu_confirm_cash')
        .row()
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .text(t(lang, 'MENU_BTN_PARTNER'), 'menu_join_as_partner')
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language');
}

export function getRenterMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_RENT'), 'menu_rent')
        .text(t(lang, 'MENU_BTN_SEARCH'), 'menu_search')
        .row()
        .text(t(lang, 'MENU_BTN_MY_RENTALS'), 'menu_my_rentals')
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .row()
        .text(t(lang, 'MENU_BTN_JOIN_ADDRESS'), 'menu_join_address')
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language')
        .row()
        .text(t(lang, 'MENU_BTN_CANCEL_RENT'), 'menu_cancel_rent_requests');
}

export function getGuardMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_CHECK_CAR'), 'menu_check_car')
        .row()
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language');
}

import { InlineKeyboard } from 'grammy';
import { t } from '../bot_messages';
import { BotContext, Lang } from '../types';

export function getOwnerMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_ADD_ADDRESS'), 'menu_add_address')
        .text(t(lang, 'MENU_BTN_ADD_PARKING'), 'menu_add_parking')
        .row()
        .text(t(lang, 'MENU_BTN_JOIN_ADDRESS'), 'menu_join_address')
        .text(t(lang, 'MENU_BTN_SET_GUARD'), 'menu_set_guard')
        .row()
        .text(t(lang, 'MENU_BTN_MY_SPOTS'), 'menu_my_spots')
        .text(t(lang, 'MENU_BTN_WITHDRAW'), 'menu_withdraw')
        .row()
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language');
}

export function getRenterMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_SEARCH'), 'menu_search')
        .text(t(lang, 'MENU_BTN_MY_RENTALS'), 'menu_my_rentals')
        .row()
        .text(t(lang, 'MENU_BTN_JOIN_ADDRESS'), 'menu_join_address')
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .row()
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language');
}

export function getGuardMenu(language: Lang) {
    const lang = language || 'uk';
    return new InlineKeyboard()
        .text(t(lang, 'MENU_BTN_CHECK_CAR'), 'menu_check_car')
        .row()
        .text(t(lang, 'MENU_BTN_PROFILE'), 'menu_me')
        .text(t(lang, 'MENU_BTN_LANGUAGE'), 'menu_language');
}

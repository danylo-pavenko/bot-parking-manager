type Lang = 'uk' | 'en';

export const messages: Record<Lang, Record<string, string>> = {
    uk: {
        WELCOME: 'Вітаємо!',
        CHOOSE_LANGUAGE: 'Оберіть мову:',
        CHOOSE_ROLE: 'Оберіть свою роль:',
        REGISTRATION_DONE: '✅ Реєстрація завершена. Ви можете користуватись ботом.',
        ROLE_OWNER: '🅾 Власник',
        ROLE_RENTER: '🧍‍♂️ Орендар',
        ROLE_GUARD: '🛡️ Охоронець',
        LANGUAGE_UPDATED: '✅ Мову оновлено.',
        ONLY_OWNER: '❌ Ця команда доступна лише для власників паркомісць.',
        ENTER_ADDRESS_NAME: 'Введіть назву адреси:',
        ADDRESS_EXISTS: '❗️ Така адреса вже існує. Спробуйте іншу або використайте /join_address.',
        ADDRESS_ADDED: '✅ Адресу успішно додано.',
    },
    en: {
        WELCOME: 'Welcome!',
        CHOOSE_LANGUAGE: 'Choose language:',
        CHOOSE_ROLE: 'Choose your role:',
        REGISTRATION_DONE: '✅ Registration completed. You can now use the bot.',
        ROLE_OWNER: '🅾 Owner',
        ROLE_RENTER: '🧍‍♂️ Renter',
        ROLE_GUARD: '🛡️ Guard',
        LANGUAGE_UPDATED: '✅ Language updated.',
        ONLY_OWNER: '❌ This command is available only for parking owners.',
        ENTER_ADDRESS_NAME: 'Enter address name:',
        ADDRESS_EXISTS: '❗️ This address already exists. Try another or use /join_address.',
        ADDRESS_ADDED: '✅ Address successfully added.',
    },
};

export function t(lang: Lang, key: string): string {
    return messages[lang][key] || key;
}

import { BotContext } from '../types';

export function registerMainMenuHandlers(bot: BotContext) {
    bot.callbackQuery('menu_add_address', async (ctx) => ctx.reply('/add_address'));
    bot.callbackQuery('menu_add_parking', async (ctx) => ctx.reply('/add_parking'));
    bot.callbackQuery('menu_join_address', async (ctx) => ctx.reply('/join_address'));
    bot.callbackQuery('menu_set_guard', async (ctx) => ctx.reply('/set_guard'));
    bot.callbackQuery('menu_my_spots', async (ctx) => ctx.reply('/my_spots'));
    bot.callbackQuery('menu_withdraw', async (ctx) => ctx.reply('/withdraw'));

    bot.callbackQuery('menu_search', async (ctx) => ctx.reply('/search'));
    bot.callbackQuery('menu_my_rentals', async (ctx) => ctx.reply('/my_rentals'));

    bot.callbackQuery('menu_check_car', async (ctx) => ctx.reply('/check_car'));

    bot.callbackQuery('menu_me', async (ctx) => ctx.reply('/me'));
    bot.callbackQuery('menu_language', async (ctx) => ctx.reply('/language'));

    // Не забувай
    bot.callbackQuery(/.*/, async (ctx) => {
        await ctx.answerCallbackQuery();
    });
}

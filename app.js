const { Telegraf, session } = require('telegraf');
const { Stages } = require('./models/stages');
const { Config } = require('./config');

const Bot = new Telegraf(Config.bot.token);

Bot.use(session());
Bot.use(Stages.middleware());

Bot.on('text', async function (ctx) {
    if (ctx.update.message.text) {
        if (ctx.update.message.text == '29.01.2021') {
            await ctx.reply('Понял тебя! Сейчас поздравлю Аню');
            return ctx.telegram.sendMessage(Config.bot.options.admin, Config.b_day_message.text, Config.b_day_message.options);
        }
    }

    return ctx.scene.enter('start-scene');
});

Bot.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'bday') {
        try {
            await ctx.answerCbQuery(`Погодь секунду...`);
        } catch (error) {
            console.log(error);
        }

        return ctx.scene.enter('birthday-menu-scene');
    } else {
        try {
            await ctx.answerCbQuery(`Чёт не пойму этот коллбэк, зови Никиту`, true);
        } catch (error) {
            console.log(error);
        }
    }
});

Bot.launch();
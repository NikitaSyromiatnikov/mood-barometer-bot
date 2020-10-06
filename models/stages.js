const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Database = require('./database');
const { Reply } = require('./replies');

const Stages = new Stage();

const StartScene = new Scene('start-scene');
const MainMenuScene = new Scene('main-menu-scene');
const SelectMoodScene = new Scene('select-mood-scene');
const AccountMenuScene = new Scene('account-menu-scene');
const SendMessageScene = new Scene('send-message-scene');

StartScene.enter(async function (ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (user == undefined) {
        user = {
            id: ctx.from.id,
            username: ctx.from.username,
            subscribed: 1,
            status: 'user'
        };

        await Database.addUser(user);
        await ctx.reply(Reply.onStart.text, Reply.onStart.options);
    }

    return ctx.scene.enter('main-menu-scene');
});

MainMenuScene.enter(async function (ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (user.status == 'user')
        return ctx.reply(Reply.onMainMenu.text, Reply.onMainMenu.options);

    if (user.status == 'owner')
        return ctx.reply(Reply.onMainMenu.owner.text, Reply.onMainMenu.owner.options);
});

MainMenuScene.on('text', async function (ctx) {
    switch (ctx.update.message.text) {
        case '👤 Профиль':
            return ctx.scene.enter('account-menu-scene');

        case '❓ Узнать настроение':
            return await sendMood(ctx);

        case '✍️ Написать':
            return ctx.scene.enter('send-message-scene');

        case '😊 Моё настроение':
            return ctx.scene.enter('select-mood-scene');

        default:
            return ctx.reply(Reply.onWrong.text, Reply.onWrong.options);
    }
});

MainMenuScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'hide')
        return ctx.deleteMessage();
});

SendMessageScene.enter(async function (ctx) {
    return ctx.reply(Reply.onSendMessage.text, Reply.onSendMessage.options);
});

SendMessageScene.on('text', async function (ctx) {
    if (ctx.update.message.text == '❌ Отмена')
        return ctx.scene.enter('main-menu-scene');

    let response = {
        text: ctx.update.message.text,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отправить', callback_data: 'send' }, { text: 'Отменить', callback_data: 'decline' }]
                ]
            }
        }
    }

    ctx.session.message = {
        id: null,
        time: new Date().toTimeString(),
        date: new Date().toDateString(),
        text: ctx.update.message.text,
        from: ctx.from.id,
    };

    return ctx.reply(response.text, response.options);
});

SendMessageScene.on('callback_query', async function (ctx) {
    switch (ctx.update.callback_query.data) {
        case 'send':
            return await sendMessage(ctx);

        case 'decline':
            return ctx.deleteMessage();
    }
});

AccountMenuScene.enter(async function (ctx) {
    let user = await Database.getUser(ctx.from.id);

    let message = {
        text: '<b>Сейчас тебя поищу...</b>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: "HTML"
        }
    };

    await ctx.reply(message.text, message.options);

    let response = {
        text: `<b>Привет, @${user.username}</b>\n\n<i>Это кнопка которая отвечает за твою подписку на настроение Ани, я думаю разберёшься как это работает</i>`,
        options: {
            reply_markup: {
                inline_keyboard: []
            },
            parse_mode: 'HTML'
        }
    };

    if (user.subscribed == 1)
        response.options.reply_markup.inline_keyboard.push([{ text: 'Меня не парит', callback_data: 'unsubscribe' }]);

    if (user.subscribed == 0)
        response.options.reply_markup.inline_keyboard.push([{ text: 'Подписаться на обновления', callback_data: 'subscribe' }]);

    return ctx.reply(response.text, response.options);
});

AccountMenuScene.on('callback_query', async function (ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (ctx.update.callback_query.data == 'subscribe') {
        user.subscribed = 1;
        await Database.updateUser(user);
        await ctx.answerCbQuery('Ха-ха, так и знал', true);
    }

    if (ctx.update.callback_query.data == 'unsubscribe') {
        user.subscribed = 0;
        await Database.updateUser(user);
        await ctx.answerCbQuery('Ну и ладно');
    }

    let reply_markup = {
        inline_keyboard: []
    };

    if (user.subscribed == 1)
        reply_markup.inline_keyboard.push([{ text: 'Меня не парит', callback_data: 'unsubscribe' }]);

    if (user.subscribed == 0)
        reply_markup.inline_keyboard.push([{ text: 'Подписаться на обновления', callback_data: 'subscribe' }]);


    return ctx.editMessageReplyMarkup({ inline_keyboard: reply_markup.inline_keyboard });
});

AccountMenuScene.on('text', async function (ctx) {
    if (ctx.update.message.text == '◀️ Назад') {
        return ctx.scene.enter('main-menu-scene');
    } else {
        return ctx.reply(Reply.onWrong.text, Reply.onWrong.options);
    }
});

SelectMoodScene.enter(async function (ctx) {
    let response = {
        text: '<b>Оцени по шакле</b>\n\n<i>Этот градиент из смайликов, где лево это плохо, а право это хорошо</i>',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '😢', callback_data: '0' }, { text: '😔', callback_data: '1' }, { text: '😕', callback_data: '2' }, { text: 'd', callback_data: 's' }, { text: '😉', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }, { text: 'd', callback_data: 's' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
});

async function sendMood(ctx) {
    let mood = await Database.getMood();

    if (mood.length == 0)
        return ctx.reply('🧐 <b>Не знаю</b>\n\n<i>Аня давно мне ничего не говорила, честно говоря я и сам переживаю</i>', { parse_mode: 'HTML' });

    let latest = mood[mood.length - 1];

    let response = {
        text: `<b>Натсроение: </b>${latest.value}/10\n\n<b>${latest.caption}</b>\n<i>${latest.description}</i>\n\n<b>Последнее обновление: </b>\n${latest.date} в ${latest.time}`,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '👌 Понятно', callback_data: 'hide' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
}

async function sendMessage(ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (user.status == 'banned') {
        await ctx.answerCbQuery('Ты вёл себя плохо, не отправлю', true);
        return ctx.scene.enter('main-menu-scene');
    }

    await Database.addMessage(ctx.session.message);
    await ctx.answerCbQuery('Сообщение отправлено', true);
    return ctx.scene.enter('main-menu-scene');
}

Stages.register(StartScene, MainMenuScene, SelectMoodScene, SelectMoodScene, SendMessageScene, AccountMenuScene);

module.exports = { Stages };
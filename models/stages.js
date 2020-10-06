const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Database = require('./database');
const { Reply } = require('./replies');

const Stages = new Stage();

const StartScene = new Scene('start-scene');
const RateMoodScene = new Scene('rate-mood-scene');
const MainMenuScene = new Scene('main-menu-scene');
const SelectMoodScene = new Scene('select-mood-scene');
const AccountMenuScene = new Scene('account-menu-scene');
const SendMessageScene = new Scene('send-message-scene');
const DescribeMoodScene = new Scene('describe-mood-scene');

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
        text: '<b>Оцени по шкале</b>\n\n<i>Это набор смайликов который может описать твой вид или взгляд сейчас</i>\n\n<i>Не можешь найти подходящий? Просто отправь мне тот который посчитаешь нужным</i>',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '😢', callback_data: '😢' }, { text: '😞', callback_data: '😞' }, { text: '😒', callback_data: '😒' }],
                    [{ text: '😃', callback_data: '😃' }, { text: '😁', callback_data: '😁' }, { text: '😍', callback_data: '😍' }],
                    [{ text: '😉', callback_data: '😉' }, { text: '😝', callback_data: '😝' }, { text: '😡', callback_data: '😡' }],
                    [{ text: 'Установить отправленный', callback_data: 'set_sent' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
});

SelectMoodScene.on('text', async function (ctx) {
    if (ctx.update.message.text == '😊 Моё настроение')
        return ctx.scene.enter('select-mood-scene');

    if (ctx.update.message.text == '📥 Сообщения')
        return ctx.scene.enter('new-messages-scene');

    if (ctx.update.message.text == '📈 Статистика')
        return ctx.scene.enter('stat-menu-scene');

    ctx.session.caption = ctx.update.message.text;

    let response = {
        text: ctx.update.message.text,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Установить', callback_data: 'accept' }, { text: 'Отменить', callback_data: 'decline' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
});

SelectMoodScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'set_sent')
        return ctx.answerCbQuery('Отправь мне смайлик', true);

    if (ctx.update.callback_query.data == 'decline')
        return ctx.deleteMessage();

    if (ctx.update.callback_query.data == 'accept') {
        await ctx.answerCbQuery('Твоё настроение: ' + ctx.session.caption);
        return ctx.scene.enter('rate-mood-scene');
    }

    ctx.session.caption = ctx.update.callback_query.data;

    await ctx.answerCbQuery('Твоё настроение: ' + ctx.update.callback_query.data);
    return ctx.scene.enter('rate-mood-scene');
});

RateMoodScene.enter(async function (ctx) {
    ctx.session.value = 5.0;

    let response = {
        text: '<b>Ещё параметры</b>\n\n<i>А теперь пожалуйста оцени настроение цифрой\n\nДело в том что я ещё не умею понимать на сколько смайлики оценивают своё настроение по 10-ти бальной шкале</i>',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔽', callback_data: 'down' }, { text: `${ctx.session.value}/10`, callback_data: 'current' }, { text: '🔼', callback_data: 'up' }],
                    [{ text: 'Установить текущее', callback_data: 'set' }]
                ]
            },
            parse_mode: 'HTML'
        }
    };

    return ctx.reply(response.text, response.options);
});

RateMoodScene.on('callback_query', async function (ctx) {
    switch (ctx.update.callback_query.data) {
        case 'up':
            ctx.session.value++;
            return ctx.editMessageReplyMarkup({
                inline_keyboard: [
                    [{ text: '🔽', callback_data: 'down' }, { text: `${ctx.session.value}/10`, callback_data: 'current' }, { text: '🔼', callback_data: 'up' }],
                    [{ text: 'Установить текущее', callback_data: 'set' }]
                ]
            });

        case 'down':
            ctx.session.value--;
            return ctx.editMessageReplyMarkup({
                inline_keyboard: [
                    [{ text: '🔽', callback_data: 'down' }, { text: `${ctx.session.value}/10`, callback_data: 'current' }, { text: '🔼', callback_data: 'up' }],
                    [{ text: 'Установить текущее', callback_data: 'set' }]
                ]
            });

        case 'set':
            await ctx.answerCbQuery('Оценка настроения: ' + ctx.session.value);
            return ctx.scene.enter('describe-mood-scene');

        case 'current':
            return ctx.answerCbQuery(`Сейчас твоё настроение: ${ctx.session.value}/10`, true);
    }
});

DescribeMoodScene.enter(async function (ctx) {
    let response = {
        text: '<b>Напиши мне почему так</b>\n\n<i>Что тебя порадовало или наоборот расстроило? Это важно для меня</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: 'Не скажу' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
});

DescribeMoodScene.on('text', async function (ctx) {
    ctx.session.description = ctx.update.message.text;

    let mood = {
        id: null,
        time: new Date().toTimeString(),
        date: new Date().toDateString(),
        caption: ctx.session.caption,
        description: ctx.session.description,
        value: ctx.session.value
    };

    ctx.session.mood = mood;

    console.log(mood);

    if (mood.description == 'Не скажу')
        mood.description = 'Не говорит почему';

    let response = {
        text: `<b>Обновить настроение</b>\n\n<b>Натсроение: </b>${mood.value}/10\n\n<b>${mood.caption}</b>\n<i>${mood.description}</i>\n\n<b>Последнее обновление: </b>\n${mood.date} в ${mood.time}`,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Обновить', callback_data: 'accept' }, { text: 'Удалить', callback_data: 'decline' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    return ctx.reply(response.text, response.options);
});

DescribeMoodScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'accept') {
        await Database.addMood(ctx.session.mood);
        await ctx.answerCbQuery('Сохраняю настроение');
    } else
        await ctx.deleteMessage();

    return ctx.scene.enter('main-menu-scene');
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

Stages.register(StartScene, MainMenuScene, SelectMoodScene, SelectMoodScene, SendMessageScene, AccountMenuScene, RateMoodScene, DescribeMoodScene);

module.exports = { Stages };
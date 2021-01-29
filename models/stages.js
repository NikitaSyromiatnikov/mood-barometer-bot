const fs = require('fs');
const path = require('path');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Database = require('./database');
const { Reply } = require('./replies');

const Stages = new Stage();

const StartScene = new Scene('start-scene');
const StatMenuScene = new Scene('stat-menu-scene');
const RateMoodScene = new Scene('rate-mood-scene');
const MainMenuScene = new Scene('main-menu-scene');
const SelectMoodScene = new Scene('select-mood-scene');
const AccountMenuScene = new Scene('account-menu-scene');
const SendMessageScene = new Scene('send-message-scene');
const DescribeMoodScene = new Scene('describe-mood-scene');
const ReviewMessagesScene = new Scene('review-messages-scene');

const BirthdayMenuScene = new Scene('birthday-menu-scene');

BirthdayMenuScene.enter(async function (ctx) {
    return ctx.reply(`😘 <b>Рад что ты спросила</b>\n\n<i>А потом можно что угодно, понимаю что ты ещё сонная муха, но надеюсь что кофеяка тебя взбодрил, иначе конечно же не выйдет...</i>\n\n<i>Тыкни на кнопочку когда взбодришься</i>`, {
        parse_mode: 'HTML', reply_markup: {
            inline_keyboard: [
                [{ text: '☕️ Выпила я кофечку', callback_data: 'coffe' }]
            ]
        }
    });
});

BirthdayMenuScene.on('text', async function (ctx) {

});

BirthdayMenuScene.on('callback_query', async function (ctx) {
    switch (ctx.update.callback_query.data) {
        case 'coffe':
            await ctx.answerCbQuery(`Умница!`, true);
            return ctx.reply(`👍 <b>Ну тогда приступим!</b>\n\n<i>Я понимаю что бывает тяжело сказать "Да, я точно знаю что я сегодня буду делать", тяжело выбрать себе развлечение, но к счастью некоторые из них я собрал в пак идей которые помогут начать, а там будь что будет</i>`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🍆 Я овощ', callback_data: 'calm' }, { text: '💃 Тусовка', callback_data: 'dance' }],
                        [{ text: '...', callback_data: 'more' }],
                    ]
                },
                parse_mode: 'HTML'
            });

        case 'calm':
            await ctx.answerCbQuery(`Ещё какой ;) Хотя можешь посмотреть - https://eksmo.ru/test/kakoy-vy-ovoshch/`, true);
            return ctx.reply(`Тогда можем посмотреть <a href="https://kinogo.biz/9972-igra-prestolov.html">Игру престолов</a>, мы вроде как остановились на 4м сезоне 7й серии`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🙈 Скрыть', callback_data: 'hide' }]
                    ]
                }
            });

        case 'dance':
            await ctx.answerCbQuery(`Лэггоу`, true);
            return ctx.reply(`🎂 <b>Отличная идея!</b> Надо вызывать такси и ехать далеко-далеко, но хорошо что хоть не сама)\n\nПриготовил тебе плейлист с 20-ти клёвых треков, надеюсь тебе понравятся`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🤟 Плейлист', url: 'https://music.youtube.com/playlist?list=PLZGKZrV5CavFrgmqPTvnTsS25-Rj2icu8' }],
                        [{ text: '🙈 Скрыть', callback_data: 'hide' }]
                    ]
                }
            });

        case 'more':
            await ctx.answerCbQuery(`Хух`, true);
            return ctx.reply(`<b>Бусина</b>\n\nЯ конечно понимаю что выбор совсем небольшой, усталь и засыпаю, я вот сижу выдумываю как бы сделать завтра ярким и запоминающимся, но в момент показалось что я забыл тебя поздравить Я бы хотел сделать это вместе с тобой, вспомнить яркие моменты и добавить новых, разбуди меня если я всё ещё сплю, не хочу пропустить эту радость`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🙈 Скрыть', callback_data: 'hide' }]
                    ]
                }
            });


        case 'hide':
            return ctx.deleteMessage();

        default:
            return ctx.answerCbQuery(`Блин блять! Чёт не так, Никиту зови - пусть чинит`, true);
    }
})

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

StartScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'messages') {
        await ctx.answerCbQuery('Загружаю смски');
        return ctx.scene.enter('review-messages-scene');
    }
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

        case '❓ Последнее':
        case '❓ Узнать настроение':
            return await sendMood(ctx);

        case '✍️ Написать':
            return ctx.scene.enter('send-message-scene');

        case '😊 Моё настроение':
            return ctx.scene.enter('select-mood-scene');

        case '📥 Сообщения':
            return ctx.scene.enter('review-messages-scene');

        case '📈 Статистика':
            return ctx.scene.enter('stat-menu-scene');

        default:
            return ctx.reply(Reply.onWrong.text, Reply.onWrong.options);
    }
});

MainMenuScene.on('callback_query', async function (ctx) {
    if (ctx.update.callback_query.data == 'hide')
        return ctx.deleteMessage();

    if (ctx.update.callback_query.data == 'messages')
        return ctx.scene.enter('review-messages-scene');
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
    };

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
    let message = {
        text: '<b>Изменить настроение</b>\n\n<i>Если оно не изменилось - нажми кнопку назад</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }

    await ctx.reply(message.text, message.options);

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
    if (ctx.update.message.text == '◀️ Назад')
        return ctx.scene.enter('main-menu-scene');

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
        let users = await Database.getUsers();
        for (let i = 0; i < users.length; i++)
            ctx.telegram.sendMessage(user[i].id, '<b>Настроение изменилось, посмотри как она!</b>', { parse_mode: 'HTML' });
    } else
        await ctx.deleteMessage();

    return ctx.scene.enter('main-menu-scene');
});

ReviewMessagesScene.enter(async function (ctx) {
    let message = {
        text: '<b>Сейчас поищу твои сообщения</b>\n\n<i>Обычно это занимает мало времени</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    };

    await ctx.reply(message.text, message.options);

    let response = {
        text: '📥 <b>Входящие сообщения</b>\n\n<i>Нажми чтобы посмотреть больше</i>',
        options: {
            reply_markup: {
                inline_keyboard: []
            },
            parse_mode: 'HTML'
        }
    }

    let messages = await Database.getMessages();

    for (let i = 0; i < messages.length; i++) {
        let user = await Database.getUser(messages[i].from);
        response.options.reply_markup.inline_keyboard.push([{ text: `@${user.username}`, callback_data: `message-${messages[i].id}` }]);
    }

    return ctx.reply(response.text, response.options);
});

ReviewMessagesScene.on('callback_query', async function (ctx) {
    let array = String(ctx.update.callback_query.data).split('-');
    let user = {};
    let query = {
        payload: array[0],
        data: array[1]
    };

    switch (query.payload) {
        case 'message':
            let message = await Database.getMessage(query.data);
            user = await Database.getUser(message.from);

            await ctx.answerCbQuery('Загрузка сообщения');

            let response = {
                text: `📥 <b>Сообщение от @${user.username}:</b>\n\n${message.date} ${message.time}\n\n<i>${message.text}</i>`,
                options: {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Забанить к хуям', callback_data: `ban-${user.id}` }],
                            [{ text: 'Сообщение', url: `t.me/${user.username}` }, { text: 'Спрятать', callback_data: 'hide' }]
                        ]
                    },
                    parse_mode: 'HTML'
                }
            }
            return ctx.reply(response.text, response.options);

        case 'ban':
            user = await Database.getUser(query.data);
            user.status = 'banned';
            await Database.updateUser(user);
            await ctx.answerCbQuery(`Пользователь @${user.username} забанен к хуям`);
            return ctx.deleteMessage();

        case 'hide':
            return ctx.deleteMessage();
    }

});

ReviewMessagesScene.on('text', async function (ctx) {
    if (ctx.update.message.text == '◀️ Назад')
        return ctx.scene.enter('main-menu-scene');
});

StatMenuScene.enter(async function (ctx) {
    let response = {
        text: `<b>Статистика:</b>\n\n<i>Пожалуйста подождите</i>`,
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '◀️ Назад' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }

    await getStat(ctx);
    await ctx.reply(response.text, response.options);
    return ctx.telegram.sendDocument(ctx.from.id, { source: path.resolve(__dirname, '..', 'data', `${ctx.session.latest_filename}.html`), caption: `${ctx.session.latest_filename}` }, { reply_markup: { inline_keyboard: [[{ text: 'Сайт в интернете', url: 'https://nikitasyromiatnikov.github.io/mood-barometer-bot/' }]] } });
});

StatMenuScene.on('text', async function (ctx) {
    if (ctx.update.message.text == '◀️ Назад')
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

    await ctx.reply(response.text, response.options);
}

async function sendMessage(ctx) {
    let user = await Database.getUser(ctx.from.id);

    if (user.status == 'banned') {
        await ctx.answerCbQuery('Ты вёл себя плохо, не отправлю', true);
        return ctx.scene.enter('main-menu-scene');
    }

    await Database.addMessage(ctx.session.message);
    await ctx.answerCbQuery('Сообщение отправлено', true);

    let notification = {
        to: await Database.getOwners(),
        text: `<b>Привет, Аня, тебе прислали новое сообщение 💌</b>`,
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚶‍♀️ В сообщения', callback_data: 'messages' }]
                ]
            },
            parse_mode: 'HTML'
        }
    }

    for (let i = 0; i < notification.to.length; i++) {
        ctx.telegram.sendMessage(notification.to[i].id, notification.text, notification.options);
    }

    return ctx.scene.enter('main-menu-scene');
}

async function getStat(ctx) {
    let moods = await Database.getMood();
    let messages = await Database.getMessages();

    let latest = moods[moods.length - 1];
    let average = 0;

    for (let i = 0; i < moods.length; i++)
        average += moods[i].value;

    average = Number(average / moods.length).toFixed(2);

    let fileContents = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'stat.html'), 'utf8', function (error) {
        if (error)
            throw new Error(error);
    });

    fileContents = fileContents.replace("AVERAGE_VALUE", average);
    fileContents = fileContents.replace("LATEST_VALUE", Number(latest.value).toFixed(2));
    fileContents = fileContents.replace("LATEST_DATE", latest.date);
    fileContents = fileContents.replace("LATEST_TEXT", latest.description);
    fileContents = fileContents.replace("MESSAGES_AMOUNT", messages.length);
    fileContents = fileContents.replace("USERNAME", "Nikita_sm");
    fileContents = fileContents.replace("USERNAME", "Nikita_sm");

    fs.writeFileSync(path.resolve(__dirname, '..', 'data', `${new Date().toDateString()}.html`), fileContents, { encoding: 'utf-8' });
    fs.writeFileSync(path.resolve(__dirname, '..', 'docs', `index.html`), fileContents, { encoding: 'utf-8' });

    ctx.session.latest_filename = new Date().toDateString();
    return average;
}

Stages.register(StartScene, MainMenuScene, SelectMoodScene, SelectMoodScene, SendMessageScene, AccountMenuScene, RateMoodScene, DescribeMoodScene, ReviewMessagesScene, StatMenuScene, BirthdayMenuScene);

module.exports = { Stages };

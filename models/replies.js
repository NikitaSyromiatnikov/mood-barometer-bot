const Reply = {
    onStart: {
        text: '<b>Привет, мой милый друг</b>\n\n<i>Этот бот - барометр настроения Анны Кузнецовой, подпишись на уведомления о смене её настроения чтобы понимать что происходит</i>',
        options: {
            parse_mode: 'HTML'
        }
    },
    onMainMenu: {
        text: '<b>Главное меню:</b>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '❓ Узнать настроение' }],
                    [{ text: '👤 Профиль' }, { text: '✍️ Написать' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        },
        owner: {
            text: '<b>Главное меню:</b>',
            options: {
                reply_markup: {
                    keyboard: [
                        [{ text: '😊 Моё настроение' }],
                        [{ text: '📥 Сообщения' }, { text: '📈 Статистика' }]
                    ],
                    resize_keyboard: true
                },
                parse_mode: 'HTML'
            },
        }
    },
    onWrong: {
        text: '😔 <b>Я тебя не понимаю</b>\n\n<i>Знаешь, а ведь у меня есть клавиатура чтобы со мной было проще общаться</i>',
        options: {
            parse_mode: 'HTML'
        }
    },
    onSendMessage: {
        text: '✍️ <b>Отправить сообщение</b>\n\n<i>Пожалуйста, не пиши Ане всякие гадости, ты ведь не хочешь испортить ей настроение?\n\nА хотя вряд ли у тебя получится.. Кстати она может и ответит тебе, если напишешь что-то хорошее</i>',
        options: {
            reply_markup: {
                keyboard: [
                    [{ text: '❌ Отмена' }]
                ],
                resize_keyboard: true
            },
            parse_mode: 'HTML'
        }
    }
};

module.exports = { Reply };
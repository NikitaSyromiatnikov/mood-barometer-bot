const Config = {
    bot: {
        token: '1383303234:AAEDgABa8SUMWqlGHS54bVojR18YZtW3Wsg',
        options: {
            owner: 295888907,
            admin: 298784500
        }
    },
    queries: [
        `CREATE TABLE IF NOT EXISTS "users" (
            "id"	        INTEGER UNIQUE,
            "username"	    TEXT,
            "subscribed"	INTEGER,
            "status"        TEXT,
            PRIMARY KEY("id")
        );`,
        `CREATE TABLE IF NOT EXISTS "mood" (
            "id"	        INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
            "time"	        TEXT,
            "date"	        TEXT,
            "caption"	    TEXT,
            "description"	TEXT,
            "value"	        INTEGER
        );`,
        `CREATE TABLE IF NOT EXISTS "messages" (
            "id"	        INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
            "time"	        TEXT,
            "date"	        TEXT,
            "text"  	    TEXT,
            "from"	        INTEGER
        );`
    ],
    b_day_message:
    {
        text: '😊 <b>С днём варенья!</b>\n\n<i>Безусловно это важный день в твоей жизни, как ни как но целых 20 рокив выповнылось\n\nПредлагаю немного шаблонно начать этот замечательный день (с кофеяки например), ну а потооом...</i>',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'А что потом??', callback_data: 'bday' }]
                ]
            },
            parse_mode: 'HTML'
        }

    }
};

module.exports = { Config };
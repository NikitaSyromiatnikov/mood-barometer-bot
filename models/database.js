const path = require('path');

const { Database } = require('sqlite3');
const { Config } = require('../config');

const database = new Database(path.resolve(__dirname, '..', 'data', 'bot.db'), function (error) {
    if (error)
        throw new Error(error);

    for (let i = 0; i < Config.queries.length; i++) {
        database.run(Config.queries[i], function (error) {
            if (error)
                throw new Error(error);
        });
    }

    console.log('database prepared');
});

async function addUser(user) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT INTO "users" VALUES (:id, :username, :subscribed, :status)`, {
            ':id': user.id,
            ':username': user.username,
            ':subscribed': user.subscribed,
            ':status': user.status
        }, function (error) {
            if (error)
                reject(error);

            resolve(user);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

async function getUser(id) {
    return new Promise(function (resolve, reject) {
        database.get(`SELECT * FROM "users" WHERE id = :id`, {
            ':id': id
        }, function (error, row) {
            if (error)
                reject(error);

            resolve(row);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

async function updateUser(user) {
    return new Promise(function (resolve, reject) {
        database.run(`UPDATE "users" SET subscribed = :subscribed WHERE id = :id`, {
            ':subscribed': user.subscribed,
            ':id': user.id
        }, function (error) {
            if (error)
                reject(error);

            resolve(user);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

async function getMood() {
    return new Promise(function (resolve, reject) {
        database.all(`SELECT * FROM "mood"`, function (error, rows) {
            if (error)
                reject(error);

            resolve(rows);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

async function addMessage(message) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT INTO "messages" VALUES (:id, :time, :date, :text, :from)`, {
            ':id': message.id,
            ':time': message.time,
            ':date': message.date,
            ':text': message.text,
            ':from': message.from
        }, function (error) {
            if (error)
                reject(error);

            resolve(message);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

module.exports = { addUser, getUser, updateUser, getMood, addMessage };
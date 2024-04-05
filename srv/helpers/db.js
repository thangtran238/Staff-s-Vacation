const cds = require('@sap/cds');

const connection = async () => {
    const db = await cds.connect.to('db');
    return db;
}

module.exports = connection;
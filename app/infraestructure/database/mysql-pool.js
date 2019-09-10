'use strict';

const mysql = require('mysql2/promise');

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_PORT,
  MYSQL_DATABASE,
} = process.env;

async function connect() {
  const options = {
    connectionLimit: 10,
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT,
    timezone: 'Z',
    typeCast(field, next) {
      // https://github.com/sidorares/node-mysql2/issues/262
      if (field.type === 'DATETIME') {
        const utcTime = Math.floor((new Date(`${field.string()} UTC`)).getTime() / 1000);
        const fixedDate = new Date(0);
        fixedDate.setUTCSeconds(utcTime);

        return fixedDate;
      }
      return next();
    },
    // debug: true,
    multipleStatements: true,
  };

  /**
   * Create connection pool and
   * promisify it to use async / await
   */
  const pool = mysql.createPool(options);
  this.pool = pool;
  // this.pool = pool.promise();

  try {
    const connection = await this.pool.getConnection();

    if (connection) {
      connection.release();
    }
  } catch (e) {
    console.error('mysql pool connect', e);
    throw e;
  }
}

async function getConnection() {
  if (this.pool === null) {
    throw new Error("MySQL connection didn't established. You must connect first.");
  }

  const connection = await this.pool.getConnection();

  return connection;
}

module.exports = {
  connect,
  getConnection,
};

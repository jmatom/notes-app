'use strict';

const fs = require('fs');
fs.existsSync('./.env') && require('dotenv').config();
const webServer = require('./app/infraestructure/webserver');
const mysqlPool = require('./app/infraestructure/database/mysql-pool');

const httpListeningPort = process.env.PORT;

/**
 * Initialize dependencies
 * */
(async function initApp() {
  try {
    await mysqlPool.connect();
    await webServer.listen(httpListeningPort);
    console.log(`server running at: ${httpListeningPort}`);
  } catch (e) {
    await webServer.close();
    console.error(e);
    process.exit(1);
  }
}());

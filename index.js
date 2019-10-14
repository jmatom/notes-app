'use strict';

require('dotenv').config();
const webServer = require('./app/webserver');
const mysqlPool = require('./app/database/mysql-pool');

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

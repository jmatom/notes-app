'use strict';

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
let server = null;
app.use(bodyParser.json());

/**
 * Enable CORS with a origin whitelist of valid domains
 */
app.use(cors());

/**
 * Add all routes
 */
app.use('/api/account', routes.account);
app.use('/api/auth', routes.auth);
app.use('/api/tags', routes.tag);

app.get('/', (req, res, next) => {
  res.send('base url: /api');
});

app.use((req, res, next) => {
  res.status(404).send('Sorry, API endpoint not found!');
});

/**
 * Special route to catch all next(err) generated by controllers
 */
app.use((err, req, res, next) => {
  if (err.name === 'NotesAppError') {
    const { status, errors } = err;

    return res.status(status).json(errors);
  }

  console.error('Error 500', err);
  res.status(500).json({
    message: err.message,
  });
});

/**
 * Start listening requests at a given port
 * @param {Number} port
 */
async function listen(port) {
  if (server === null) {
    server = await app.listen(port);
  } else {
    console.error("Can't listen, server already initialized");
  }
}

/**
 * Stop listening requests
 */
async function close() {
  if (server) {
    await server.close();
    server = null;
  } else {
    console.error("Can't close a non started server");
  }
}

module.exports = {
  listen,
  close,
};

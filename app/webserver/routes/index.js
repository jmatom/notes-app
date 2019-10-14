'use strict';

const account = require('./account-router');
const auth = require('./auth-router');
const tag = require('./tag-router');

module.exports = {
  account,
  auth,
  tag,
};

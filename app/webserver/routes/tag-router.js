'use strict';

const router = require('express').Router();
const createTag = require('../controllers/tag/create-tag-controller');
const checkAccountSession = require('../controllers/account/check-account-session');

router.post('/', checkAccountSession, createTag);

module.exports = router;

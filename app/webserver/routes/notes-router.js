'use strict';

const router = require('express').Router();
const createNote = require('../controllers/notes/create-note-controller');
const checkAccountSession = require('../controllers/account/check-account-session');

router.post('/', checkAccountSession, createNote);

module.exports = router;

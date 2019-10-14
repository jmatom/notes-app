'use strict';

const router = require('express').Router();
const createNote = require('../controllers/notes/create-note-controller');
const checkAccountSession = require('../controllers/account/check-account-session');
const getNotes = require('../controllers/notes/get-notes-controller');

router.post('/', checkAccountSession, createNote);
router.get('/', checkAccountSession, getNotes);

module.exports = router;

'use strict';

const router = require('express').Router();
const createNote = require('../controllers/notes/create-note-controller');
const checkAccountSession = require('../controllers/account/check-account-session');
const deleteNote = require('../controllers/notes/delete-note-controller');
const getNote = require('../controllers/notes/get-note-controller');
const getNotes = require('../controllers/notes/get-notes-controller');

router.post('/', checkAccountSession, createNote);
router.get('/', checkAccountSession, getNotes);
router.get('/:noteId', checkAccountSession, getNote);
router.delete('/:noteId', checkAccountSession, deleteNote);

module.exports = router;

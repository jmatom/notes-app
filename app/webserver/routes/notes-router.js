'use strict';

const router = require('express').Router();
const addTagToNote = require('../controllers/notes/add-tag-note-controller');
const createNote = require('../controllers/notes/create-note-controller');
const checkAccountSession = require('../controllers/account/check-account-session');
const deleteNote = require('../controllers/notes/delete-note-controller');
const deleteTagFrormNote = require('../controllers/notes/delete-tag-note-controller');
const getNote = require('../controllers/notes/get-note-controller');
const getNotes = require('../controllers/notes/get-notes-controller');
const updateNote = require('../controllers/notes/update-note-controller');

router.post('/', checkAccountSession, createNote);
router.get('/', checkAccountSession, getNotes);
router.get('/:noteId', checkAccountSession, getNote);
router.put('/:noteId', checkAccountSession, updateNote);
router.delete('/:noteId', checkAccountSession, deleteNote);
router.post('/:noteId/tags', checkAccountSession, addTagToNote);
router.delete('/:noteId/tags/:tagId', checkAccountSession, deleteTagFrormNote);

module.exports = router;

'use strict';

const router = require('express').Router();
const createTag = require('../controllers/tag/create-tag-controller');
const checkAccountSession = require('../controllers/account/check-account-session');
const getTag = require('../controllers/tag/get-tag-controller');

router.post('/', checkAccountSession, createTag);
router.get('/:tagId', checkAccountSession, getTag);

module.exports = router;

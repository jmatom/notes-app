'use strict';

const router = require('express').Router();
const createTag = require('../controllers/tag/create-tag-controller');

router.post('/', createTag);

module.exports = router;

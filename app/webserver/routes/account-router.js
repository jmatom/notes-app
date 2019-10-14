'use strict';

const router = require('express').Router();
const createAccount = require('../controllers/account/create-account-controller');

router.post('/', createAccount);

module.exports = router;

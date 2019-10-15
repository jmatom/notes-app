'use strict';

const router = require('express').Router();
const createAccount = require('../controllers/account/create-account-controller');
const activateAccount = require('../controllers/account/activate-account-controller');

router.post('/', createAccount);
router.get('/activation', activateAccount);

module.exports = router;

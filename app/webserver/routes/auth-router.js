'use strict';

const router = require('express').Router();
const login = require('../controllers/auth/auth-login-controller');

router.post('/', login);

module.exports = router;

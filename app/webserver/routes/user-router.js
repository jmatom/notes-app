'use strict';

const multer = require('multer');
const router = require('express').Router();
const checkAccountSession = require('../controllers/account/check-account-session');
const uploadAvatar = require('../controllers/user/upload-avatar-controller');

const upload = multer();

router.post('/avatar', checkAccountSession, upload.single('avatar'), uploadAvatar);

module.exports = router;

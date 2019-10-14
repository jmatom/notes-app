'use strict';

const jwt = require('jsonwebtoken');

const {
  AUTH_JWT_SECRET: authJwtSecret,
} = process.env;

async function checkAccountSession(req, res, next) {
  // checkeará el token jwt que viene en el header como authorization
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send();
  }

  //   if (!authorization.startsWith('Bearer '))
  const [prefix, token] = authorization.split(' '); // [Bearer, xxxx]
  if (prefix !== 'Bearer') {
    return res.status(401).send();
  }

  if (!token) {
    return res.status(401).send();
  }

  try {
    const decoded = jwt.verify(token, authJwtSecret);

    req.claims = {
      uuid: decoded.uuid,
      role: decoded.role,
    };

    return next();
  } catch (e) {
    return res.status(401).send();
  }
}

module.exports = checkAccountSession;

'use strict';

const bcrypt = require('bcrypt');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const mysqlPool = require('../../../database/mysql-pool');

function validateData(payload) {
  const schema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required(),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
}

async function login(req, res, next) {
  const authData = req.body;

  try {
    await validateData(authData);
  } catch (e) {
    return res.status(400).send(e);
  }

  try {
    const connection = await mysqlPool.getConnection();
    const sqlQuery = `SELECT
      u.id, u.email, u.password
      FROM users u
      JOIN users_activation ua
        ON u.id = ua.user_id
      WHERE u.email = '${authData.email}'
        AND ua.verified_at IS NOT NULL
      ORDER BY ua.verified_at DESC
      LIMIT 1`;

    const [result] = await connection.query(sqlQuery);
    if (result.length !== 1) {
      return res.status(401).send();
    }

    const userData = result[0];
    const isPasswordOk = await bcrypt.compare(authData.password, userData.password);
    if (isPasswordOk === false) {
      return res.status(401).send();
    }

    /**
     * Generate JWT token containing userId + role (admin/user/whatever)
     * Token expiration 1 minute to test it, we can modify the env var to adjust it
     * per environment
     */
    const payloadJwt = {
      userId: userData.id,
      role: 'user',
    };

    const jwtTokenExpiration = parseInt(process.env.AUTH_ACCESS_TOKEN_TTL, 10);
    const token = jwt.sign(payloadJwt, process.env.AUTH_JWT_SECRET, { expiresIn: jwtTokenExpiration });
    const response = {
      accessToken: token,
      expiresIn: jwtTokenExpiration,
    };

    return res.send(response);
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
}

module.exports = login;

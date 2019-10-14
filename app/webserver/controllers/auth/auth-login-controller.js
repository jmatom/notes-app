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
      id, email, password, activated_at
      FROM users
      WHERE email = '${authData.email}'`;
    const [result] = await connection.query(sqlQuery);
    if (result.length !== 1) {
      return res.status(401).send();
    }

    const userData = result[0];
    const isPasswordOk = await bcrypt.compare(authData.password, userData.password);
    if (isPasswordOk === false) {
      return res.status(401).send();
    }

    /* TODO: activate account flow */
    /*
    if (!userData.activated_at) {
      return res.status(403).send('Account is not verified');
    }
    */

    /**
     * Paso 4: Generar token JWT con uuid + role (admin) asociado al token
     * La duración del token es de 1 minuto (podria ir en variable de entorno)
     */
    const payloadJwt = {
      uuid: userData.id,
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

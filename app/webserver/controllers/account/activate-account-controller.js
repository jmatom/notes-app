'use strict';

const mysqlPool = require('../../../database/mysql-pool');

async function activate(req, res, next) {
  const {
    verification_code: verificationCode,
  } = req.query;

  if (!verificationCode) {
    return res.status(400).json({
      message: 'invalid verification code',
    });
  }

  const now = new Date().toISOString().substring(0, 19).replace('T', ' ');
  const sqlActivateQuery = `UPDATE users_activation
    SET verified_at = ?
    WHERE verification_code = ?
    AND verified_at IS NULL`;

  console.log(now);
  try {
    const connection = await mysqlPool.getConnection();
    const [resultActivation] = await connection.execute(sqlActivateQuery, [now, verificationCode]);
    connection.release();

    if (resultActivation.affectedRows !== 1) {
      return res.send('Account not activated, verification code expired. Try resetting the password.');
    }

    return res.send('account activated');
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
}

module.exports = activate;

'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validate(payload) {
  const schema = Joi.object({
    tagId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
  });

  Joi.assert(payload, schema);
}

async function getTag(req, res, next) {
  const tagId = req.params.tagId;
  const userId = req.claims.userId;

  const payload = {
    tagId,
    userId,
  };

  try {
    await validate(payload);
  } catch (e) {
    return res.status(400).send(e);
  }

  try {
    const connection = await mysqlPool.getConnection();
    const getTagQuery = `SELECT id, tag, created_at, updated_at
      FROM tags 
      WHERE user_id = ?
        AND id = ?`;
    const [results] = await connection.execute(getTagQuery, [userId, tagId]);
    connection.release();
    if (results.length < 1) {
      return res.status(404).send();
    }

    const [tagData, ] = results;

    return res.send({
      data: tagData,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = getTag;

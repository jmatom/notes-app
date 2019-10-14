'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validate(payload) {
  const schema = Joi.object({
    tagId: Joi.string().guid({
      version: ['uuidv4'],
    }),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
}

async function getTags(req, res, next) {
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
      ORDER BY tag`;
    const [tagsData] = await connection.execute(getTagQuery, [userId]);
    connection.release();

    const tagResponse = {
      data: tagsData,
    };

    return res.send(tagResponse);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = getTags;

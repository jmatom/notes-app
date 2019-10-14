'use strict';

const Joi = require('@hapi/joi');
const uuidV4 = require('uuid/v4');
const mysqlPool = require('../../../database/mysql-pool');

const httpServerDomain = process.env.HTTP_SERVER_DOMAIN;

async function validateSchema(payload) {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(40).required(),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
}

/**
 * Create a new tag if does not exist
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Object} Tag created
 */
async function createTag(req, res, next) {
  const { userId } = req.claims;
  const tagData = {
    ...req.body,
    userId,
  };

  try {
    await validateSchema(tagData);
  } catch (e) {
    console.error(e);
    return res.status(400).send(e);
  }

  // Check if tag exists. If exist, return it
  try {
    const connection = await mysqlPool.getConnection();
    const sqlQuery = `SELECT id 
      FROM tags
      WHERE tag = '${tagData.name}'
      AND user_id = '$userId'`;

    // const [r] = connection.execute('SELECT id FROM tags WHERE tag = ?', [tagData.name]);

    const [result] = await connection.query(sqlQuery);
    if (result.length !== 0) {
      const { id, } = result[0];
      res.setHeader('Location', `${httpServerDomain}/api/tags/${id}`);
      return res.status(201).send();
    }

    // At this point, tag does not exist, we need to create it
    /*
    const sqlInsercion = 'INSERT INTO users SET ?';

  try {
    const resultCreateAccount = await connection.query(sqlInsercion, {
      id: userId,
      email: accountData.email,
      password: securePassword,
      created_at: createdAt,
    });
    connection.release();
    */

   const tagId = uuidV4();
    try {
      const sqlCreateTag = 'INSERT INTO tags SET ?';
      const resultCreateTag = await connection.query(sqlCreateTag, {
        id: tagId,
        tag: tagData.name,
        user_id: tagData.userId,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      connection.release();
    } catch (e) {
      if (connection) {
        connection.release();
      }

      console.error(e);
      return res.status(500).send({
        message: e.message,
      });
    }

    connection.release();
    res.setHeader('Location', `${httpServerDomain}/api/tags/${tagId}`);
    return res.status(201).send();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = createTag;

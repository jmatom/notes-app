'use strict';

const Joi = require('@hapi/joi');
const uuidV4 = require('uuid/v4');
const mysqlPool = require('../../../database/mysql-pool');

const httpServerDomain = process.env.HTTP_SERVER_DOMAIN;

async function validateSchema(payload) {
  const schema = Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    content: Joi.string().trim().min(1).max(65536),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
    tags: Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })),
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
async function createNote(req, res, next) {
  const { userId } = req.claims;
  const noteData = {
    ...req.body,
    userId,
  };

  try {
    await validateSchema(noteData);
  } catch (e) {
    console.error(e);
    return res.status(400).send(e);
  }

  try {
    const connection = await mysqlPool.getConnection();
    const noteId = uuidV4();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sqlCreateNote = 'INSERT INTO notes SET ?';

    await connection.query(sqlCreateNote, {
      id: noteId,
      title: noteData.title,
      content: noteData.content,
      user_id: noteData.userId,
      created_at: now,
    });

    // Associate tags with the created note
    const sqlAddTags = 'INSERT INTO notes_tags SET ?';
    noteData.tags.forEach(async (tagId) => {
      const tagData = {
        note_id: noteId,
        tag_id: tagId,
        created_at: now,
      };

      await connection.query(sqlAddTags, tagData);
    });

    connection.release();

    res.setHeader('Location', `${httpServerDomain}/api/notes/${noteId}`);
    return res.status(201).send();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = createNote;

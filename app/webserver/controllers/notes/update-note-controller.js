'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validateSchema(payload) {
  const schema = Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    content: Joi.string().trim().min(1).max(65536).required(),
    noteId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
    // tags: Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })),
  });

  Joi.assert(payload, schema);
}

/**
 * Create a new tag if does not exist
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Object} Tag created
 */
async function updateNote(req, res, next) {
  const { noteId } = req.params;
  const { userId } = req.claims;
  const noteData = {
    ...req.body,
    noteId,
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
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sqlUpdateNote = `UPDATE notes
      SET title = ?,
        content = ?
      WHERE id = ?
        AND user_id = ?`;

    await connection.query(sqlUpdateNote, [
      noteData.title,
      noteData.content,
      noteId,
      userId,
    ]);
    connection.release();

    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = updateNote;

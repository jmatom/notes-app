'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validate(payload) {
  const schema = Joi.object({
    noteId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
}

async function deleteNote(req, res, next) {
  const noteId = req.params.noteId;
  const userId = req.claims.userId;

  const payload = {
    noteId,
    userId,
  };

  try {
    await validate(payload);
  } catch (e) {
    return res.status(400).send(e);
  }

  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const deleteNoteQuery = `UPDATE notes
    SET deleted_at = ?
    WHERE id = ?
      AND user_id = ?
      AND deleted_at IS NULL`;
    const connection = await mysqlPool.getConnection();
    const [deletedStatus] = await connection.execute(deleteNoteQuery, [now, noteId, userId]);
    connection.release();

    if (deletedStatus.changedRows !== 1) {
      return res.status(404).send();
    }

    return res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = deleteNote;

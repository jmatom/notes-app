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
    tagId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
  });

  Joi.assert(payload, schema);
}

async function getNote(noteId, userId) {
  const connection = await mysqlPool.getConnection();
  const getNoteQuery = `SELECT id, title, content,  created_at, updated_at
    FROM notes
    WHERE user_id = ?
      AND id = ?
      AND deleted_at IS NULL`;
  const [noteData] = await connection.execute(getNoteQuery, [userId, noteId]);
  connection.release();

  if (noteData.length < 1) {
    return null;
  }

  return noteData[0];
}

async function deleteTagFromNote(req, res, next) {
  // /api/notes/37664a0b-0811-4005-8a26-db41b93825a8/tags
  const { noteId, tagId } = req.params;
  const { userId } = req.claims;
  
  const payload = {
    noteId,
    userId,
    tagId,
  };

  try {
    await validate(payload);
  } catch (e) {
    console.error(e);
    return res.status(400).send(e);
  }

  try {
    const note = await getNote(noteId, userId);

    if (!note) {
      return res.status(404).send();
    }

    // Associate tags to the given note
    const sqlDeleteTag = `DELETE
      FROM notes_tags
      WHERE note_id = ?
        AND tag_id = ?`;

    const connection = await mysqlPool.getConnection();
    try {
      await connection.execute(sqlDeleteTag, [noteId, tagId]);
      connection.release();
    } catch (e) {
      console.error(e);
      connection.release();
      return res.status(500).send({
        message: e.message,
      });
    }

    return res.status(204).send();
  } catch (e) {
    console.error(e);

    return res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = deleteTagFromNote;

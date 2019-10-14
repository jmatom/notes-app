'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validate(payload) {
  const schema = Joi.object({
    noteId: Joi.string().guid({
      version: ['uuidv4'],
    }),
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }),
    tag: Joi.string().guid({
      version: ['uuidv4'],
    }),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
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

async function addTagToNote(req, res, next) {
  // /api/notes/37664a0b-0811-4005-8a26-db41b93825a8/tags
  const { noteId } = req.params;
  const { userId } = req.claims;
  const tagData = { ...req.body };
  const payload = {
    noteId,
    userId,
    ...tagData,
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
    const sqlAddTags = 'INSERT INTO notes_tags SET ?';
    const tagId = tagData.tag;
    
    const tagRow = {
      note_id: noteId,
      tag_id: tagId,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const connection = await mysqlPool.getConnection();
    try {
      await connection.query(sqlAddTags, tagRow);
      connection.release();
    } catch (e) {
      console.error(e);
      connection.release();
      /**
       * If the error is because the tag was already added, no problem, in other
       * case, return an error
       */
      if (e.code !== 'ER_DUP_ENTRY') {
        return res.status(500).send({
          message: e.message,
        });
      }
    }

    return res.status(200).send();
  } catch (e) {
    console.error(e);

    return res.status(500).send({
      message: e.message,
    });
  }

  return res.status(204).send();
}

module.exports = addTagToNote;

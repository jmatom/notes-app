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

  Joi.assert(payload, schema);
}

async function getNoteUsingOneQuery(userId, noteId) {
  const connection = await mysqlPool.getConnection();
  const getNotesQuery = `SELECT n.id, n.title, n.content, 
    n.created_at, n.updated_at, t.id AS tagId, t.tag
    FROM notes n
    LEFT JOIN notes_tags nt
      ON n.id = nt.note_id
    LEFT JOIN tags t
      ON nt.tag_id = t.id
    WHERE n.user_id = ?
      AND n.id = ?
      AND n.deleted_at IS NULL
    ORDER BY created_at`;
  const [notesData] = await connection.execute(getNotesQuery, [userId, noteId]);
  connection.release();

  if (notesData.length < 1) {
    return null;
  }

  /**
   * Hydrating: Create notes object with array of tags
   * {
        "id": "ec177ba2-74a0-4203-8010-18c5ad8e0b95",
        "title": "My first note",
        "content": "This is my first note",
        "created_at": "2019-10-14T15:40:38.000Z",
        "updated_at": null,
        "tagId": "81d219cd-cba3-4709-9349-fb7de8d95418",
        "tag": "foo2"
    }
   */
  const noteHydrated = notesData.reduce((acc, rawNote) => {
   const tag = rawNote.tagId ? {
     id: rawNote.tagId,
     name: rawNote.tag,
   } : undefined;

   const noteProcessed = acc[rawNote.id];

   if (!noteProcessed) {
     return {
        ...acc,
        [rawNote.id]: {
        ...rawNote,
        tags: tag ? [tag] : [],
        tagId: undefined,
        tag: undefined,
      },  
     }
   }

   return {
     ...acc,
     [rawNote.id]: {
      ...rawNote,
      tags: tag ? [...noteProcessed.tags, tag] : noteProcessed,
      tagId: undefined,
      tag: undefined,
     },
   };
  }, {});

  return noteHydrated[noteId];
}

async function getNote(req, res, next) {
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
    const noteData = await getNoteUsingOneQuery(userId, noteId);
    if (!noteData) {
      return res.status(404).send();
    }

    const noteResponse = {
      data: noteData,
    };

    return res.send(noteResponse);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = getNote;

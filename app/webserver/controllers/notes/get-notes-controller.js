'use strict';

const Joi = require('@hapi/joi');
const mysqlPool = require('../../../database/mysql-pool');

async function validate(payload) {
  const schema = Joi.object({
    userId: Joi.string().guid({
      version: ['uuidv4'],
    }).required(),
  });

  const { error, } = schema.validate(payload);

  if (error) {
    throw error;
  }
}

async function getNotesUsingMultipleQueries(userId) {
  const connection = await mysqlPool.getConnection();
  const getNotesQuery = `SELECT id, title, content, created_at, updated_at
    FROM notes 
    WHERE user_id = ?
    ORDER BY created_at`;
  const [notesData] = await connection.execute(getNotesQuery, [userId]);

  if (notesData.length < 1) {
    return notesData;
  }

  /*
  select t.id, t.tag, nt.note_id 
  FROM tags t join notes_tags nt 
    ON t.id = nt.tag_id 
      AND t.user_id = 'e3496f4b-74c6-49ad-9ca5-d34bd19efbd0' 
      AND nt.note_id IN ('37664a0b-0811-4005-8a26-db41b93825a8');
  */
  const getTagsQuery = `SELECT t.id, t.tag, nt.note_id
    FROM tags t JOIN notes_tags nt 
      ON t.id = nt.tag_id 
        AND t.user_id = ?
    ORDER BY nt.created_at`;

  const [tagsData] = await connection.execute(getTagsQuery, [userId]);
  connection.release();
  
  if (tagsData.length < 1) {
    return notesData;
  }

  /**
   * Create a dictionary to search tags by note id quickly and
   * hydrate the notes object with tags info
   * tagsData array of: {
    id: '81d219cd-cba3-4709-9349-fb7de8d95418',
    tag: 'foo2',
    note_id: 'ec177ba2-74a0-4203-8010-18c5ad8e0b95' }
   */
  const tagsDictionaryById = tagsData.reduce((acc, tag) => {
    const {
      id: tagId,
      tag: tagName,
      note_id: noteId,
    } = tag;

    if (!acc[noteId]) {
      return {
        ...acc,
        [noteId]: [{
          id: tagId,
          name: tagName,
        }],
      };
    }

    return {
      ...acc,
      [noteId]: [...acc[noteId], {
        id: tagId,
        name: tagName,
      }],
    };
  }, {});

  const notesWithTags = notesData.map((note) => {
    return {
      ...note,
      tags: tagsDictionaryById[note.id] || [],
    };
  });

  return notesWithTags;
}

async function getNotesUsingOneQuery(userId) {
  const connection = await mysqlPool.getConnection();
  const getNotesQuery = `SELECT n.id, n.title, n.content, 
    n.created_at, n.updated_at, t.id AS tagId, t.tag
    FROM notes n
    LEFT JOIN notes_tags nt
      ON n.id = nt.note_id
    LEFT JOIN tags t
      ON nt.tag_id = t.id
    WHERE n.user_id = ?
    ORDER BY created_at`;
  const [notesData] = await connection.execute(getNotesQuery, [userId]);
  connection.release();

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
  const notesHydrated = notesData.reduce((acc, rawNote) => {
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

  return Object.values(notesHydrated);
}

async function getNotes(req, res, next) {
  const userId = req.claims.userId;

  const payload = {
    userId,
  };

  try {
    await validate(payload);
  } catch (e) {
    return res.status(400).send(e);
  }

  try {
    // const notesData = await getNotesUsingMultipleQueries(userId);
    const notesData = await getNotesUsingOneQuery(userId);
    const notesResponse = {
      data: notesData,
    };

    return res.send(notesResponse);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: e.message,
    });
  }
}

module.exports = getNotes;

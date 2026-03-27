import type { ApplicationNoteData } from "@/lib/application_note_types";

function normalizeNote(note: ApplicationNoteData): ApplicationNoteData {
  return {
    ...note,
    replies: [...(note.replies ?? [])],
  };
}

export function buildNoteTree(rawNotes: ApplicationNoteData[]): ApplicationNoteData[] {
  const map = new Map<number, ApplicationNoteData>();

  rawNotes.forEach((note) => {
    map.set(note.id, normalizeNote(note));
  });

  const roots: ApplicationNoteData[] = [];

  rawNotes.forEach((note) => {
    const node = map.get(note.id);

    if (!node) {
      return;
    }

    if (note.reply_to_id && map.has(note.reply_to_id)) {
      const parent = map.get(note.reply_to_id);
      if (parent) {
        parent.replies = [...(parent.replies ?? []), node];
      }
      return;
    }

    roots.push(node);
  });

  return roots;
}

export function insertNoteIntoTree(
  notes: ApplicationNoteData[],
  note: ApplicationNoteData
): ApplicationNoteData[] {
  const nextNote = normalizeNote(note);

  if (!note.reply_to_id) {
    return [...notes, nextNote];
  }

  let inserted = false;

  const attachReply = (items: ApplicationNoteData[]): ApplicationNoteData[] =>
    items.map((item) => {
      if (item.id === note.reply_to_id) {
        inserted = true;
        return {
          ...item,
          replies: [...(item.replies ?? []), nextNote],
        };
      }

      if (!item.replies?.length) {
        return item;
      }

      const replies = attachReply(item.replies ?? []);
      if (replies === item.replies) {
        return item;
      }

      return {
        ...item,
        replies,
      };
    });

  const nextNotes = attachReply(notes);

  return inserted ? nextNotes : [...nextNotes, nextNote];
}

export function removeNoteFromTree(
  notes: ApplicationNoteData[],
  noteId: number
): ApplicationNoteData[] {
  return notes.flatMap((note) => {
    if (note.id === noteId) {
      return [];
    }

    if (!note.replies?.length) {
      return [note];
    }

    return [
      {
        ...note,
        replies: removeNoteFromTree(note.replies ?? [], noteId),
      },
    ];
  });
}

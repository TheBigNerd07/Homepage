import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Note, NotePayload } from "../types";
import { Card } from "./Card";

interface NotesPageProps {
  notes: Note[];
  busy: boolean;
  onSaveNote: (noteId: number | null, payload: NotePayload) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
}

const emptyNote: NotePayload = {
  title: "",
  body: "",
  is_pinned: false,
  is_dashboard_pinned: false,
  is_archived: false,
};

export function NotesPage({ notes, busy, onSaveNote, onDeleteNote }: NotesPageProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NotePayload>(emptyNote);

  function beginEdit(note: Note) {
    setEditingId(note.id);
    setForm({
      title: note.title,
      body: note.body,
      is_pinned: note.is_pinned,
      is_dashboard_pinned: note.is_dashboard_pinned,
      is_archived: note.is_archived,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyNote);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Notes" eyebrow={`${notes.length} stored`}>
          <div className="space-y-3">
            {notes.length ? (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{note.title || "Untitled note"}</span>
                        {note.is_pinned ? (
                          <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-accent/80">
                            Pinned
                          </span>
                        ) : null}
                        {note.is_dashboard_pinned ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
                            Dashboard
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{note.body || "No content yet."}</p>
                    </div>
                    <button type="button" className="button-secondary" onClick={() => beginEdit(note)}>
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Updated {new Date(note.updated_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
                No notes yet. Create a scratchpad, a to-do list, or temporary troubleshooting notes.
              </div>
            )}
          </div>
        </Card>

        <Card title={editingId ? "Edit Note" : "New Note"} eyebrow="Scratchpad">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await onSaveNote(editingId, form);
              resetForm();
            }}
          >
            <input
              className="input"
              placeholder="Scratchpad"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="input min-h-56 resize-y"
              placeholder="Write quick homelab notes, ideas, or temporary reminders."
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(event) => setForm((current) => ({ ...current, is_pinned: event.target.checked }))}
                className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
              />
              Pin in notes list
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.is_dashboard_pinned}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_dashboard_pinned: event.target.checked }))
                }
                className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
              />
              Show on dashboard
            </label>
            <div className="flex flex-wrap justify-between gap-3">
              {editingId ? (
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={async () => {
                    await onDeleteNote(editingId);
                    resetForm();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              ) : (
                <button type="button" className="button-secondary" onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Reset
                </button>
              )}
              <button type="submit" className="button-primary" disabled={busy || !form.body.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Save note" : "Create note"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

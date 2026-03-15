import { NotebookTabs } from "lucide-react";
import type { Note } from "../types";
import { Card } from "./Card";

export function NotesWidget({
  notes,
  onOpenNotes,
}: {
  notes: Note[];
  onOpenNotes: () => void;
}) {
  const pinned = notes.filter((note) => note.is_dashboard_pinned || note.is_pinned).slice(0, 3);

  return (
    <Card
      title="Notes"
      eyebrow={`${notes.length} active`}
      action={
        <button type="button" className="button-secondary" onClick={onOpenNotes}>
          <NotebookTabs className="mr-2 h-4 w-4" />
          Open Notes
        </button>
      }
    >
      {pinned.length ? (
        <div className="space-y-3">
          {pinned.map((note) => (
            <div
              key={note.id}
              className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4"
            >
              <div className="text-sm font-semibold text-white">{note.title || "Untitled note"}</div>
              <p className="mt-2 max-h-24 overflow-hidden text-sm leading-6 text-slate-300">{note.body || "No content yet."}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                Updated {new Date(note.updated_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
          Pin a note to keep a scratchpad on the dashboard.
        </div>
      )}
    </Card>
  );
}

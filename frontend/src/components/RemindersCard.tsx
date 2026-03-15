import { useEffect, useState } from "react";
import { BellRing, Plus } from "lucide-react";
import type { Reminder, ReminderPayload } from "../types";
import { Card } from "./Card";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

interface RemindersCardProps {
  reminders: Reminder[];
  defaultReminderTime: string;
  onToggleReminder: (reminderId: number, completed: boolean) => Promise<void>;
  onCreateReminder: (payload: ReminderPayload) => Promise<void>;
  busy: boolean;
}

export function RemindersCard({
  reminders,
  defaultReminderTime,
  onToggleReminder,
  onCreateReminder,
  busy,
}: RemindersCardProps) {
  const [text, setText] = useState("");
  const [scheduleType, setScheduleType] = useState<"daily" | "once">("daily");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(defaultReminderTime);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setDueTime(defaultReminderTime);
  }, [defaultReminderTime]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }

    await onCreateReminder({
      text: text.trim(),
      notes: notes.trim() || null,
      schedule_type: scheduleType,
      due_date: scheduleType === "once" ? dueDate || null : null,
      due_time: dueTime || null,
    });
    setText("");
    setScheduleType("daily");
    setDueDate("");
    setDueTime(defaultReminderTime);
    setNotes("");
  }

  return (
    <Card title="Reminders" eyebrow={`${reminders.filter((item) => !item.completed).length} remaining`}>
      <div className="space-y-5">
        <div className="space-y-3">
          {reminders.length ? (
            reminders.map((reminder) => (
              <label
                key={reminder.id}
                className="flex cursor-pointer items-start gap-4 rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent px-4 py-4"
              >
                <input
                  type="checkbox"
                  checked={reminder.completed}
                  onChange={(event) => onToggleReminder(reminder.id, event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                  disabled={busy}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-100">{reminder.text}</span>
                    {reminder.schedule_type === "daily" ? (
                      <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-accent/80">
                        Daily
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
                        One-time
                      </span>
                    )}
                    {reminder.is_overdue ? (
                      <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-rose-200">
                        Overdue
                      </span>
                    ) : null}
                  </div>
                  {reminder.notes ? <p className="mt-2 text-sm text-slate-400">{reminder.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {reminder.due_time ? <span>{reminder.due_time}</span> : null}
                    {reminder.due_date ? <span>{dateFormatter.format(new Date(reminder.due_date))}</span> : null}
                    {reminder.completed ? <span className="text-accent/80">Completed</span> : null}
                  </div>
                </div>
              </label>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
              No reminders yet.
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-accent/80" />
            <span className="label">Quick Add</span>
          </div>
          <div className="grid gap-3">
            <input
              className="input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a reminder or habit"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                className="input"
                value={scheduleType}
                onChange={(event) => setScheduleType(event.target.value as "daily" | "once")}
              >
                <option value="daily">Daily</option>
                <option value="once">One-time</option>
              </select>
              <input
                className="input"
                type="time"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
              />
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={scheduleType !== "once"}
              />
            </div>
            <textarea
              className="input min-h-24 resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="button-primary" disabled={busy || !text.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add reminder
            </button>
          </div>
        </form>
      </div>
    </Card>
  );
}

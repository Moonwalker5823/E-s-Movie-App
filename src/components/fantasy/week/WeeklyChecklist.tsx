import { WEEKLY_TASKS, tasksForToday, todayLabel } from "../../../lib/fantasy/routine";
import { useWeek, checklistFor, toggleTask } from "../../../lib/fantasy/week";

/** The winning weekly cadence as a day-aware checklist. Today's due tasks are highlighted. */
export default function WeeklyChecklist({ week }: { week: number }) {
  useWeek();
  const done = checklistFor(week);
  const todays = new Set(tasksForToday().map((t) => t.id));

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">Game Plan · Week {week}</h3>
        <span className="sticker bg-white/10 text-cream/70">{todayLabel()}</span>
      </div>
      <div className="mt-3 space-y-2">
        {WEEKLY_TASKS.map((t) => {
          const isToday = todays.has(t.id);
          const checked = Boolean(done[t.id]);
          return (
            <button
              key={t.id}
              onClick={() => toggleTask(week, t.id)}
              data-focusable
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                checked
                  ? "border-live/40 bg-live/10"
                  : isToday
                    ? "border-spray/50 bg-spray/5"
                    : "border-line bg-white/5"
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-xs ${
                  checked ? "bg-live text-ink" : "border border-cream/30"
                }`}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="flex-1">
                <span className="font-semibold text-cream">
                  {t.label}
                  {isToday && !checked && <span className="ml-2 text-[10px] font-bold text-spray">· DUE TODAY</span>}
                </span>
                <span className="block text-xs text-cream/50">{t.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

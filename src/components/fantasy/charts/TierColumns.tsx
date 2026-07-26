/** Roster (or board) players bucketed into tier columns. Non-focusable. */
export default function TierColumns({ tiers }: { tiers: { tier: number; players: string[] }[] }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto">
      {tiers.map((t) => (
        <div key={t.tier} className="min-w-[7.5rem] flex-1">
          <div className="u-label mb-1 !rotate-0 text-[10px]">Tier {t.tier}</div>
          <div className="space-y-1">
            {t.players.length === 0 ? (
              <div className="text-xs text-cream/25">—</div>
            ) : (
              t.players.map((p) => (
                <div key={p} className="truncate rounded bg-white/5 px-2 py-1 text-xs text-cream/80">
                  {p}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

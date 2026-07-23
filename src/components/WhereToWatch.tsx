import Heading from "./ui/Heading";
import Skeleton from "./ui/Skeleton";
import { IMG } from "../api/tmdb";
import { launchUrlFor, colorFor } from "../lib/providers";
import { serviceByKey, serviceKeyForProvider } from "../lib/services";
import { hasService, useSettings } from "../lib/settings";
import { theaterOnPlay } from "../lib/hue";
import type { Provider, WatchProviders } from "../lib/types";

function owned(p: Provider) {
  return hasService(serviceKeyForProvider(p.provider_name));
}

// The best service to "just play" on: prefer a free one (no cost), else the
// first service the user owns that carries this title.
function pickBest(watchNow: Provider[]): Provider | null {
  if (watchNow.length === 0) return null;
  const free = watchNow.find((p) => {
    const key = serviceKeyForProvider(p.provider_name);
    return key ? serviceByKey(key)?.free : false;
  });
  return free || watchNow[0];
}

function ProviderGroup({ label, list, title }: { label: string; list?: Provider[]; title: string }) {
  if (!list || list.length === 0) return null;
  // Services you already have float to the front.
  const sorted = [...list].sort((a, b) => Number(owned(b)) - Number(owned(a)));
  return (
    <div className="mb-4">
      <div className="u-label mb-2">{label}</div>
      <div className="flex flex-wrap gap-3">
        {sorted.map((p) => {
          const mine = owned(p);
          return (
            <a
              key={p.provider_id}
              href={launchUrlFor(p.provider_name, title)}
              target="_blank"
              rel="noreferrer"
              data-focusable
              title={`Open ${p.provider_name}`}
              className={`flex items-center gap-2 rounded-xl p-2 pr-4 transition ${
                mine ? "bg-live/10 hover:bg-live/20" : "bg-white/5 hover:bg-white/10"
              }`}
              style={{ boxShadow: `inset 0 0 0 1px ${mine ? "#35d07f" : colorFor(p.provider_name) + "55"}` }}
            >
              <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-9 w-9 rounded-lg" />
              <span className="text-sm font-semibold">{p.provider_name}</span>
              {mine ? (
                <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-ink">✓ YOU HAVE IT</span>
              ) : (
                <span className="text-xs text-spray">Launch ↗</span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** "Where to watch" panel — highlights the services the user already has. */
export default function WhereToWatch({ wp, title }: { wp: WatchProviders | null; title: string }) {
  useSettings(); // re-render when My Services change

  if (wp === null) return <Skeleton className="mt-8 h-24 rounded-2xl" />;

  const nothing = !wp.flatrate && !wp.free && !wp.ads && !wp.rent && !wp.buy;

  // Services you own where this can be watched now (subscription / free / ads).
  const watchNow = [...(wp.flatrate || []), ...(wp.free || []), ...(wp.ads || [])].filter(owned);
  const names = Array.from(new Set(watchNow.map((p) => p.provider_name)));
  const best = pickBest(watchNow);

  return (
    <div className="card mt-8 p-5">
      <Heading emoji="📺" className="mb-4">Where to Watch</Heading>

      {/* One-tap play: you're signed into this service, so go straight to it
          (and dim the Hue theater lights if you've set that up). */}
      {best && (
        <a
          href={launchUrlFor(best.provider_name, title)}
          target="_blank"
          rel="noreferrer"
          data-focusable
          onClick={() => theaterOnPlay()}
          className="btn-spray mb-4 w-full !justify-center !py-3 text-base"
        >
          ▶ Play on {best.provider_name}
        </a>
      )}

      {names.length > 0 && (
        <div className="mb-4 rounded-xl border border-live/40 bg-live/10 p-3 font-semibold text-cream">
          ✓ You&apos;re set — watch now on {names.join(", ")} (you already have it).
        </div>
      )}

      {nothing ? (
        <p className="text-cream/60">
          No US streaming source listed right now.{" "}
          <a
            className="text-spray underline"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/search?q=${encodeURIComponent(`where to watch ${title}`)}`}
          >
            Search the web ↗
          </a>
        </p>
      ) : (
        <>
          <ProviderGroup label="Included with subscription" list={wp.flatrate} title={title} />
          <ProviderGroup label="Free" list={wp.free} title={title} />
          <ProviderGroup label="Free with ads" list={wp.ads} title={title} />
          <ProviderGroup label="Rent" list={wp.rent} title={title} />
          <ProviderGroup label="Buy" list={wp.buy} title={title} />
          <p className="mt-1 text-xs text-cream/40">
            Tapping a service opens it (and hands off to the app on your TV). Set what you subscribe to
            in Settings → My Services to highlight what you can watch free.
          </p>
        </>
      )}
    </div>
  );
}

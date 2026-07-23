import Heading from "./ui/Heading";
import Skeleton from "./ui/Skeleton";
import { IMG } from "../api/tmdb";
import { launchUrlFor, colorFor } from "../lib/providers";
import type { Provider, WatchProviders } from "../lib/types";

function ProviderGroup({ label, list, title }: { label: string; list?: Provider[]; title: string }) {
  if (!list || list.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="u-label mb-2">{label}</div>
      <div className="flex flex-wrap gap-3">
        {list.map((p) => (
          <a
            key={p.provider_id}
            href={launchUrlFor(p.provider_name, title)}
            target="_blank"
            rel="noreferrer"
            data-focusable
            title={`Open ${p.provider_name}`}
            className="flex items-center gap-2 rounded-xl bg-white/5 p-2 pr-4 transition hover:bg-white/10"
            style={{ boxShadow: `inset 0 0 0 1px ${colorFor(p.provider_name)}55` }}
          >
            <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-9 w-9 rounded-lg" />
            <span className="text-sm font-semibold">{p.provider_name}</span>
            <span className="text-xs text-spray">Launch ↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** "Where to watch" panel — subscription/free/rent/buy, each launching the service. */
export default function WhereToWatch({ wp, title }: { wp: WatchProviders | null; title: string }) {
  if (wp === null) return <Skeleton className="mt-8 h-24 rounded-2xl" />;

  const nothing = !wp.flatrate && !wp.free && !wp.ads && !wp.rent && !wp.buy;

  return (
    <div className="card mt-8 p-5">
      <Heading emoji="📺" className="mb-4">
        Where to Watch
      </Heading>
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
            Tapping a service opens it (and hands off to the app on your TV). Paid titles play in their
            own app — the only legal way to stream them.
          </p>
        </>
      )}
    </div>
  );
}

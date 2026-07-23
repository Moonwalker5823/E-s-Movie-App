import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PosterCard from "../components/PosterCard";
import Heading from "../components/ui/Heading";
import Skeleton from "../components/ui/Skeleton";
import { search } from "../api/tmdb";
import type { TmdbItem } from "../lib/types";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<TmdbItem[] | null>(null);

  useEffect(() => {
    setResults(null);
    if (!q) return;
    let alive = true;
    search(q)
      .then((r) => alive && setResults(r))
      .catch(() => alive && setResults([]));
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Results" emoji="🔎" size="xl">
        &ldquo;{q}&rdquo;
      </Heading>

      {results === null ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="mt-6 text-cream/60">No matches. Try another title.</p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-4">
          {results.map((i) => (
            <PosterCard key={`${i.media_type}-${i.id}`} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}

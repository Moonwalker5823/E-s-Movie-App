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
  const [error, setError] = useState(false);

  useEffect(() => {
    setResults(null);
    setError(false);
    if (!q) return; // no query yet — show the prompt state, not endless skeletons
    let alive = true;
    search(q)
      .then((r) => alive && setResults(r))
      .catch(() => alive && setError(true)); // distinct from a genuine zero-results
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Results" emoji="🔎" size="xl">
        {q ? <>&ldquo;{q}&rdquo;</> : "Search"}
      </Heading>

      {!q ? (
        <p className="mt-6 text-cream/75">Type a movie or show in the search box above to get started.</p>
      ) : error ? (
        <p className="mt-6 text-cream/75">
          Couldn&apos;t reach search right now — give it a moment and try again.
        </p>
      ) : results === null ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="mt-6 text-cream/75">No matches for &ldquo;{q}&rdquo;. Try another title.</p>
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

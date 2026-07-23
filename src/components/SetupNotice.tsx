import Heading from "./ui/Heading";

/** Shown on TMDB-powered pages until the user adds a free API key. */
export default function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl p-6 sm:p-10">
      <div className="card p-6 sm:p-8">
        <Heading emoji="🔑" label="♛ One quick step">
          Add your free key
        </Heading>
        <p className="mt-3 text-cream/70">
          Eric&apos;s Movies needs a <b className="text-spray">free</b> TMDB key to load movies, TV,
          trailers, and &ldquo;where to watch&rdquo; info. About 2 minutes:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-cream/80">
          <li>
            Make a free account at{" "}
            <a className="text-spray underline" href="https://www.themoviedb.org/signup" target="_blank" rel="noreferrer">
              themoviedb.org/signup
            </a>
          </li>
          <li>
            Go to{" "}
            <a className="text-spray underline" href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">
              Settings → API
            </a>{" "}
            and copy your <b>API Read Access Token</b>.
          </li>
          <li>
            Rename <code className="rounded bg-white/10 px-1 font-mono">.env.example</code> to{" "}
            <code className="rounded bg-white/10 px-1 font-mono">.env</code> and paste it after{" "}
            <code className="rounded bg-white/10 px-1 font-mono">VITE_TMDB_TOKEN=</code>
          </li>
          <li>Restart the app.</li>
        </ol>
        <p className="mt-4 text-sm text-cream/50">
          Tell Claude when you have the token and it&apos;ll finish setup for you.
        </p>
      </div>
    </div>
  );
}

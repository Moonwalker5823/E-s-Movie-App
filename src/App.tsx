import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import SetupNotice from "./components/SetupNotice";
import Home from "./pages/Home";
import Search from "./pages/Search";
import LiveTV from "./pages/LiveTV";
import Services from "./pages/Services";
import Sports from "./pages/Sports";
import Fantasy from "./pages/Fantasy";
import DraftRoom from "./pages/DraftRoom";
import Games from "./pages/Games";
import XZone from "./pages/XZone";
import SmokersLounge from "./pages/SmokersLounge";
import Blerd from "./pages/Blerd";
import Favorites from "./pages/Favorites";
import SettingsPage from "./pages/Settings";
import Title from "./pages/Title";
import { hasTmdbKey } from "./api/tmdb";
import { useSpatialNav } from "./lib/useSpatialNav";
import { useSettings, resolveTheme } from "./lib/settings";

// Honors the user's "default landing page" setting.
function Landing() {
  const { landing } = useSettings();
  return landing === "browse" ? <Navigate to="/services" replace /> : <Home />;
}

export default function App() {
  useSpatialNav();
  const { pathname } = useLocation();
  const { theme } = useSettings();

  // Apply the light/dark theme to <html> (and follow the OS when set to "system").
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => root.setAttribute("data-theme", resolveTheme(theme));
    apply();
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  // In the native Android WebView, target="_blank" links (Sign in / Play / launch
  // tiles) can silently fail to open. Navigate them in the same window instead —
  // the app's Back button returns. On the real website this stays new-tab.
  useEffect(() => {
    if (!/\bwv\b/.test(navigator.userAgent)) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null;
      if (a?.href) {
        e.preventDefault();
        window.location.assign(a.href);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Each section gets its own tab-inspired background tint (see .tab-bg in index.css).
  const tab = pathname === "/" ? "home" : pathname.split("/")[1] || "home";
  const ready = hasTmdbKey();
  const gated = (el: JSX.Element) => (ready ? el : <SetupNotice />);

  return (
    <div className="min-h-full pb-16">
      <div className="tab-bg" data-tab={tab} aria-hidden />
      <NavBar />
      <Routes>
        <Route path="/" element={gated(<Landing />)} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/search" element={gated(<Search />)} />
        <Route path="/services" element={gated(<Services />)} />
        <Route path="/live" element={<LiveTV />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/fantasy" element={<Fantasy />} />
        <Route path="/fantasy/draft" element={<DraftRoom />} />
        <Route path="/games" element={<Games />} />
        <Route path="/lounge" element={<SmokersLounge />} />
        <Route path="/blerd" element={<Blerd />} />
        <Route path="/x" element={<XZone />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/title/:media/:id" element={gated(<Title />)} />
      </Routes>
    </div>
  );
}

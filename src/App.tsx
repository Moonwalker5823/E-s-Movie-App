import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import SetupNotice from "./components/SetupNotice";
import Home from "./pages/Home";
import Search from "./pages/Search";
import LiveTV from "./pages/LiveTV";
import Sports from "./pages/Sports";
import Fantasy from "./pages/Fantasy";
import DraftRoom from "./pages/DraftRoom";
import Favorites from "./pages/Favorites";
import Title from "./pages/Title";
import { hasTmdbKey } from "./api/tmdb";
import { useSpatialNav } from "./lib/useSpatialNav";

export default function App() {
  useSpatialNav();
  const ready = hasTmdbKey();
  const gated = (el: JSX.Element) => (ready ? el : <SetupNotice />);

  return (
    <div className="min-h-full pb-16">
      <NavBar />
      <Routes>
        <Route path="/" element={gated(<Home />)} />
        <Route path="/search" element={gated(<Search />)} />
        <Route path="/live" element={<LiveTV />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/fantasy" element={<Fantasy />} />
        <Route path="/fantasy/draft" element={<DraftRoom />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/title/:media/:id" element={gated(<Title />)} />
      </Routes>
    </div>
  );
}

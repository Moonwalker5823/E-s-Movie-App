// Vercel serverless function — the video engine behind the Sports "Highlights"
// hub AND the Smokers Lounge "Bud TV" hub.
//
// Pulls the latest uploads from curated YouTube channels via their public RSS
// feeds (no API key, no quota) and returns them as JSON, newest first. The browser
// calls this same-origin, so there's no CORS issue (YouTube RSS itself isn't
// CORS-enabled, which is why we proxy it here). Channel IDs were verified live.
//
// Runs on Vercel and under `vercel dev`. Under plain `vite dev` there's no
// serverless runtime, so the hubs show a friendly "loads on the live site" note.

interface Channel {
  id: string;
  name: string;
}

// League / highlight channels.
const NFL = { id: "UCJdl3Paao2f3ha5JXMYUCIA", name: "NFL" };
const NBA = { id: "UCWJ2lWNubArHWmf3FIHbfcQ", name: "NBA" };
const MLB = { id: "UCoLrcjPV5PbUrUyXq5mjc_A", name: "MLB" };
const NHL = { id: "UCK3CHl-6e3hq4gQaz_TOyoQ", name: "NHL" };
const EPL = { id: "UCpryVRk_VDudG8SHXgWcG0w", name: "Premier League" };
const ESPN = { id: "UCiWLfSweyRNmLpgEHekhoAg", name: "ESPN" }; // main ESPN (daily recaps)
const HOH = { id: "UCqQo7ewe87aYAe7ub5UqXMw", name: "House of Highlights" };
const BR = { id: "UC9-OpMMVoNP5o10_Iyq7Ndw", name: "Bleacher Report" };
// AND1 streetball — the mixtape era (Hot Sauce, Half Man Half Amazin') + The Professor.
const AND1 = { id: "UCpj2jMqzhF4nn4-9PXRy2kA", name: "AND1 Basketball" };
const PROFESSOR = { id: "UC5zJwsFtEs9WYe3A76p7xIA", name: "The Professor" };
const BALLISLIFE = { id: "UC_zgOsTPdML6tol9hLYh4fQ", name: "Ballislife" };

// Music-video channels (verified active, July 2026).
const NPR_MUSIC = { id: "UC4eYXhJI4-7wSWc8UNRwD4A", name: "NPR Music" }; // Tiny Desk — lyrical/soul/R&B live
const COLORS = { id: "UC2Qw1dzXDBAZPwS7zm37g8g", name: "COLORS" }; // curated lyrical / neo-soul / global
const MASS_APPEAL = { id: "UCerm0xrYv04HvPd_G5ZLN0w", name: "Mass Appeal" }; // elevated / golden-era hip-hop
const MJ = { id: "UC5OrDvL9DscpcAstz7JnQGA", name: "Michael Jackson" }; // the King (above all)
const RNB_NATION = { id: "UCRrCiR_F-olJgMClfsl7YAg", name: "R&B Nation" }; // R&B / soul
// Named artists — official / VEVO channels, RSS-verified.
const JAYZ = { id: "UC_Bf08Y-3m6CMAvTms3EkKg", name: "JAY-Z" };
const NAS = { id: "UChE4aVxHHk5Mx9fZ2DaPJGw", name: "Nas" };
const DMX = { id: "UCQcTmBevae2jDeFEZ6VEQPw", name: "DMX" };
const BIG_DADDY_KANE = { id: "UC8YswipxhrINUUEbEAHcDNw", name: "Big Daddy Kane" };
const KENDRICK = { id: "UC3lBXcrKFnFAFkfVk5WuKcQ", name: "Kendrick Lamar" };
const JCOLE = { id: "UCnc6db-y3IU7CkT_yeVXdVg", name: "J. Cole" };
const LUPE = { id: "UC-zD8J0RLWy3mNB7EMmT7Rg", name: "Lupe Fiasco" };
const GAMBINO = { id: "UCjYO25ZVJT523TD1iYHzcbw", name: "Childish Gambino" };
const TEMS = { id: "UCWfi5ELXGAe-DCA6cOP3aNw", name: "Tems" };
// More of Eric's artists — R&B/pop, legends & rock (official / VEVO), RSS-verified live.
const PRINCE = { id: "UCv3mNSNjuWldihk1DUdnGtw", name: "Prince" };
const WHITNEY = { id: "UCG5fkJ8-2b2ZjWpVNpr7Dqg", name: "Whitney Houston" };
const MIGUEL = { id: "UCpOt14iqkbd6QjtBHicTXKQ", name: "Miguel" };
const USHER = { id: "UCaNrhBiXsXIM2epDl_kEzgQ", name: "Usher" };
const CHRIS_BROWN = { id: "UCm1dsgJNnhaLkY3uAdqN4mA", name: "Chris Brown" };
const LINKIN_PARK = { id: "UCZU9T1ceaOgwfLRq7OKFU4Q", name: "Linkin Park" };
const METALLICA = { id: "UCbulh9WdLtEXiooRcYK7SWw", name: "Metallica" };

// Eric's own PUBLIC YouTube playlists (pulled from his account via playlist_id RSS).
// His actual curated taste — soul, golden-era hip-hop, MJ, rock. RSS exposes the ~15
// most-recently-added tracks per list, so combined they make a rich, personal pool.
const YT_OL_SKOOL = { id: "PL60C6CBECA6951C0B", name: "Ol' Skool" };
const YT_HIPHOP = { id: "PLE510D41977035219", name: "Ol Skool Hip Hop" };
const YT_MAXWELL = { id: "PL9246E25C52B342E6", name: "maxwell" };
const YT_COMMON = { id: "PL361A266F4BAFFE1C", name: "common" };
const YT_BIG = { id: "PL9E0C776FE6F03548", name: "B.I.G" };
const YT_RNB2 = { id: "PL2A7A56447D01BD41", name: "r&b 2" };
const YT_RNB = { id: "PL903D51D276837634", name: "R&B" };
const YT_KING = { id: "PL3CACBC467D63FCC7", name: "The King" };
const YT_2PAC = { id: "PL39927FF699A4674E", name: "2Pac" };
const YT_RAP = { id: "PL3908266E9A9A8D7B", name: "Rap" };
const YT_ROCK = { id: "PLFD9A5156594299A6", name: "Rock" };
const YT_ALT = { id: "PLC44D9558DA3EFA53", name: "Alt" };
const YT_REGGAE = { id: "PLE6B511E64F9A9D64", name: "Reggae" };
const YT_YOUNGE = { id: "PL97F5B39065908605", name: "Young E" };
const ERIC_PLAYLISTS = [YT_OL_SKOOL, YT_HIPHOP, YT_MAXWELL, YT_COMMON, YT_BIG, YT_RNB2, YT_RNB, YT_KING, YT_2PAC, YT_RAP, YT_ROCK, YT_ALT, YT_REGGAE, YT_YOUNGE];

// Battle rap — SMACK/URL (Ultimate Rap League), the classic SMACK DVD lineage.
const URL_BATTLE = { id: "UCflIAeM03JFL9ml03LwYF-g", name: "URL · Ultimate Rap League" };
// Golden-era 80s/90s "Yo! MTV Raps" artists (official / VEVO), RSS-verified.
const RUN_DMC = { id: "UCLPo8s1MY3FOzzSwWZP0ZvQ", name: "Run-DMC" };
const LL_COOL_J = { id: "UCJk8BhnzYy-KkQ34Q7oZu1Q", name: "LL COOL J" };
const TRIBE = { id: "UCkZ7qikT6yimOwi-eeSUo5g", name: "A Tribe Called Quest" };
const WU_TANG = { id: "UCl0q_XqiWDMA-Q9SzUO3y-Q", name: "Wu-Tang Clan" };
const TUPAC = { id: "UCA_-NVTKOlWgxgTWjqlzZlA", name: "2Pac" };
const BIGGIE = { id: "UCEtIDoDJlLsaj3OI0k7lWqw", name: "The Notorious B.I.G." };
const PUBLIC_ENEMY = { id: "UCM3jnzSbwV8mHsZB6DySbyw", name: "Public Enemy" };
const EPMD = { id: "UCawAeY_1dMrsOWW-WnvJfJQ", name: "EPMD" };
const BEASTIE_BOYS = { id: "UCpRUSBcRWUQZIj3_jWF19Dg", name: "Beastie Boys" };

// Gaming channels — first-party consoles + fun sports games + racing/cars.
// RSS-verified live (July 2026 uploads).
const XBOX = { id: "UCjBp_7RuDBUYbd1LegWEJ8g", name: "Xbox" };
const PLAYSTATION = { id: "UC-2Y8dQb0S6DtpxNgAKoJKA", name: "PlayStation" };
const FORZA = { id: "UCydtMNspoPAlqBjFSGnigSw", name: "Forza" }; // racing / cars
const ROCKET_LEAGUE = { id: "UCBjQwd62OJgixzW49TKGERg", name: "Rocket League" }; // cars + soccer
const EA_FC = { id: "UCoyaxd5LQSuP4ChkxK0pnZQ", name: "EA SPORTS FC" }; // soccer
const NBA_2K = { id: "UCYAJjqIukwm4r3GHEpJDhVw", name: "NBA 2K" }; // basketball
const EA_MADDEN = { id: "UCPpddbTbOr_uWWQT9Pw1rbA", name: "EA SPORTS Madden NFL" }; // football
const EA_SPORTS = { id: "UCcpK2UHpfhfc23SC8TU16BA", name: "EA SPORTS" };

// Car / motorsport — "Top Gear feels": car shows, reviews, and racing.
// RSS-verified live (July 2026 uploads).
const TOP_GEAR = { id: "UCjOl2AUblVmg2rA_cRgZkFg", name: "Top Gear" };
const GRAND_TOUR = { id: "UCZ1Sc5xjWpUnp_o_lUTkvgQ", name: "The Grand Tour" };
const CARWOW = { id: "UCUhFaUpnq31m6TNX2VKVSVA", name: "carwow" };
const DONUT = { id: "UCL6JmiMXKoXS6bpP1D3bk8g", name: "Donut Media" };
const F1 = { id: "UCB_qr75-ydFVKSF9Dmo6izg", name: "Formula 1" };
const NASCAR = { id: "UCuN9hYw2RpoAW8rZ3VK3isA", name: "NASCAR" };

// Anime — action / shonen leaning (Baki lives on Netflix Anime): official clips,
// trailers, and (where licensed) full episodes. RSS-verified live (2026 uploads).
const CRUNCHYROLL = { id: "UC6pGDc4bFGD1_36IKv3FnYg", name: "Crunchyroll" };
const NETFLIX_ANIME = { id: "UCBSs9x2KzSLhyyA9IKyt4YA", name: "Netflix Anime" }; // Baki
const MUSE_ASIA = { id: "UCGbshtvS9t-8CW11W7TooQg", name: "Muse Asia" };
const ADULT_SWIM = { id: "UCgPClNr5VSYC3syrDUIlzLw", name: "Adult Swim" }; // Toonami

// Comedy clip show — MTV's Ridiculousness + the host + similar viral-clip channels, so
// the wind-down tab always has plenty of new content. All verified active (2026).
const RIDICULOUSNESS = { id: "UC5hk6O61heulo6Ld-ZNP6WA", name: "MTV's Ridiculousness" };
const ROB_DYRDEK = { id: "UCEfHmEc1D2QYQOdpYlHNd0Q", name: "Rob Dyrdek" }; // Ridiculousness host
const AFV = { id: "UC_zEzzq54Rm0iy7lmmZbCIg", name: "America's Funniest Home Videos" };
const DAILY_DOSE = { id: "UCdC0An4ZPNr_YiFiYoVbwaw", name: "Daily Dose Of Internet" };
const PEOPLE_AWESOME = { id: "UCIJ0lLcABPdYGp7pRMGccAQ", name: "People Are Awesome" };

// Comedy — sketches, stand-up & roasts. The legends Eric named (Bernie Mac, Martin,
// Chappelle, Chris Rock, Eddie Murphy, Pryor) have no live channels of their own, so
// their clips come through Comedy Central / Netflix Is A Joke / Wild 'N Out alongside
// active comedians. Verified active (2026 uploads).
const KEV_ON_STAGE = { id: "UC5Zc0EUB-km6in-55cK7k2g", name: "KevOnStage" };
const TONY_BAKER = { id: "UC4BjMIJfYABWAwcBE9-hp9A", name: "Tony Baker" };
const KARLOUS = { id: "UCijs2c5F9LYI0NHT1tN4TdA", name: "Karlous Miller" };
const DC_YOUNG_FLY = { id: "UCCQ-qN-4JcmXe4GcktUsITg", name: "DC Young Fly" };
const COMEDY_CENTRAL = { id: "UCUsN5ZwHx2kILm84-jPDeXw", name: "Comedy Central" };
const NETFLIX_JOKE = { id: "UCObk_g1hQBy0RKKriVX_zOQ", name: "Netflix Is A Joke" };
const WILD_N_OUT = { id: "UCrkzfc2yf-7q6pd7EtzgNaQ", name: "Wild 'N Out" };
const DRY_BAR = { id: "UCvlVuntLjdURVD3b3Hx7kxw", name: "Dry Bar Comedy" };

// News — top US broadcast news, for the "News" set + The Mix feed. Verified active.
const ABC_NEWS = { id: "UCBi2mrWuNuyYy4gbM6fU18Q", name: "ABC News" };
const NBC_NEWS = { id: "UCeY0bbntWzzVIaj2z3QigXg", name: "NBC News" };
const CBS_NEWS = { id: "UC8p1vwvWtl6T73JiExfWs1g", name: "CBS News" };

// Smokers Lounge — a full cannabis hub (culture, celebrity sessions, munchies/recipes,
// grow tips), not just smoking vlogs. Verified active (2026 uploads) so the daily
// rotation stays fresh.
const GGN = { id: "UC-OO324clObi3H-U0bP77dw", name: "Snoop Dogg (GGN)" };
const BREAL = { id: "UCSDxHir7pmMTmJ_-tlK7NHA", name: "BREAL.TV" };
const HIGH_TIMES = { id: "UCFQ7vc-dWlSUZd6OqsAepMA", name: "High Times" };
const BERNER = { id: "UC2rdCWnU8fmFxdgeYXkbbIw", name: "Berner" };
const EMILY_KYLE = { id: "UCyEbRoIkzjcTdBFrYyxVa2Q", name: "Emily Kyle · Cannabis Kitchen" }; // recipes/edibles
const COOKING_CANNABIS = { id: "UCyDFqSAhNnjmcZbSEOczZAQ", name: "Cooking With Cannabis" }; // recipes/edibles
const MUNCH_MAKERS = { id: "UCs4U6ncms8pqtgp1vqGTFnA", name: "Munch Makers" }; // munchies gear
const MR_GROW_IT = { id: "UCxRqSUclO2n5BHzV_Bc3GYQ", name: "Mr. Grow It" }; // grow tips
const DEBACCO = { id: "UCfDn7HuC58X9BPWUtjpkqQg", name: "DeBacco University" }; // cultivation

// Motivation — daily discipline / mindset speeches. Motiversity is Eric's pick; Tim
// Grover has no channel of his own (podcast guest only), so top speech channels carry
// that same relentless energy. Verified active (2026 uploads).
const MOTIVERSITY = { id: "UCAPByrKU5-R1emswVlyH_-g", name: "Motiversity" };
const BEN_LIONEL_SCOTT = { id: "UCgkKA7xEOoBQNpC5TJxPLiw", name: "Ben Lionel Scott" };
const TEAM_FEARLESS = { id: "UCf9_s9ii6BZ-klpgmtIi3WQ", name: "Team Fearless" };

// Explore — adventure & exploration in the Blerd spirit: Will Smith's channel (home
// of his Nat Geo "Pole to Pole" / Welcome to Earth adventures), plus Nat Geo, BBC
// Earth and similar. Verified active (2026 uploads).
const WILL_SMITH = { id: "UCKuHFYu3smtrl2AwwMOXOlg", name: "Will Smith" };
const NAT_GEO = { id: "UCpVm7bg6pXKo1Pr6k5kxG9A", name: "National Geographic" };
const BBC_EARTH = { id: "UCwmZiChSryoWQCZMIQezgTg", name: "BBC Earth" };
const VSAUCE = { id: "UC6nSFpj9HTCZ5t-N3Rm3-HA", name: "Vsauce" };
const GREAT_BIG_STORY = { id: "UCajXeitgFL-rb5-gXI-aG8Q", name: "Great Big Story" };
const YES_THEORY = { id: "UCvK4bOhULCpmLabd2pDMtnA", name: "Yes Theory" };

// A curated set of channels for each hub tab. Verified active (2026 uploads).
const SETS: Record<string, Channel[]> = {
  // Sports "Highlights" tabs
  all: [HOH, ESPN, BR, NFL, NBA, MLB, NHL],
  // Morning "Daily Wrap" — yesterday's games recapped (newest-first), for a
  // sports-show feel when you sit down. ESPN/HOH/BR post overnight recaps.
  wrap: [ESPN, HOH, BR, NFL, NBA, MLB],
  nfl: [NFL],
  nba: [NBA, HOH],
  mlb: [MLB],
  nhl: [NHL],
  soccer: [EPL],
  cfb: [ESPN],
  // Sports "Shows" — longer-form highlight/analysis shows + podcasts (Pat McAfee,
  // Up & Adams, Secret Base mini-docs, The Pivot, …). Not short clips.
  shows: [
    { id: "UCxcTeAKWJca6XyJ37_ZoKIQ", name: "The Pat McAfee Show" },
    { id: "UC3X-L84yCBq0XUd1Whe5u7A", name: "Up & Adams" },
    { id: "UCDRmGMSgrtZkOsh_NQl4_xw", name: "Secret Base" },
    { id: "UCUnxiP7q4RDDyeioZFZLnXA", name: "The Pivot" },
    { id: "UC2ozVs4pg2K3uFLw6-0ayCQ", name: "KG Certified" },
    { id: "UCMJAKnrVv1sRzlq_vqige3Q", name: "All The Smoke" },
    { id: "UCVRm2Ho8cL3lvWDyp2ayuFw", name: "New Heights" },
    { id: "UCnKhvsJ8d1zEFWH7axtc7ew", name: "Gil's Arena" },
    { id: "UCBNqqomXKPSWvcQDXOkRvRA", name: "Draymond Green Show" },
    { id: "UCKnodHJpZd8UbSvAufDd3_g", name: "Club Shay Shay" },
  ],
  and1: [AND1, PROFESSOR, BALLISLIFE], // AND1 mixtape streetball + The Professor
  // Smokers Lounge — a full cannabis hub, not just Snoop + smoking vlogs. The daily
  // rotation keeps each tab fresh day to day.
  lounge: [GGN, BREAL, HIGH_TIMES, BERNER, EMILY_KYLE, COOKING_CANNABIS, MR_GROW_IT, MUNCH_MAKERS, DEBACCO], // 🔥 all smoker content
  sessions: [GGN, BREAL, HIGH_TIMES, BERNER], // 🌿 celebrity sessions & culture
  edibles: [EMILY_KYLE, COOKING_CANNABIS], // 🍽️ weed-inspired recipes
  grow: [MR_GROW_IT, DEBACCO], // 🌱 growers tips & cultivation
  // Blerd — the black nerd in you: science, tech, TED, ancient aliens, code.
  blerd: [
    { id: "UCG7J20LhUeLl6y_Emi7OJrA", name: "Marques Brownlee" },
    { id: "UCsT0YIqwnpJCM-mx7-gSA4Q", name: "TED" },
    { id: "UCin0m13qWv3-051xlWlHamA", name: "Veritasium" },
    { id: "UCq8ZAAsI89IoJ-fn1gYpO3g", name: "Kurzgesagt" }, // was HISTORY (posts true-crime); keep the Mix pure nerd
    VSAUCE, // big-ideas/science — keeps the Mix fresh
    { id: "UCUyeluBRhGPCW4rPe_UvBZQ", name: "ThePrimeagen" },
  ],
  science: [
    { id: "UCin0m13qWv3-051xlWlHamA", name: "Veritasium" },
    { id: "UCq8ZAAsI89IoJ-fn1gYpO3g", name: "Kurzgesagt" },
    { id: "UCq6OAftTQOuUBRdtUDq5SUA", name: "PBS Space Time" },
    { id: "UC9SM7V7J1pAhPabOUST01fw", name: "NASA" },
    { id: "UCoxcjq-8xIDTYp3uz647V5A", name: "Computerphile" },
  ],
  tech: [
    { id: "UCG7J20LhUeLl6y_Emi7OJrA", name: "Marques Brownlee" },
    { id: "UCddiUEpeqJcYeBxX1IVBKvQ", name: "The Verge" },
    { id: "UCdBK94H6oZT2Q7l0-b0xmMg", name: "Linus Tech Tips" },
  ],
  ted: [{ id: "UCsT0YIqwnpJCM-mx7-gSA4Q", name: "TED" }],
  // Alien-inspired (not one specific show): UFOs, aliens, unexplained, alien worlds.
  aliens: [
    { id: "UCIFk2uvCNcEmZ77g0ESKLcQ", name: "The Why Files" }, // UFOs / aliens / unexplained
    { id: "UCweDKPSF65wRw5VHFUJYiow", name: "Curious Archive" }, // alien worlds / xenobiology
  ],
  code: [
    { id: "UCUyeluBRhGPCW4rPe_UvBZQ", name: "ThePrimeagen" },
    { id: "UC1emV4A8liRs9p80CY8ElUQ", name: "freeCodeCamp" },
    { id: "UC2Xd-TjJByJyK2w1zNwY0zQ", name: "Fireship" },
  ],
  // Blerd — motivation/mindset speeches (Motiversity + top speech channels).
  motivation: [MOTIVERSITY, BEN_LIONEL_SCOTT, TEAM_FEARLESS],
  // Blerd — adventure & exploration (Will Smith's Pole to Pole/Welcome to Earth, Nat Geo, …).
  explore: [WILL_SMITH, NAT_GEO, BBC_EARTH, YES_THEORY, GREAT_BIG_STORY],
  // Music — a grown, golden-era, lyrical/soul palette (curated + named artists, no
  // ratchet or drill). Tidal covers the personalized / deep-catalog library.
  // Eric's own YouTube playlists, combined — his personal music taste in the app.
  myplaylists: ERIC_PLAYLISTS,
  music: [MJ, PRINCE, YT_KING, KENDRICK, JAYZ, USHER, YT_OL_SKOOL, MASS_APPEAL, TEMS, MIGUEL, YT_RNB, NAS, COLORS, JCOLE, RNB_NATION, LUPE, NPR_MUSIC],
  golden: [JAYZ, NAS, DMX, BIG_DADDY_KANE, MASS_APPEAL, YT_2PAC, YT_BIG, YT_COMMON, YT_RAP, YT_HIPHOP], // 90s/00s classic hip-hop
  lyricists: [KENDRICK, JCOLE, LUPE, GAMBINO, MASS_APPEAL, YT_COMMON], // conscious / lyrical
  soul: [TEMS, MIGUEL, USHER, CHRIS_BROWN, RNB_NATION, COLORS, NPR_MUSIC, YT_OL_SKOOL, YT_MAXWELL, YT_RNB, YT_RNB2, YT_YOUNGE], // R&B / neo-soul
  classics: [MJ, PRINCE, WHITNEY, YT_KING], // legends — the King first, then Prince & Whitney
  rock: [LINKIN_PARK, METALLICA, YT_ROCK, YT_ALT], // rock / metal — Linkin Park, Metallica
  battlerap: [URL_BATTLE], // SMACK / URL — Ultimate Rap League battles
  tinydesk: [NPR_MUSIC],
  // 80s/90s "Yo! MTV Raps" golden era — classic videos + Mass Appeal freestyles/interviews.
  yomtvraps: [RUN_DMC, LL_COOL_J, TRIBE, WU_TANG, TUPAC, BIGGIE, PUBLIC_ENEMY, BIG_DADDY_KANE, EPMD, BEASTIE_BOYS, MASS_APPEAL],
  // Games — video-game + CAR heavy. "Mix" blends games with car content; then
  // Xbox, car shows (Top Gear feels), racing (motorsport + racing games), and
  // sports games.
  gaming: [XBOX, FORZA, TOP_GEAR, ROCKET_LEAGUE, CARWOW, PLAYSTATION],
  xbox: [XBOX],
  cars: [TOP_GEAR, GRAND_TOUR, CARWOW, DONUT], // car shows & reviews — Top Gear feels
  racing: [F1, NASCAR, FORZA, ROCKET_LEAGUE], // motorsport + racing games
  gamesports: [EA_FC, NBA_2K, EA_MADDEN, ROCKET_LEAGUE, EA_SPORTS], // sports games
  anime: [CRUNCHYROLL, NETFLIX_ANIME, MUSE_ASIA, ADULT_SWIM], // action anime (Baki, etc.)
  ridiculousness: [RIDICULOUSNESS, ROB_DYRDEK, AFV, DAILY_DOSE, PEOPLE_AWESOME], // wind-down clip comedy (Comedy page)
  // Comedy page — sketches, stand-up & roasts. Legends' clips ride in via the platforms.
  comedy: [KEV_ON_STAGE, TONY_BAKER, KARLOUS, DC_YOUNG_FLY, COMEDY_CENTRAL, NETFLIX_JOKE, WILD_N_OUT, DRY_BAR],
  standup: [NETFLIX_JOKE, DRY_BAR, COMEDY_CENTRAL, KARLOUS], // stand-up specials & sets
  skits: [KEV_ON_STAGE, TONY_BAKER, COMEDY_CENTRAL, WILD_N_OUT, DC_YOUNG_FLY], // sketches & roasts
  news: [ABC_NEWS, NBC_NEWS, CBS_NEWS], // top US news — feeds The Mix
};

// "The Mix" — a personalized everything-feed: the freshest across the top pages, a few
// channels from each so no single topic drowns the rest. Built from the sets above so
// it stays in sync as they grow.
function mixChannels(): Channel[] {
  const parts = ["all", "news", "comedy", "ridiculousness", "blerd", "gaming", "music"];
  const seen = new Set<string>();
  const out: Channel[] = [];
  for (const key of parts) {
    for (const c of (SETS[key] || []).slice(0, 3)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
  }
  return out;
}

const MAX_SHORT_SEC = 300; // "shorts" = 5 minutes or under

// Blerd is nerd turf. The alien/unexplained channels occasionally drift into
// true-crime / murder / missing-persons mysteries — filter those out by title so
// the "aliens" tab stays alien-inspired, not murder. Scoped to this set so tech
// "iPhone killer" headlines etc. are never caught.
const CRIME_SETS = new Set(["aliens"]);
// True-crime / murder / investigative stems. Note: NO bare "abduction" — "alien
// abduction" is core Ancient Aliens; and no "massacre"/"slain" (ancient-battle
// false positives). Scoped to CRIME_SETS so tech "iPhone killer" headlines etc. are
// never touched.
const CRIME_RE =
  /\b(murder\w*|homicides?|killers?|serial killers?|true crime|crime scene|cold cases?|manhunt|death row|kidnapp?\w*|assassin\w*|investigat\w*|detectives?|forensics?|stalkers?|killing spree|psychopath|who killed)\b/i;

interface Item {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
  durationSec?: number;
}

const cache: Record<string, { at: number; items: Item[] }> = ((globalThis as any).__vidCache ||= {});
const TTL = 15 * 60 * 1000; // 15 min

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseFeed(xml: string, channel: string): Item[] {
  return xml
    .split("<entry>")
    .slice(1)
    .map((e) => {
      const videoId = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1] || "";
      const title = (e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "";
      const published = (e.match(/<published>(.*?)<\/published>/) || [])[1] || "";
      if (!videoId) return null;
      return {
        videoId,
        title: decode(title),
        published,
        channel,
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      } as Item;
    })
    .filter((x): x is Item => x !== null);
}

// ISO-8601 duration (PT#H#M#S) → seconds.
function isoToSec(d?: string): number | null {
  const m = (d || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

// Look up video durations. Uses the YouTube Data API when YOUTUBE_API_KEY is set
// (reliable, 1 call per 50 ids); otherwise falls back to scraping lengthSeconds
// from the watch page (keyless, best-effort). Returns a videoId → seconds map.
async function durationsFor(ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const key = process.env.YOUTUBE_API_KEY;

  if (key) {
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      try {
        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${key}`
        );
        const data = await r.json();
        for (const it of data.items || []) {
          const s = isoToSec(it.contentDetails?.duration);
          if (s != null) out[it.id] = s;
        }
      } catch {
        /* ignore — best effort */
      }
    }
    return out;
  }

  await Promise.all(
    ids.slice(0, 16).map(async (id) => {
      try {
        const r = await fetch(`https://www.youtube.com/watch?v=${id}`, {
          headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en", cookie: "SOCS=CAI;" },
        });
        const m = (await r.text()).match(/"lengthSeconds":"(\d+)"/);
        if (m) out[id] = Number(m[1]);
      } catch {
        /* ignore */
      }
    })
  );
  return out;
}

// A "fresh daily" rotation: a deterministic shuffle seeded by today's date, so the
// reel presents a different on-topic lineup each day but stays consistent all day.
function dailySeed(): number {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD (ET)
  return Number(s.slice(0, 10).replace(/-/g, "")) || 20260101;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function handler(req: any, res: any) {
  const set = (req.query?.set || "all").toString().toLowerCase();
  const short = String(req.query?.short || "") === "1";
  const daily = String(req.query?.daily || "") === "1"; // date-seeded fresh-daily rotation
  const hours = Math.max(0, Math.min(24, Number(req.query?.hours) || 0)); // rotate every N hours (Sports: 3)
  const channels = set === "mix" ? mixChannels() : SETS[set] || SETS.all;
  const rotate = daily || hours > 0;
  // Seed the rotation: an N-hour time bucket when `hours` is set, else today's date (ET).
  const seed = hours > 0 ? Math.floor(Date.now() / (hours * 3600_000)) : dailySeed();
  const cacheKey = `${set}${short ? ":short" : ""}${rotate ? `:r${seed}` : ""}`;

  const hit = cache[cacheKey];
  if (hit && Date.now() - hit.at < TTL) {
    res.status(200).json({ items: hit.items, cached: true });
    return;
  }

  const lists = await Promise.all(
    channels.map(async (c) => {
      try {
        // A source is either a channel (UC…) or a playlist (PL…) — same RSS feed, different param.
        const param = c.id.startsWith("PL") ? "playlist_id" : "channel_id";
        const r = await fetch(`https://www.youtube.com/feeds/videos.xml?${param}=${c.id}`);
        if (!r.ok) return [] as Item[];
        return parseFeed(await r.text(), c.name);
      } catch {
        return [] as Item[];
      }
    })
  );

  const seen = new Set<string>();
  const fresh = lists
    .flat()
    .filter((it) => (seen.has(it.videoId) ? false : (seen.add(it.videoId), true)))
    .sort((a, b) => (a.published < b.published ? 1 : -1));
  // Daily rotation: shuffle a larger recent pool with today's seed, then take 48 — so
  // the featured lineup changes day to day. Otherwise just take the newest.
  let items = rotate ? seededShuffle(fresh.slice(0, 90), mulberry32(seed)).slice(0, 48) : fresh.slice(0, 48);

  // Shorts-only tabs (Lounge / Blerd / Games): prefer clips 5 min and under.
  // If duration lookup is unavailable (rate-limited) OR a feed has no short clips
  // (e.g. Snoop's GGN posts full show episodes), fall back to the full-length
  // uploads so the hub is never empty.
  if (short) {
    const durs = await durationsFor(items.slice(0, 24).map((i) => i.videoId));
    if (Object.keys(durs).length > 0) {
      const shorts = items
        .filter((i) => durs[i.videoId] != null && durs[i.videoId] <= MAX_SHORT_SEC)
        .map((i) => ({ ...i, durationSec: durs[i.videoId] }));
      if (shorts.length > 0) items = shorts; // else keep the full episodes as fallback
    }
  }

  // Keep true-crime / murder content off the Blerd nerd tabs.
  if (CRIME_SETS.has(set)) items = items.filter((i) => !CRIME_RE.test(i.title));

  cache[cacheKey] = { at: Date.now(), items };
  res.status(200).json({ items });
}

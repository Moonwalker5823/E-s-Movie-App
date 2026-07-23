// Curated African American & ancient African facts. One is featured per day —
// picked deterministically from the date so it changes daily and stays put all
// day. Kept accurate and verifiable.

export interface Fact {
  tag: "African American" | "Ancient Africa";
  text: string;
}

export const FACTS: Fact[] = [
  { tag: "African American", text: "Lewis Latimer patented a longer-lasting carbon filament for the light bulb in 1881 — and drafted the patent drawings for Alexander Graham Bell's telephone." },
  { tag: "African American", text: "Dr. Charles Drew pioneered blood banking and large-scale blood-plasma storage, a breakthrough that saved countless lives during World War II." },
  { tag: "African American", text: "Mark Dean co-invented the IBM PC's ISA bus and led the team that built the first gigahertz computer processor. He holds three of the IBM PC's nine original patents." },
  { tag: "African American", text: "Katherine Johnson's hand-calculated orbital math was so trusted that astronaut John Glenn asked her to personally verify the computer before his 1962 flight." },
  { tag: "African American", text: "Garrett Morgan invented an early three-position traffic signal and a smoke hood (an early gas mask) that saved workers' lives in a 1916 tunnel disaster." },
  { tag: "African American", text: "Gladys West's mathematical modeling of the exact shape of the Earth became a cornerstone of the Global Positioning System (GPS)." },
  { tag: "African American", text: "Dr. Patricia Bath invented the Laserphaco Probe for cataract surgery in 1986 — the first Black woman doctor to receive a patent for a medical device." },
  { tag: "African American", text: "Marie Van Brittan Brown invented the first home security system — complete with a video camera and two-way audio — in 1966." },
  { tag: "African American", text: "Granville Woods held roughly 60 patents, including a system that let moving trains communicate to avoid collisions. He was nicknamed 'the Black Edison.'" },
  { tag: "African American", text: "Frederick McKinley Jones invented practical mobile refrigeration for trucks (Thermo King), making it possible to ship frozen and fresh food long distances." },
  { tag: "African American", text: "Dr. Daniel Hale Williams performed one of the first successful open-heart surgeries in 1893 — and founded one of America's first interracial hospitals." },
  { tag: "African American", text: "Benjamin Banneker, a self-taught astronomer and mathematician, helped survey the boundaries of Washington, D.C. and published respected almanacs." },
  { tag: "African American", text: "Jerry Lawson led the team that created the first cartridge-based home video game console (the Fairchild Channel F) — the model every console followed." },
  { tag: "African American", text: "Dr. Shirley Ann Jackson was the first Black woman to earn a doctorate from MIT; her physics research helped advance modern telecommunications." },
  { tag: "African American", text: "Dr. Mae Jemison became the first Black woman in space aboard the Space Shuttle Endeavour in 1992 — she's also a physician and engineer." },
  { tag: "African American", text: "Otis Boykin invented an improved electrical resistor used in guided missiles, computers, and the control unit of the pacemaker." },
  { tag: "African American", text: "George Washington Carver developed hundreds of products from peanuts and sweet potatoes and taught crop rotation that revived exhausted Southern farmland." },
  { tag: "African American", text: "Percy Julian pioneered the chemical synthesis of medicines from plants, making cortisone and other drugs affordable and widely available." },
  { tag: "African American", text: "Madam C.J. Walker built a haircare empire and is recorded as one of the first self-made female millionaires in the United States." },
  { tag: "African American", text: "Bessie Coleman became the first African American woman to earn a pilot's license in 1921 — she had to travel to France to be trained." },
  { tag: "African American", text: "Matthew Henson was a key member — and co-discoverer — of the 1909 expedition credited with reaching the North Pole." },
  { tag: "African American", text: "Elijah McCoy's self-lubricating device for steam engines was so sought-after that buyers asked for 'the real McCoy' to get the genuine article." },
  { tag: "Ancient Africa", text: "Sudan is home to more than 200 ancient pyramids — far more than Egypt — built by the Nubian kingdoms of Kush." },
  { tag: "Ancient Africa", text: "Mansa Musa of the Mali Empire (14th century) is often described as the wealthiest person in all of recorded history." },
  { tag: "Ancient Africa", text: "The Kingdom of Kush conquered and ruled Egypt as its 25th Dynasty — a line of rulers known as the 'Black Pharaohs.'" },
  { tag: "Ancient Africa", text: "Timbuktu's University of Sankore was a world center of learning, and the city safeguarded hundreds of thousands of manuscripts on science, math, and medicine." },
  { tag: "Ancient Africa", text: "The Ishango bone, found near the Nile's source and over 20,000 years old, is one of the oldest known mathematical tools." },
  { tag: "Ancient Africa", text: "Great Zimbabwe was a vast medieval stone city, its towering walls built entirely without mortar." },
  { tag: "Ancient Africa", text: "The Kingdom of Aksum (in present-day Ethiopia) was a great power of antiquity that minted its own coins and was among the first states to adopt Christianity." },
  { tag: "Ancient Africa", text: "The earthen Walls of Benin were among the largest man-made structures in the world before the modern era, ringing the ancient city for miles." },
  { tag: "Ancient Africa", text: "The Nok culture of Nigeria was producing sophisticated life-sized terracotta sculptures more than 2,000 years ago." },
  { tag: "Ancient Africa", text: "Imhotep, architect of Egypt's Step Pyramid, was an engineer, physician, and one of the earliest known polymaths in human history." },
  { tag: "Ancient Africa", text: "The empires of Ghana, Mali, and Songhai grew rich controlling the trans-Saharan trade in gold and salt." },
  { tag: "Ancient Africa", text: "Ancient Egypt — one of history's longest-lasting civilizations, spanning over 3,000 years — arose and thrived on the African continent." },
  { tag: "Ancient Africa", text: "The Dogon people of Mali preserved a rich astronomical and cosmological tradition passed down over many generations." },
  { tag: "Ancient Africa", text: "The Library at Alexandria, in Africa, was the ancient world's greatest center of knowledge, drawing scholars from across three continents." },
];

/** Deterministic fact for the current day (changes at local midnight). */
export function factOfTheDay(now: Date = new Date()): Fact {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = Math.floor(midnight / 86400000);
  return FACTS[((day % FACTS.length) + FACTS.length) % FACTS.length];
}

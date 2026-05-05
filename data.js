const LISTINGS = [
  {
    id: "l1",
    title: "Burj Khalifa Sky Suite — 108th Floor",
    location: "Downtown Dubai",
    country: "United Arab Emirates",
    type: "Penthouse",
    pricePerNight: 4500,
    rating: 4.97,
    reviews: 312,
    superhost: true,
    beds: 2,
    baths: 2,
    guests: 4,
    host: { name: "Khalid", years: 6, avatar: "https://i.pravatar.cc/120?img=12" },
    amenities: ["Wi-Fi", "Skyline view", "Infinity pool access", "Concierge", "Air conditioning", "Gym", "Smart home", "Valet parking"],
    images: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80",
      "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80"
    ],
    description: "A two-bedroom suite on the 108th floor of the Burj Khalifa with floor-to-ceiling glass on three sides. Watch the Dubai Fountain from your sofa, then ride a private lift to the rooftop pool deck."
  },
  {
    id: "l2",
    title: "Palm Jumeirah Beachfront Villa with Private Pool",
    location: "Palm Jumeirah, Dubai",
    country: "United Arab Emirates",
    type: "Entire villa",
    pricePerNight: 8200,
    rating: 4.95,
    reviews: 184,
    superhost: true,
    beds: 5,
    baths: 5,
    guests: 10,
    host: { name: "Mariam", years: 9, avatar: "https://i.pravatar.cc/120?img=44" },
    amenities: ["Wi-Fi", "Private beach", "Pool", "Kitchen", "BBQ", "Air conditioning", "Hot tub", "Free parking", "Gym"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"
    ],
    description: "Five-bedroom contemporary villa on the outer crescent of Palm Jumeirah. Step from your infinity pool onto a 30-metre stretch of private sand with the Atlantis lit up across the bay every night."
  },
  {
    id: "l3",
    title: "Desert Safari Tent with Stargazing Deck",
    location: "Al Marmoom Reserve",
    country: "United Arab Emirates",
    type: "Luxury tent",
    pricePerNight: 1800,
    rating: 4.92,
    reviews: 246,
    superhost: true,
    beds: 1,
    baths: 1,
    guests: 2,
    host: { name: "Salem", years: 4, avatar: "https://i.pravatar.cc/120?img=8" },
    amenities: ["Wi-Fi", "Outdoor shower", "Stargazing deck", "Camel rides", "Bedouin breakfast", "Air conditioning", "Fire pit"],
    images: [
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80",
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80",
      "https://images.unsplash.com/photo-1520984032042-162d526883e0?w=1200&q=80",
      "https://images.unsplash.com/photo-1595274459742-4a41d35784ee?w=1200&q=80"
    ],
    description: "A canvas-and-cedar suite in the heart of the Al Marmoom conservation reserve. Wake to oryx grazing past the deck; nights are silent except for the wind, with the Milky Way stretching from dune to dune."
  },
  {
    id: "l4",
    title: "Abu Dhabi Corniche Penthouse",
    location: "Corniche, Abu Dhabi",
    country: "United Arab Emirates",
    type: "Penthouse",
    pricePerNight: 3400,
    rating: 4.91,
    reviews: 158,
    superhost: false,
    beds: 3,
    baths: 3,
    guests: 6,
    host: { name: "Reem", years: 5, avatar: "https://i.pravatar.cc/120?img=29" },
    amenities: ["Wi-Fi", "Sea view", "Pool", "Kitchen", "Air conditioning", "Workspace", "Gym", "Elevator"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80"
    ],
    description: "Floor-through penthouse facing the Corniche promenade and the Arabian Gulf. Walk to Sheikh Zayed Grand Mosque in fifteen minutes; the souk and Heritage Village are even closer."
  },
  {
    id: "l5",
    title: "Hatta Mountain Eco Lodge",
    location: "Hatta, Dubai",
    country: "United Arab Emirates",
    type: "Eco lodge",
    pricePerNight: 1250,
    rating: 4.88,
    reviews: 201,
    superhost: true,
    beds: 2,
    baths: 1,
    guests: 4,
    host: { name: "Ahmad", years: 7, avatar: "https://i.pravatar.cc/120?img=33" },
    amenities: ["Wi-Fi", "Mountain view", "Fire pit", "Kitchenette", "Heating", "Free parking", "Hiking trails", "Kayak access"],
    images: [
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=1200&q=80",
      "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80",
      "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200&q=80",
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80"
    ],
    description: "Stone-built lodge tucked into the Hajar Mountains, ten minutes' drive from Hatta Dam. Pack the kayak in the morning, hike the Wadi Hub trail at sunset, and grill under the stars."
  },
  {
    id: "l6",
    title: "Al Fahidi Heritage Riad",
    location: "Al Fahidi Historical District, Dubai",
    country: "United Arab Emirates",
    type: "Heritage home",
    pricePerNight: 950,
    rating: 4.94,
    reviews: 387,
    superhost: true,
    beds: 3,
    baths: 3,
    guests: 6,
    host: { name: "Yasmin", years: 11, avatar: "https://i.pravatar.cc/120?img=32" },
    amenities: ["Wi-Fi", "Courtyard", "Wind tower", "Breakfast included", "Air conditioning", "Bicycles", "Souk access"],
    images: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
      "https://images.unsplash.com/photo-1539020140153-e479b8c5c1f9?w=1200&q=80",
      "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80",
      "https://images.unsplash.com/photo-1503328427499-d92d1ac3d174?w=1200&q=80"
    ],
    description: "A restored 1890s coral-stone home with a traditional barjeel wind tower and a tiled courtyard fountain. Step out the door into the Al Fahidi alleys, the Textile Souk, and the Dubai Creek abra dock."
  },
  {
    id: "l7",
    title: "Saadiyat Beach Villa with Pool",
    location: "Saadiyat Island, Abu Dhabi",
    country: "United Arab Emirates",
    type: "Beachfront villa",
    pricePerNight: 5600,
    rating: 4.96,
    reviews: 142,
    superhost: true,
    beds: 4,
    baths: 4,
    guests: 8,
    host: { name: "Layla", years: 8, avatar: "https://i.pravatar.cc/120?img=49" },
    amenities: ["Wi-Fi", "Private beach", "Pool", "Chef on request", "Kitchen", "Air conditioning", "Beach equipment", "Free parking"],
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
      "https://images.unsplash.com/photo-1583878457092-0ad13fb8b777?w=1200&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80"
    ],
    description: "A whitewashed contemporary villa on the protected stretch of Saadiyat Beach where hawksbill turtles still nest. Ten minutes from the Louvre Abu Dhabi and Manarat Al Saadiyat."
  },
  {
    id: "l8",
    title: "Jebel Jais Cliff House",
    location: "Jebel Jais, Ras Al Khaimah",
    country: "United Arab Emirates",
    type: "Cliffside home",
    pricePerNight: 2400,
    rating: 4.93,
    reviews: 96,
    superhost: false,
    beds: 3,
    baths: 2,
    guests: 6,
    host: { name: "Omar", years: 3, avatar: "https://i.pravatar.cc/120?img=11" },
    amenities: ["Wi-Fi", "Mountain view", "Hot tub", "Fireplace", "Kitchen", "Heating", "Stargazing deck", "Hiking access"],
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"
    ],
    description: "Cantilevered concrete-and-glass perch on the highest peak in the UAE. The temperature drops 10°C from the coast, and the world's longest zipline launches a five-minute drive away."
  },
  {
    id: "l9",
    title: "Yas Marina F1-View Loft",
    location: "Yas Island, Abu Dhabi",
    country: "United Arab Emirates",
    type: "Loft",
    pricePerNight: 2100,
    rating: 4.87,
    reviews: 211,
    superhost: false,
    beds: 2,
    baths: 2,
    guests: 4,
    host: { name: "Sara", years: 4, avatar: "https://i.pravatar.cc/120?img=20" },
    amenities: ["Wi-Fi", "Marina view", "Pool", "Kitchen", "Air conditioning", "Workspace", "Elevator", "Gym"],
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
      "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80"
    ],
    description: "Open-plan loft above Yas Marina with a balcony directly over the F1 circuit's hairpin. Walk to Ferrari World, Yas Waterworld, and Warner Bros World in under fifteen minutes."
  },
  {
    id: "l10",
    title: "Fujairah Coral Coast Bungalow",
    location: "Al Aqah, Fujairah",
    country: "United Arab Emirates",
    type: "Beach bungalow",
    pricePerNight: 1650,
    rating: 4.89,
    reviews: 173,
    superhost: true,
    beds: 2,
    baths: 2,
    guests: 4,
    host: { name: "Tariq", years: 6, avatar: "https://i.pravatar.cc/120?img=15" },
    amenities: ["Wi-Fi", "Private beach", "Snorkel gear", "Kitchen", "Air conditioning", "Hammock", "Free parking"],
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"
    ],
    description: "A timber bungalow on Al Aqah's coral coast, looking across the Gulf of Oman at Snoopy Island. Best snorkelling in the Emirates is a fifteen-metre swim from the deck."
  },
  {
    id: "l11",
    title: "The World Islands Private Estate",
    location: "The World, Dubai",
    country: "United Arab Emirates",
    type: "Private estate",
    pricePerNight: 12000,
    rating: 4.99,
    reviews: 47,
    superhost: true,
    beds: 6,
    baths: 7,
    guests: 12,
    host: { name: "Hessa", years: 5, avatar: "https://i.pravatar.cc/120?img=45" },
    amenities: ["Wi-Fi", "Private beach", "Multiple pools", "Speedboat transfer", "Chef", "Butler", "Spa", "Gym", "Helipad"],
    images: [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"
    ],
    description: "Your own island in the Dubai archipelago, reached by a fifteen-minute speedboat ride from Marina. Six suites, a saltwater pool, full staff, and the entire skyline as your backdrop."
  },
  {
    id: "l12",
    title: "Sharjah Heart of Sharjah Studio",
    location: "Heart of Sharjah, Sharjah",
    country: "United Arab Emirates",
    type: "Heritage studio",
    pricePerNight: 680,
    rating: 4.86,
    reviews: 422,
    superhost: true,
    beds: 1,
    baths: 1,
    guests: 2,
    host: { name: "Noura", years: 10, avatar: "https://i.pravatar.cc/120?img=47" },
    amenities: ["Wi-Fi", "Courtyard", "Kitchenette", "Air conditioning", "Workspace", "Souk access", "Bicycles"],
    images: [
      "https://images.unsplash.com/photo-1539020140153-e479b8c5c1f9?w=1200&q=80",
      "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
      "https://images.unsplash.com/photo-1503328427499-d92d1ac3d174?w=1200&q=80"
    ],
    description: "A loft above a calligraphy studio in the Heart of Sharjah heritage district. Steps from the Blue Souk, the Calligraphy Museum, and the Arts Area's monthly biennale exhibitions."
  }
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "beachfront", label: "Beachfront", icon: "🏖️" },
  { id: "desert", label: "Desert", icon: "🐪" },
  { id: "skyline", label: "Skyline", icon: "🏙️" },
  { id: "luxe", label: "Luxe", icon: "✨" },
  { id: "mountains", label: "Mountains", icon: "⛰️" },
  { id: "heritage", label: "Heritage", icon: "🕌" },
  { id: "pools", label: "Amazing pools", icon: "🏊" },
  { id: "marina", label: "Marina", icon: "⚓" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "resort", label: "Resort", icon: "🏝️" },
  { id: "souk", label: "Souk-side", icon: "🛍️" }
];

const CATEGORY_MAP = {
  l1: ["skyline", "luxe", "pools"],
  l2: ["beachfront", "luxe", "pools", "resort"],
  l3: ["desert", "design"],
  l4: ["skyline", "luxe", "design"],
  l5: ["mountains", "heritage"],
  l6: ["heritage", "design", "souk"],
  l7: ["beachfront", "luxe", "resort"],
  l8: ["mountains", "design"],
  l9: ["marina", "skyline", "design"],
  l10: ["beachfront", "resort"],
  l11: ["beachfront", "luxe", "pools", "resort"],
  l12: ["heritage", "design", "souk"]
};

// Continental meal add-ons. Pricing is per person per day. Each meal type
// has a curated menu — guests pick which items to include with the booking.
const MEALS = [
  {
    id: "breakfast",
    label: "Continental breakfast",
    emoji: "🥐",
    pricePerPerson: 0,
    free: true,
    serving: "Served 7:00 – 10:30 · complimentary with every booking",
    menu: [
      { name: "Eggs Benedict with Hollandaise", image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80" },
      { name: "Avocado Toast on Sourdough", image: "https://images.unsplash.com/photo-1603046891744-1f76eb10aec3?w=600&q=80" },
      { name: "Buttery Croissant & Pain au Chocolat", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80" },
      { name: "Belgian Waffles with Berries", image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80" },
      { name: "Greek Yogurt Parfait", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80" },
      { name: "Smoked Salmon Bagel", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80" },
      { name: "Buttermilk Pancakes with Maple", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80" },
      { name: "Eggs Florentine", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80" }
    ]
  },
  {
    id: "lunch",
    label: "Continental lunch",
    emoji: "🥗",
    pricePerPerson: 95,
    serving: "Served 12:30 – 15:00",
    menu: [
      { name: "Caesar Salad with Anchovies", image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80" },
      { name: "Caprese Sandwich on Ciabatta", image: "https://images.unsplash.com/photo-1539252554935-80c8cabc1eaf?w=600&q=80" },
      { name: "Beef Carpaccio with Rocket", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80" },
      { name: "Wild Mushroom Risotto", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80" },
      { name: "Grilled Salmon Filet", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80" },
      { name: "Chicken Parmigiana", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80" },
      { name: "Roasted Tomato & Basil Soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80" },
      { name: "Margherita Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80" }
    ]
  },
  {
    id: "dinner",
    label: "Continental dinner",
    emoji: "🍽️",
    pricePerPerson: 125,
    serving: "Served 19:00 – 22:30",
    menu: [
      { name: "Filet Mignon with Truffle Jus", image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80" },
      { name: "Lobster Thermidor", image: "https://images.unsplash.com/photo-1565299543923-37dd37887442?w=600&q=80" },
      { name: "Duck à l'Orange", image: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80" },
      { name: "Beef Wellington", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80" },
      { name: "Veal Osso Buco with Gremolata", image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&q=80" },
      { name: "Pan-Seared Halibut", image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600&q=80" },
      { name: "Vegetable Wellington", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" },
      { name: "Lamb Rack with Rosemary", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80" }
    ]
  }
];

// UAE festival windows. A booking that overlaps any of these gets 5% off the nightly subtotal.
const FESTIVALS = [
  { id: "eid-fitr",     name: "Eid Al Fitr",      emoji: "🌙", start: "2026-03-19", end: "2026-03-23" },
  { id: "eid-adha",     name: "Eid Al Adha",      emoji: "🐑", start: "2026-05-26", end: "2026-05-30" },
  { id: "diwali",       name: "Diwali",           emoji: "🪔", start: "2026-11-06", end: "2026-11-09" },
  { id: "national-day", name: "UAE National Day", emoji: "🇦🇪", start: "2026-12-01", end: "2026-12-03" },
  { id: "new-year",     name: "New Year",         emoji: "🎆", start: "2026-12-30", end: "2027-01-02" }
];
const FESTIVAL_DISCOUNT = 0.05;

function festivalForRange(checkInMs, checkOutMs) {
  for (const f of FESTIVALS) {
    const fs = new Date(f.start + "T00:00:00").getTime();
    const fe = new Date(f.end + "T00:00:00").getTime() + 86400000;
    if (checkInMs < fe && checkOutMs > fs) return f;
  }
  return null;
}
function nextFestival(now = Date.now()) {
  return FESTIVALS
    .map(f => ({ ...f, ts: new Date(f.start + "T00:00:00").getTime() }))
    .filter(f => f.ts >= now - 5 * 86400000)
    .sort((a, b) => a.ts - b.ts)[0] || FESTIVALS[0];
}

if (typeof window !== "undefined") {
  window.LISTINGS = LISTINGS;
  window.CATEGORIES = CATEGORIES;
  window.CATEGORY_MAP = CATEGORY_MAP;
  window.FESTIVALS = FESTIVALS;
  window.FESTIVAL_DISCOUNT = FESTIVAL_DISCOUNT;
  window.festivalForRange = festivalForRange;
  window.nextFestival = nextFestival;
  window.MEALS = MEALS;
}

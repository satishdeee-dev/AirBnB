const LISTINGS = [
  {
    id: "l1",
    title: "Ocean View Villa with Private Pool",
    location: "Malibu, California",
    country: "United States",
    type: "Entire villa",
    pricePerNight: 689,
    rating: 4.96,
    reviews: 218,
    superhost: true,
    beds: 4,
    baths: 3,
    guests: 8,
    host: { name: "Amelia", years: 7, avatar: "https://i.pravatar.cc/120?img=47" },
    amenities: ["Wi-Fi", "Pool", "Kitchen", "Free parking", "Air conditioning", "Beachfront", "Hot tub", "TV"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"
    ],
    description: "Wake up to the Pacific surf from a glass-walled bedroom. This four-bedroom villa pairs designer interiors with a heated infinity pool, private chef's kitchen, and direct path to the beach."
  },
  {
    id: "l2",
    title: "Modern Loft in the Heart of SoHo",
    location: "New York, New York",
    country: "United States",
    type: "Entire loft",
    pricePerNight: 312,
    rating: 4.88,
    reviews: 412,
    superhost: true,
    beds: 2,
    baths: 2,
    guests: 4,
    host: { name: "Marcus", years: 5, avatar: "https://i.pravatar.cc/120?img=12" },
    amenities: ["Wi-Fi", "Kitchen", "Washer", "Air conditioning", "Workspace", "Elevator", "TV", "Heating"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80"
    ],
    description: "Industrial cast-iron loft on a cobblestone street. Soaring 14-foot ceilings, walnut floors, and walking distance to galleries, espresso bars, and the best dumplings in Manhattan."
  },
  {
    id: "l3",
    title: "Santorini Cliffside Cave Suite",
    location: "Oia, Greece",
    country: "Greece",
    type: "Entire suite",
    pricePerNight: 524,
    rating: 4.99,
    reviews: 631,
    superhost: true,
    beds: 1,
    baths: 1,
    guests: 2,
    host: { name: "Eleni", years: 9, avatar: "https://i.pravatar.cc/120?img=45" },
    amenities: ["Wi-Fi", "Plunge pool", "Kitchenette", "Air conditioning", "Sea view", "Breakfast", "Heating"],
    images: [
      "https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=1200&q=80",
      "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1200&q=80",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80",
      "https://images.unsplash.com/photo-1503152394-c571994fd383?w=1200&q=80",
      "https://images.unsplash.com/photo-1547150491-1d22a5b73d4f?w=1200&q=80"
    ],
    description: "A whitewashed cave carved into the caldera, with a plunge pool that floats above the Aegean. Sunsets here have been called the most photographed in the world for a reason."
  },
  {
    id: "l4",
    title: "Forest Treehouse with Hot Tub",
    location: "Asheville, North Carolina",
    country: "United States",
    type: "Treehouse",
    pricePerNight: 245,
    rating: 4.92,
    reviews: 188,
    superhost: false,
    beds: 1,
    baths: 1,
    guests: 2,
    host: { name: "Daniel", years: 3, avatar: "https://i.pravatar.cc/120?img=33" },
    amenities: ["Wi-Fi", "Hot tub", "Kitchenette", "Heating", "Forest view", "Free parking", "Fireplace"],
    images: [
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80",
      "https://images.unsplash.com/photo-1520984032042-162d526883e0?w=1200&q=80",
      "https://images.unsplash.com/photo-1595274459742-4a41d35784ee?w=1200&q=80"
    ],
    description: "Suspended 30 feet up in the canopy of the Blue Ridge Mountains. A wood-burning stove, copper hot tub on the deck, and zero light pollution — the Milky Way is visible most nights."
  },
  {
    id: "l5",
    title: "Kyoto Machiya Townhouse",
    location: "Higashiyama, Japan",
    country: "Japan",
    type: "Entire home",
    pricePerNight: 198,
    rating: 4.94,
    reviews: 296,
    superhost: true,
    beds: 2,
    baths: 1,
    guests: 4,
    host: { name: "Hiroshi", years: 6, avatar: "https://i.pravatar.cc/120?img=15" },
    amenities: ["Wi-Fi", "Tatami room", "Soaking tub", "Garden", "Heating", "Kitchen", "Bicycles"],
    images: [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80",
      "https://images.unsplash.com/photo-1545569310-a93deb3a0c5d?w=1200&q=80",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
      "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1200&q=80"
    ],
    description: "A restored 1920s machiya with a sliding shoji screens, a small zen garden, and a hinoki cypress soaking tub. Five minutes on foot from Kiyomizu-dera."
  },
  {
    id: "l6",
    title: "Desert Modern Retreat",
    location: "Joshua Tree, California",
    country: "United States",
    type: "Entire home",
    pricePerNight: 389,
    rating: 4.86,
    reviews: 154,
    superhost: false,
    beds: 3,
    baths: 2,
    guests: 6,
    host: { name: "Sienna", years: 4, avatar: "https://i.pravatar.cc/120?img=44" },
    amenities: ["Wi-Fi", "Pool", "Hot tub", "Fire pit", "Kitchen", "Stargazing deck", "Air conditioning"],
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"
    ],
    description: "An angular concrete-and-glass house on five acres of high desert. Watch the sunset paint the boulders pink from the saltwater pool, then warm up by the fire pit under a sky full of stars."
  },
  {
    id: "l7",
    title: "Tuscan Stone Farmhouse with Vineyard",
    location: "Chianti, Italy",
    country: "Italy",
    type: "Entire farmhouse",
    pricePerNight: 432,
    rating: 4.97,
    reviews: 309,
    superhost: true,
    beds: 5,
    baths: 4,
    guests: 10,
    host: { name: "Giulia", years: 11, avatar: "https://i.pravatar.cc/120?img=49" },
    amenities: ["Wi-Fi", "Pool", "Kitchen", "Wine cellar", "Garden", "Free parking", "Fireplace", "BBQ"],
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
      "https://images.unsplash.com/photo-1583878457092-0ad13fb8b777?w=1200&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80"
    ],
    description: "A 17th-century stone farmhouse on a working Sangiovese vineyard. Long lunches under the pergola, evening walks between rows of cypress trees, and complimentary wine tastings on Saturdays."
  },
  {
    id: "l8",
    title: "Minimalist Penthouse with Skyline View",
    location: "Tokyo, Japan",
    country: "Japan",
    type: "Penthouse",
    pricePerNight: 598,
    rating: 4.91,
    reviews: 142,
    superhost: true,
    beds: 2,
    baths: 2,
    guests: 4,
    host: { name: "Yuki", years: 5, avatar: "https://i.pravatar.cc/120?img=20" },
    amenities: ["Wi-Fi", "Skyline view", "Kitchen", "Air conditioning", "Workspace", "Elevator", "Smart home"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
      "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80"
    ],
    description: "Floor-to-ceiling windows on the 38th floor of Roppongi Hills. White oak, brushed brass, and a quiet that feels impossible in a city of 14 million. Tokyo Tower lights up at sunset."
  },
  {
    id: "l9",
    title: "Cozy Alpine Chalet by the Slopes",
    location: "Chamonix, France",
    country: "France",
    type: "Chalet",
    pricePerNight: 478,
    rating: 4.93,
    reviews: 261,
    superhost: true,
    beds: 4,
    baths: 3,
    guests: 8,
    host: { name: "Sophie", years: 8, avatar: "https://i.pravatar.cc/120?img=29" },
    amenities: ["Wi-Fi", "Hot tub", "Sauna", "Fireplace", "Ski-in/out", "Kitchen", "Heating"],
    images: [
      "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=1200&q=80",
      "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80",
      "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=1200&q=80",
      "https://images.unsplash.com/photo-1520984032042-162d526883e0?w=1200&q=80"
    ],
    description: "A timber-frame chalet at 1,200 meters with a view of Mont Blanc from the breakfast table. Walk out the back door, click in, and you're on the Brévent gondola in under three minutes."
  },
  {
    id: "l10",
    title: "Overwater Bungalow with Glass Floor",
    location: "Bora Bora, French Polynesia",
    country: "French Polynesia",
    type: "Bungalow",
    pricePerNight: 1240,
    rating: 4.98,
    reviews: 89,
    superhost: true,
    beds: 1,
    baths: 1,
    guests: 2,
    host: { name: "Tane", years: 6, avatar: "https://i.pravatar.cc/120?img=11" },
    amenities: ["Wi-Fi", "Lagoon access", "Glass floor", "Snorkel gear", "Kayaks", "Breakfast included"],
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"
    ],
    description: "Step from your deck straight into the turquoise lagoon. The glass floor inside the bedroom looks down on tropical fish, and Mount Otemanu fills the horizon every morning."
  },
  {
    id: "l11",
    title: "Lakeside Log Cabin with Private Dock",
    location: "Lake Tahoe, California",
    country: "United States",
    type: "Cabin",
    pricePerNight: 354,
    rating: 4.85,
    reviews: 203,
    superhost: false,
    beds: 3,
    baths: 2,
    guests: 6,
    host: { name: "Caleb", years: 4, avatar: "https://i.pravatar.cc/120?img=8" },
    amenities: ["Wi-Fi", "Lake access", "Kayaks", "Fireplace", "Kitchen", "Hot tub", "Free parking"],
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80"
    ],
    description: "Hand-built cedar cabin right on the water. Pine-scented mornings, a wood-fired hot tub, and a paddleboard waiting on the dock. Twenty minutes to Heavenly's main lodge."
  },
  {
    id: "l12",
    title: "Whitewashed Riad in the Medina",
    location: "Marrakech, Morocco",
    country: "Morocco",
    type: "Riad",
    pricePerNight: 167,
    rating: 4.9,
    reviews: 488,
    superhost: true,
    beds: 4,
    baths: 4,
    guests: 8,
    host: { name: "Yasmine", years: 10, avatar: "https://i.pravatar.cc/120?img=32" },
    amenities: ["Wi-Fi", "Plunge pool", "Rooftop terrace", "Breakfast", "Air conditioning", "Hammam"],
    images: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80",
      "https://images.unsplash.com/photo-1539020140153-e479b8c5c1f9?w=1200&q=80",
      "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80",
      "https://images.unsplash.com/photo-1503328427499-d92d1ac3d174?w=1200&q=80"
    ],
    description: "Hand-tiled zellige courtyards, brass lanterns, and a rooftop terrace looking across the medina to the Atlas Mountains. Mint tea is served at sunset, every night."
  }
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "beachfront", label: "Beachfront", icon: "🏖️" },
  { id: "tropical", label: "Tropical", icon: "🌴" },
  { id: "cabins", label: "Cabins", icon: "🪵" },
  { id: "city", label: "City", icon: "🏙️" },
  { id: "luxe", label: "Luxe", icon: "✨" },
  { id: "countryside", label: "Countryside", icon: "🌾" },
  { id: "mountains", label: "Mountains", icon: "⛰️" },
  { id: "design", label: "Design", icon: "🎨" },
  { id: "pools", label: "Amazing pools", icon: "🏊" },
  { id: "ski", label: "Skiing", icon: "🎿" },
  { id: "historic", label: "Historic", icon: "🏛️" }
];

const CATEGORY_MAP = {
  l1: ["beachfront", "luxe", "pools"],
  l2: ["city", "design"],
  l3: ["luxe", "design", "pools"],
  l4: ["cabins", "countryside"],
  l5: ["historic", "design"],
  l6: ["design", "pools"],
  l7: ["countryside", "historic", "pools"],
  l8: ["city", "luxe", "design"],
  l9: ["mountains", "ski", "cabins"],
  l10: ["beachfront", "tropical", "luxe"],
  l11: ["cabins", "mountains"],
  l12: ["historic", "design"]
};

if (typeof window !== "undefined") {
  window.LISTINGS = LISTINGS;
  window.CATEGORIES = CATEGORIES;
  window.CATEGORY_MAP = CATEGORY_MAP;
}

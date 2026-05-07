-- 12 additional UAE hotels and resorts. IDs l13–l24.

insert into public.listings (id, title, type, location, country, price_per_night, rating, reviews, superhost, beds, baths, guests, host, amenities, images, description) values
('l13','Atlantis The Royal — Sky Suite','Resort suite','Palm Jumeirah Crescent, Dubai','United Arab Emirates',7500,4.96,287,true,3,3,6,
 '{"name":"Atlantis Royal Concierge","years":2,"avatar":"https://i.pravatar.cc/120?img=24"}'::jsonb,
 '["Wi-Fi","Beach access","Sky pool","Concierge","Air conditioning","Gym","Spa","Multiple restaurants","Helipad transfer"]'::jsonb,
 '["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"]'::jsonb,
 'A three-bedroom suite on the upper deck of Atlantis The Royal, with a private sky pool that hangs over the Arabian Gulf. Direct beach access, 17 in-resort restaurants, and the Royal Beach Club below.'),

('l14','Burj Al Arab Royal Suite','Hotel suite','Jumeirah Beach, Dubai','United Arab Emirates',18000,4.99,98,true,2,2,4,
 '{"name":"Sami","years":12,"avatar":"https://i.pravatar.cc/120?img=14"}'::jsonb,
 '["Wi-Fi","Butler service","24-carat gold leaf","Private cinema","Air conditioning","Helipad","Beach access","Rolls-Royce transfers","Champagne breakfast"]'::jsonb,
 '["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80"]'::jsonb,
 'Seven-star indulgence in the worlds most photographed hotel. Two floors of marble and silk with a panoramic view across the Gulf, a personal butler around the clock, and Rolls-Royce transfers as standard.'),

('l15','Bvlgari Resort Marina Lodge','Hotel','Jumeira Bay Island, Dubai','United Arab Emirates',6200,4.94,143,true,2,2,4,
 '{"name":"Bvlgari Hosts","years":4,"avatar":"https://i.pravatar.cc/120?img=22"}'::jsonb,
 '["Wi-Fi","Marina view","Pool","Spa","Kitchen","Air conditioning","Boat charter","Beach access","Italian dining"]'::jsonb,
 '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80","https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80","https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80"]'::jsonb,
 'A two-bedroom marina lodge inside Antonio Citterios seahorse-shaped island. Wake to the yachts of Jumeira Bay; dine at Niko Romito after a Roman-marble afternoon at the spa.'),

('l16','Address Beach Resort — Skyline Suite','Resort','Jumeirah Beach Residence, Dubai','United Arab Emirates',2800,4.89,461,false,2,2,4,
 '{"name":"Address Concierge","years":3,"avatar":"https://i.pravatar.cc/120?img=18"}'::jsonb,
 '["Wi-Fi","Edge pool (294m)","Beach access","Air conditioning","Workspace","Gym","Spa","Restaurants","Marina view"]'::jsonb,
 '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80"]'::jsonb,
 'On the 75th floor of the worlds highest 360-degree infinity pool. Wake up to the Marina skyline, swim straight off the rooftop, and walk to JBR for late-night shawarma.'),

('l17','Qasr Al Sarab Desert Resort — Pool Villa','Desert resort','Liwa, Empty Quarter','United Arab Emirates',3600,4.97,184,true,2,2,4,
 '{"name":"Anantara Desert Hosts","years":7,"avatar":"https://i.pravatar.cc/120?img=10"}'::jsonb,
 '["Wi-Fi","Private pool","Stargazing deck","Camel rides","Air conditioning","Spa","Falconry","Dune-bashing","Bedouin breakfast"]'::jsonb,
 '["https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80","https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&q=80","https://images.unsplash.com/photo-1520984032042-162d526883e0?w=1200&q=80","https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80"]'::jsonb,
 'A walled fortress hotel deep inside the worlds largest sand desert. Camel-track sunsets, falconry at dawn, and a heated pool tucked behind your private courtyard.'),

('l18','Ritz-Carlton Al Wadi Tented Villa','Tented villa','Wadi Khadeja, Ras Al Khaimah','United Arab Emirates',4200,4.95,156,true,1,1,2,
 '{"name":"Ritz-Carlton Al Wadi","years":6,"avatar":"https://i.pravatar.cc/120?img=27"}'::jsonb,
 '["Wi-Fi","Private pool","Outdoor shower","Air conditioning","Telescope","Equestrian centre","Falconry","Spa","Camp fire"]'::jsonb,
 '["https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80","https://images.unsplash.com/photo-1547235001-d703406d3300?w=1200&q=80","https://images.unsplash.com/photo-1469796466635-455ede028aca?w=1200&q=80","https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80"]'::jsonb,
 'A canvas-roofed villa on the edge of the wadi with a temperature-controlled plunge pool. Mornings start with horseback rides through the reserve; evenings end with a campfire under the brightest stars in the country.'),

('l19','Waldorf Astoria Ras Al Khaimah — Lagoon Suite','Resort suite','Al Hamra Village, Ras Al Khaimah','United Arab Emirates',3200,4.92,222,false,2,2,4,
 '{"name":"Waldorf Astoria RAK","years":5,"avatar":"https://i.pravatar.cc/120?img=39"}'::jsonb,
 '["Wi-Fi","Lagoon view","Beach access","Three pools","Spa","Air conditioning","Golf course","Restaurants","Tennis"]'::jsonb,
 '["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80","https://images.unsplash.com/photo-1583878457092-0ad13fb8b777?w=1200&q=80","https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80"]'::jsonb,
 'A Mediterranean-styled suite overlooking the Al Hamra lagoon. Three pools to choose from, a private 350-metre stretch of beach, and a championship golf course at the door.'),

('l20','Banyan Tree Ras Al Khaimah Beach Villa','Beach villa','Al Marjan Island, Ras Al Khaimah','United Arab Emirates',2900,4.91,167,true,1,1,2,
 '{"name":"Banyan Tree","years":4,"avatar":"https://i.pravatar.cc/120?img=25"}'::jsonb,
 '["Wi-Fi","Private beach","Pool","Outdoor shower","Spa","Air conditioning","BBQ","Bicycle hire","Yoga deck"]'::jsonb,
 '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80","https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80","https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"]'::jsonb,
 'A timber-and-stone villa with feet-in-sand access to the lagoon. Sunset yoga on your private deck, candlelit dining on the beach, and the Banyan spa next door.'),

('l21','Al Maha Desert Resort — Bedouin Suite','Desert resort','Dubai Desert Conservation Reserve','United Arab Emirates',5500,4.97,289,true,1,1,2,
 '{"name":"Al Maha Hosts","years":11,"avatar":"https://i.pravatar.cc/120?img=42"}'::jsonb,
 '["Wi-Fi","Private temperature pool","Camel rides","Falconry","Wildlife drives","Air conditioning","Bedouin tent","Stargazing","Couples dining"]'::jsonb,
 '["https://images.unsplash.com/photo-1547235001-d703406d3300?w=1200&q=80","https://images.unsplash.com/photo-1469796466635-455ede028aca?w=1200&q=80","https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80","https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80"]'::jsonb,
 'The UAEs first desert resort, set inside its largest reserve. Two oryx, a flock of gazelles, and not a single car horn for miles. All meals and two activities a day are included.'),

('l22','Le Royal Méridien Beach Resort — Marina Suite','Resort','Dubai Marina','United Arab Emirates',1800,4.83,512,false,2,2,4,
 '{"name":"Le Royal Méridien","years":8,"avatar":"https://i.pravatar.cc/120?img=37"}'::jsonb,
 '["Wi-Fi","Beach access","Three pools","Air conditioning","Gym","Restaurants","Tennis","Watersports","Marina view"]'::jsonb,
 '["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80"]'::jsonb,
 'Marina-side classic with three pools, a banyan-shaded courtyard, and a 500-metre stretch of beach. Walk the Marina Walk in 8 minutes; the metro to Downtown is at the door.'),

('l23','Le Méridien Al Aqah Beach Resort','Resort','Al Aqah, Fujairah','United Arab Emirates',1400,4.85,378,false,2,2,4,
 '{"name":"Al Aqah Hosts","years":6,"avatar":"https://i.pravatar.cc/120?img=31"}'::jsonb,
 '["Wi-Fi","Private beach","Pool","Snorkel gear","Air conditioning","Spa","Diving centre","Restaurants","Kids club"]'::jsonb,
 '["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80","https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80","https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80"]'::jsonb,
 'Reef-front resort with the best house-reef snorkelling in the country — clownfish and turtles within a fifteen-metre swim. Five restaurants on-site, plus a Lunar shaped pool that lights up at sunset.'),

('l24','Park Hyatt Dubai Creek Suite','Hotel suite','Dubai Creek Golf & Yacht Club','United Arab Emirates',2400,4.9,194,true,1,2,2,
 '{"name":"Park Hyatt Dubai","years":7,"avatar":"https://i.pravatar.cc/120?img=20"}'::jsonb,
 '["Wi-Fi","Marina view","Pool","Spa","Air conditioning","Golf course","Restaurants","Workspace","Yacht charter"]'::jsonb,
 '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80","https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80","https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"]'::jsonb,
 'Whitewashed Mediterranean architecture overlooking the Dubai Creek golf course and yacht marina. A 15-minute drive from DXB; a 5-minute walk to the abra crossing into Old Dubai.')
on conflict (id) do nothing;

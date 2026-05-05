// Tiny localStorage-backed store for users, listings, and bookings.
// Seed data is merged in on first load.

const KEYS = {
  users: "stayly.users",
  session: "stayly.session",
  listings: "stayly.listings",
  bookings: "stayly.bookings",
  tickets: "stayly.tickets",
  seeded: "stayly.seeded.v2"
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

function seedIfNeeded() {
  if (read(KEYS.seeded, false)) return;
  const seedUsers = [
    { id: "u_admin", name: "Admin", email: "admin@stayly.com", password: "admin123", role: "admin", createdAt: Date.now() },
    { id: "u_demo", name: "Demo Guest", email: "guest@stayly.com", password: "guest123", role: "user", createdAt: Date.now() }
  ];
  write(KEYS.users, seedUsers);
  write(KEYS.listings, LISTINGS.map(l => ({ ...l, ownerId: "u_admin", active: true })));
  write(KEYS.bookings, []);
  write(KEYS.seeded, true);
}

const Store = {
  init() { seedIfNeeded(); },

  // ---- auth / users ----
  users: {
    all: () => read(KEYS.users, []),
    findByEmail(email) {
      return Store.users.all().find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    create({ name, email, password, role = "user" }) {
      const users = Store.users.all();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("An account with that email already exists.");
      }
      const user = { id: uid("u"), name, email, password, role, createdAt: Date.now() };
      users.push(user);
      write(KEYS.users, users);
      return user;
    },
    remove(id) {
      const users = Store.users.all().filter(u => u.id !== id);
      write(KEYS.users, users);
    }
  },

  session: {
    current: () => read(KEYS.session, null),
    login(email, password) {
      const user = Store.users.findByEmail(email);
      if (!user || user.password !== password) {
        throw new Error("Wrong email or password.");
      }
      const session = { userId: user.id, role: user.role, name: user.name, email: user.email };
      write(KEYS.session, session);
      return session;
    },
    logout() {
      localStorage.removeItem(KEYS.session);
    }
  },

  // ---- listings ----
  listings: {
    all: () => read(KEYS.listings, []),
    active: () => Store.listings.all().filter(l => l.active !== false),
    byId: id => Store.listings.all().find(l => l.id === id),
    create(data) {
      const listings = Store.listings.all();
      const listing = {
        id: uid("l"),
        active: true,
        rating: 0,
        reviews: 0,
        superhost: false,
        host: { name: data.hostName || "Host", years: 1, avatar: "https://i.pravatar.cc/120?u=" + encodeURIComponent(data.hostName || "host") },
        ...data
      };
      listings.unshift(listing);
      write(KEYS.listings, listings);
      return listing;
    },
    update(id, patch) {
      const listings = Store.listings.all().map(l => l.id === id ? { ...l, ...patch } : l);
      write(KEYS.listings, listings);
      return Store.listings.byId(id);
    },
    remove(id) {
      const listings = Store.listings.all().filter(l => l.id !== id);
      write(KEYS.listings, listings);
    }
  },

  // ---- bookings ----
  bookings: {
    all: () => read(KEYS.bookings, []),
    byUser: userId => Store.bookings.all().filter(b => b.userId === userId),
    byListing: listingId => Store.bookings.all().filter(b => b.listingId === listingId),
    create({ userId, listingId, checkIn, checkOut, guests, total, payment }) {
      const bookings = Store.bookings.all();
      const booking = {
        id: uid("b"),
        userId, listingId, checkIn, checkOut, guests, total,
        payment: payment || null,
        status: "confirmed",
        createdAt: Date.now()
      };
      bookings.unshift(booking);
      write(KEYS.bookings, bookings);
      return booking;
    },
    cancellationQuote(b) {
      const FREE_WINDOW_MS = 48 * 60 * 60 * 1000;
      const within = Date.now() - b.createdAt < FREE_WINDOW_MS;
      const feeRate = within ? 0 : 0.05;
      const fee = Math.round(b.total * feeRate);
      const refund = b.total - fee;
      return { feeRate, fee, refund, freeWindow: within };
    },
    cancel(id) {
      const bookings = Store.bookings.all().map(b => {
        if (b.id !== id || b.status === "cancelled") return b;
        const q = Store.bookings.cancellationQuote(b);
        return { ...b, status: "cancelled", cancellationFee: q.fee, refunded: q.refund, cancelledAt: Date.now() };
      });
      write(KEYS.bookings, bookings);
    },
    remove(id) {
      const bookings = Store.bookings.all().filter(b => b.id !== id);
      write(KEYS.bookings, bookings);
    }
  },

  // ---- support tickets (from chat widget) ----
  tickets: {
    all: () => read(KEYS.tickets, []),
    create({ name, email, message }) {
      const tickets = Store.tickets.all();
      const t = { id: uid("t"), name, email, message, status: "open", createdAt: Date.now() };
      tickets.unshift(t);
      write(KEYS.tickets, tickets);
      return t;
    },
    update(id, patch) {
      const tickets = Store.tickets.all().map(t => t.id === id ? { ...t, ...patch } : t);
      write(KEYS.tickets, tickets);
    },
    remove(id) {
      const tickets = Store.tickets.all().filter(t => t.id !== id);
      write(KEYS.tickets, tickets);
    }
  },

  // ---- danger zone (for admin reset) ----
  resetSeed() {
    [KEYS.users, KEYS.session, KEYS.listings, KEYS.bookings, KEYS.tickets, KEYS.seeded].forEach(k => localStorage.removeItem(k));
    seedIfNeeded();
  }
};

window.Store = Store;

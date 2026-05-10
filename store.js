// Sync facade over Supa.cache so existing render code keeps working.
// Reads are synchronous (cache hits); mutations call into Supa async helpers.

const Store = {
  init() { /* no-op; bootstrap is handled by Supa.init() */ },

  users: {
    all: () => Supa.cache.users,
    findByEmail(email) {
      return Supa.cache.users.find(u => (u.email || "").toLowerCase() === (email || "").toLowerCase());
    },
    create: () => { throw new Error("Use Supa.auth.signUp instead"); },
    remove: id => Supa.users.remove(id)
  },

  session: {
    current: () => Supa.session(),
    login: () => { throw new Error("Use Supa.auth.signIn instead"); },
    logout: () => Supa.auth.signOut()
  },

  listings: {
    all: () => Supa.cache.listings,
    active: () => Supa.cache.listings.filter(l => l.active !== false),
    byId: id => Supa.cache.listings.find(l => l.id === id),
    create: data => Supa.listings.create(data),
    update: (id, patch) => Supa.listings.update(id, patch),
    remove: id => Supa.listings.remove(id)
  },

  bookings: {
    all: () => Supa.cache.bookings,
    byUser: userId => Supa.cache.bookings.filter(b => b.userId === userId),
    byListing: listingId => Supa.cache.bookings.filter(b => b.listingId === listingId),
    create: data => Supa.bookings.create(data),
    cancel: id => Supa.bookings.cancel(id),
    remove: id => Supa.bookings.remove(id),
    cancellationQuote: b => Supa.bookings.cancellationQuote(b)
  },

  tickets: {
    all: () => Supa.cache.tickets,
    create: data => Supa.tickets.create(data),
    update: (id, patch) => Supa.tickets.update(id, patch),
    remove: id => Supa.tickets.remove(id)
  },

  cart: {
    all: () => Supa.cache.cart,
    add: item => Supa.cart.add(item),
    remove: id => Supa.cart.remove(id),
    checkout: ids => Supa.cart.checkout(ids),
    verify: opts => Supa.cart.verify(opts)
  },

  resetSeed: () => { /* no-op — seed lives server-side now */ }
};

window.Store = Store;

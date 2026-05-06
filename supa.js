// Supabase client + cache + auth helpers.
// The anon key is intentionally public — RLS policies enforce access.
//
// Pattern:
// • Supa.init() — creates the client and hydrates the auth state.
// • Supa.bootstrap() — fetches listings/bookings/tickets into an in-memory cache.
// • Sync getters (Supa.session(), Supa.role(), Supa.cache.*) read the cache.
// • Mutations are async — they hit Supabase, then refresh the relevant cache slice
//   and call Supa.onChange() so the SPA can re-render.

const SUPABASE_URL = "https://peyakimjlmkcjwixtzfi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleWFraW1qbG1rY2p3aXh0emZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODk1MTgsImV4cCI6MjA5MzU2NTUxOH0.Rj4Vm6HlEUkaoQrXnDKIZlvmeCK0BSMfT5aa_jvBnZo";

const Supa = (function () {
  let client = null;
  let session = null;
  let profile = null;
  const cache = {
    listings: [],
    bookings: [],
    tickets: [],
    users: []
  };
  let onChangeCb = () => {};

  async function init() {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    const { data } = await client.auth.getSession();
    session = data.session || null;
    if (session) await loadProfile();

    client.auth.onAuthStateChange(async (_event, s) => {
      session = s || null;
      profile = null;
      if (session) {
        await loadProfile();
        await bootstrap();
      } else {
        cache.bookings = [];
        cache.tickets = [];
        cache.users = [];
      }
      onChangeCb();
    });
  }

  async function loadProfile() {
    if (!session) { profile = null; return; }
    const { data, error } = await client
      .from("profiles").select("*").eq("id", session.user.id).single();
    if (error) console.warn("Profile load failed:", error.message);
    profile = data || null;
  }

  async function bootstrap() {
    if (!client) return;
    const tasks = [refreshListings()];
    if (session) {
      tasks.push(refreshBookings());
      if (isAdmin()) tasks.push(refreshTickets(), refreshUsers());
    }
    await Promise.all(tasks);
  }

  async function refreshListings() {
    const isA = isAdmin();
    const q = client.from("listings").select("*").order("created_at", { ascending: false });
    const { data, error } = isA ? await q : await q.eq("active", true);
    if (error) { console.warn("listings:", error.message); return; }
    cache.listings = (data || []).map(rowToListing);
  }

  async function refreshBookings() {
    const { data, error } = await client.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) { console.warn("bookings:", error.message); return; }
    cache.bookings = (data || []).map(rowToBooking);
  }

  async function refreshTickets() {
    if (!isAdmin()) { cache.tickets = []; return; }
    const { data, error } = await client.from("tickets").select("*").order("created_at", { ascending: false });
    if (error) { console.warn("tickets:", error.message); return; }
    cache.tickets = (data || []).map(rowToTicket);
  }

  async function refreshUsers() {
    if (!isAdmin()) { cache.users = []; return; }
    const { data, error } = await client.from("profiles").select("*").order("created_at", { ascending: true });
    if (error) { console.warn("profiles:", error.message); return; }
    cache.users = (data || []).map(p => ({
      id: p.id, name: p.name, email: p.email, role: p.role, createdAt: new Date(p.created_at).getTime()
    }));
  }

  // ---------- shape conversion ----------
  function rowToListing(r) {
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      location: r.location,
      country: r.country,
      pricePerNight: Number(r.price_per_night),
      rating: Number(r.rating || 0),
      reviews: r.reviews || 0,
      superhost: !!r.superhost,
      beds: r.beds, baths: r.baths, guests: r.guests,
      host: r.host || { name: "Host", years: 1, avatar: "" },
      amenities: r.amenities || [],
      images: r.images || [],
      description: r.description || "",
      active: r.active !== false,
      ownerId: r.owner_id
    };
  }
  function listingToRow(l) {
    return {
      id: l.id, title: l.title, type: l.type,
      location: l.location, country: l.country,
      price_per_night: l.pricePerNight,
      rating: l.rating || 0, reviews: l.reviews || 0,
      superhost: !!l.superhost,
      beds: l.beds, baths: l.baths, guests: l.guests,
      host: l.host, amenities: l.amenities, images: l.images,
      description: l.description, active: l.active !== false,
      owner_id: l.ownerId || (session?.user?.id || null)
    };
  }
  function rowToBooking(r) {
    return {
      id: r.id,
      userId: r.user_id,
      listingId: r.listing_id,
      checkIn: new Date(r.check_in).getTime(),
      checkOut: new Date(r.check_out).getTime(),
      guests: r.guests, adults: r.adults, children: r.children,
      total: Number(r.total),
      status: r.status,
      meals: r.meals || null,
      payment: r.payment,
      cancellationFee: r.cancellation_fee != null ? Number(r.cancellation_fee) : undefined,
      refunded: r.refunded != null ? Number(r.refunded) : undefined,
      cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).getTime() : null,
      createdAt: new Date(r.created_at).getTime()
    };
  }
  function rowToTicket(r) {
    return {
      id: r.id,
      name: r.name, email: r.email, message: r.message,
      status: r.status,
      resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : null,
      createdAt: new Date(r.created_at).getTime()
    };
  }

  // ---------- auth ----------
  async function signUp({ name, email, password, role }) {
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { name, role: role === "admin" ? "admin" : "user" } }
    });
    if (error) throw error;
    return data;
  }
  async function signIn({ email, password }) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    await client.auth.signOut();
  }

  // ---------- helpers ----------
  function isAdmin() { return profile?.role === "admin"; }
  function getSession() {
    if (!session || !profile) return null;
    return {
      userId: session.user.id,
      name: profile.name,
      email: profile.email,
      role: profile.role
    };
  }

  // ---------- listings CRUD ----------
  async function createListing(payload) {
    const id = "l_" + Math.random().toString(36).slice(2, 10);
    const row = listingToRow({ ...payload, id });
    const { data, error } = await client.from("listings").insert(row).select().single();
    if (error) throw error;
    cache.listings.unshift(rowToListing(data));
    onChangeCb();
    return rowToListing(data);
  }
  async function updateListing(id, patch) {
    const row = listingToRow({ ...patch, id });
    delete row.id; // don't change pk
    const { data, error } = await client.from("listings").update(row).eq("id", id).select().single();
    if (error) throw error;
    const i = cache.listings.findIndex(l => l.id === id);
    if (i >= 0) cache.listings[i] = rowToListing(data);
    onChangeCb();
  }
  async function removeListing(id) {
    const { error } = await client.from("listings").delete().eq("id", id);
    if (error) throw error;
    cache.listings = cache.listings.filter(l => l.id !== id);
    onChangeCb();
  }

  // ---------- bookings ----------
  async function createBooking(b) {
    const id = "b_" + Math.random().toString(36).slice(2, 10);
    const row = {
      id, user_id: session.user.id, listing_id: b.listingId,
      check_in: new Date(b.checkIn).toISOString(),
      check_out: new Date(b.checkOut).toISOString(),
      guests: b.guests, adults: b.adults || b.guests, children: b.children || 0,
      total: b.total, status: "confirmed",
      meals: b.meals || null,
      payment: b.payment || null
    };
    const { data, error } = await client.from("bookings").insert(row).select().single();
    if (error) throw error;
    const newB = rowToBooking(data);
    cache.bookings.unshift(newB);
    onChangeCb();
    return newB;
  }
  function cancellationQuote(b) {
    const FREE_WINDOW_MS = 48 * 60 * 60 * 1000;
    const within = Date.now() - b.createdAt < FREE_WINDOW_MS;
    const feeRate = within ? 0 : 0.05;
    const fee = Math.round(b.total * feeRate);
    const refund = b.total - fee;
    return { feeRate, fee, refund, freeWindow: within };
  }
  async function cancelBooking(id) {
    const b = cache.bookings.find(x => x.id === id);
    if (!b) return;
    const q = cancellationQuote(b);
    const patch = { status: "cancelled", cancellation_fee: q.fee, refunded: q.refund, cancelled_at: new Date().toISOString() };
    const { error } = await client.from("bookings").update(patch).eq("id", id);
    if (error) throw error;
    Object.assign(b, { status: "cancelled", cancellationFee: q.fee, refunded: q.refund, cancelledAt: Date.now() });
    onChangeCb();
  }
  async function deleteBooking(id) {
    const { error } = await client.from("bookings").delete().eq("id", id);
    if (error) throw error;
    cache.bookings = cache.bookings.filter(b => b.id !== id);
    onChangeCb();
  }

  // ---------- tickets ----------
  async function createTicket({ name, email, message }) {
    const userId = session?.user?.id || null;
    const { data, error } = await client.from("tickets").insert({ name, email, message, user_id: userId }).select().single();
    if (error) throw error;
    const t = rowToTicket(data);
    cache.tickets.unshift(t);
    onChangeCb();
    return t;
  }
  async function updateTicket(id, patch) {
    const dbPatch = {};
    if (patch.status) {
      dbPatch.status = patch.status;
      dbPatch.resolved_at = patch.status === "resolved" ? new Date().toISOString() : null;
    }
    const { error } = await client.from("tickets").update(dbPatch).eq("id", id);
    if (error) throw error;
    const t = cache.tickets.find(x => x.id === id);
    if (t) {
      t.status = patch.status || t.status;
      t.resolvedAt = patch.status === "resolved" ? Date.now() : null;
    }
    onChangeCb();
  }
  async function removeTicket(id) {
    const { error } = await client.from("tickets").delete().eq("id", id);
    if (error) throw error;
    cache.tickets = cache.tickets.filter(t => t.id !== id);
    onChangeCb();
  }

  // ---------- users ----------
  async function removeUser(id) {
    // Hard-delete only allowed for admin via service role; fall back to disabling profile row.
    const { error } = await client.from("profiles").delete().eq("id", id);
    if (error) throw error;
    cache.users = cache.users.filter(u => u.id !== id);
    onChangeCb();
  }

  return {
    init, bootstrap,
    cache,
    session: getSession,
    role: () => profile?.role || null,
    isAdmin,
    onChange: cb => { onChangeCb = cb; },
    auth: { signUp, signIn, signOut },
    listings: { create: createListing, update: updateListing, remove: removeListing, refresh: refreshListings },
    bookings: { create: createBooking, cancel: cancelBooking, remove: deleteBooking, cancellationQuote, refresh: refreshBookings },
    tickets: { create: createTicket, update: updateTicket, remove: removeTicket, refresh: refreshTickets },
    users: { remove: removeUser, refresh: refreshUsers }
  };
})();

window.Supa = Supa;

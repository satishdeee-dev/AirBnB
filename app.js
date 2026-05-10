// Stayly — single-page app with role-based routing.
// Routes:
//   #/login, #/signup
//   #/                    (browse — user view)
//   #/property/:id        (detail + booking)
//   #/trips               (user's bookings)
//   #/admin               (dashboard)
//   #/admin/listings      #/admin/listings/new   #/admin/listings/:id/edit
//   #/admin/bookings
//   #/admin/users

// Boot order: init Supabase client + auth state, then hydrate caches, then render.
(async function boot() {
  Store.init();
  await Supa.init();
  Supa.onChange(() => {
    // Skip re-render if an overlay is open — the user is mid-interaction.
    // The cache is still updated; rendering will pick it up on the next nav.
    if (document.querySelector(".datepicker-pop, .guests-pop, .meals-pop, .pay-backdrop, .modal-backdrop, .chat-support")) return;
    render();
  });
  await Supa.bootstrap();
  render();
})();

const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) n.setAttribute(k, "");
    else if (v === false || v == null) {}
    else n.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null || c === false) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
};
const fmtMoney = n => "AED " + Math.round(n).toLocaleString();
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));

function toast(msg) {
  let t = $(".toast");
  if (!t) {
    t = el("div", { class: "toast" });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

// Meals add-on popover. Toggle each meal type and pick which menu items
// to include. Pricing is per person per day per meal.
const MealsPicker = {
  open({ anchor, selection, onChange }) {
    // selection: { breakfast: { enabled: bool, items: [str] }, lunch: ..., dinner: ... }
    const state = JSON.parse(JSON.stringify(selection || {}));
    const pop = el("div", { class: "meals-pop" });

    function rerender() {
      pop.innerHTML = "";
      pop.appendChild(el("div", { class: "mp-head" }, [
        el("div", { class: "mp-title" }, "Add meals"),
        el("div", { class: "mp-sub" }, "Continental menu · breakfast complimentary · lunch & dinner billed per person per day")
      ]));
      MEALS.forEach(meal => {
        const cur = state[meal.id] || { enabled: !!meal.free, items: [] };
        const enabled = cur.enabled;
        const itemsBox = el("div", { class: "mp-items" });
        meal.menu.forEach(item => {
          const checked = cur.items.includes(item.name);
          const card = el("label", { class: "mp-card" + (enabled ? "" : " disabled") + (checked ? " selected" : "") }, [
            el("img", { class: "mp-card-img", src: item.image, alt: item.name, loading: "lazy" }),
            el("div", { class: "mp-card-overlay" }),
            el("span", { class: "mp-card-name" }, item.name),
            (function(){
              const cb = el("input", { type: "checkbox", class: "mp-card-cb" });
              cb.checked = checked;
              if (!enabled) cb.disabled = true;
              cb.addEventListener("change", () => {
                const next = state[meal.id] || { enabled: true, items: [] };
                if (!next.enabled) next.enabled = true;
                if (cb.checked) next.items.push(item.name);
                else next.items = next.items.filter(i => i !== item.name);
                state[meal.id] = next;
                onChange && onChange(state);
                rerender();
              });
              return cb;
            })()
          ]);
          itemsBox.appendChild(card);
        });
        const toggle = el("input", { type: "checkbox" });
        toggle.checked = enabled;
        if (meal.free) toggle.disabled = true; // breakfast is always-on
        toggle.addEventListener("change", () => {
          const next = state[meal.id] || { enabled: false, items: [] };
          next.enabled = toggle.checked;
          if (next.enabled && next.items.length === 0) next.items = meal.menu.slice(0, 4).map(i => i.name);
          state[meal.id] = next;
          onChange && onChange(state);
          rerender();
        });
        const priceCell = meal.free
          ? el("div", { class: "mp-price free" }, [el("strong", {}, "FREE"), el("span", {}, "with booking")])
          : el("div", { class: "mp-price" }, [el("strong", {}, fmtMoney(meal.pricePerPerson)), el("span", {}, "/ person / day")]);
        const section = el("section", { class: "mp-section" + (enabled ? " on" : "") + (meal.free ? " free" : "") }, [
          el("header", { class: "mp-row" }, [
            el("div", { class: "mp-meal" }, [
              el("span", { class: "mp-emoji" }, meal.emoji),
              el("div", {}, [el("strong", {}, meal.label), el("div", { class: "mp-serving" }, meal.serving)])
            ]),
            priceCell,
            toggle
          ]),
          itemsBox
        ]);
        pop.appendChild(section);
      });
      const paid = MEALS.filter(m => !m.free && state[m.id]?.enabled);
      const total = paid.reduce((s, m) => s + m.pricePerPerson, 0);
      pop.appendChild(el("div", { class: "mp-foot" }, [
        el("span", { class: "mp-totline" }, total ? `+${fmtMoney(total)} per person per day` : "Breakfast is included — add lunch or dinner if you'd like"),
        el("button", { type: "button", class: "mp-done", onClick: closeAll }, "Done")
      ]));
    }
    function closeAll() {
      document.removeEventListener("mousedown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", reposition);
      pop.remove();
    }
    function outside(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) closeAll(); }
    function onKey(e) { if (e.key === "Escape") closeAll(); }
    function reposition() {
      const r = anchor.getBoundingClientRect();
      if (window.innerWidth < 720) {
        pop.classList.add("mobile");
        pop.style.left = ""; pop.style.top = ""; pop.style.right = "";
        return;
      }
      pop.classList.remove("mobile");
      let top = r.bottom + window.scrollY + 6;
      let left = r.left + window.scrollX;
      const popW = pop.offsetWidth || 480;
      if (left + popW > window.scrollX + window.innerWidth - 8) left = window.scrollX + window.innerWidth - popW - 8;
      pop.style.left = Math.max(8, left) + "px";
      pop.style.top = top + "px";
      pop.style.width = "min(480px, calc(100vw - 16px))";
    }
    rerender();
    document.body.appendChild(pop);
    reposition();
    document.addEventListener("mousedown", outside, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", reposition);
    return { close: closeAll };
  }
};

// Adults / children stepper popover (anchored, click-outside to close).
const GuestsPicker = {
  open({ anchor, adults, children, maxTotal, onChange }) {
    const pop = el("div", { class: "guests-pop" });
    function row(label, sub, val, min, max, onDelta) {
      const dec = el("button", { type: "button", class: "gp-step", "aria-label": "Decrease " + label, disabled: val <= min }, "−");
      const inc = el("button", { type: "button", class: "gp-step", "aria-label": "Increase " + label, disabled: val >= max }, "+");
      const num = el("span", { class: "gp-num" }, String(val));
      dec.addEventListener("click", e => { e.stopPropagation(); onDelta(-1); });
      inc.addEventListener("click", e => { e.stopPropagation(); onDelta(+1); });
      return el("div", { class: "gp-row" }, [
        el("div", { class: "gp-label" }, [el("strong", {}, label), el("span", {}, sub)]),
        el("div", { class: "gp-stepper" }, [dec, num, inc])
      ]);
    }
    function rerender() {
      const total = adults + children;
      pop.innerHTML = "";
      pop.appendChild(row("Adults", "Ages 13+", adults, 1, maxTotal - children, d => { adults = Math.max(1, Math.min(maxTotal - children, adults + d)); onChange({ adults, children }); rerender(); }));
      pop.appendChild(row("Children", "Ages 2–12", children, 0, maxTotal - adults, d => { children = Math.max(0, Math.min(maxTotal - adults, children + d)); onChange({ adults, children }); rerender(); }));
      pop.appendChild(el("div", { class: "gp-foot" }, [
        el("span", { class: "gp-cap" }, `Up to ${maxTotal} guests · ${total} selected`),
        el("button", { type: "button", class: "gp-done", onClick: closeAll }, "Done")
      ]));
    }
    function closeAll() {
      document.removeEventListener("mousedown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", reposition);
      pop.remove();
    }
    function outside(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) closeAll(); }
    function onKey(e) { if (e.key === "Escape") closeAll(); }
    function reposition() {
      const r = anchor.getBoundingClientRect();
      pop.style.left = Math.max(8, r.left + window.scrollX) + "px";
      pop.style.top = (r.bottom + window.scrollY + 6) + "px";
      pop.style.width = Math.max(280, r.width) + "px";
    }
    rerender();
    document.body.appendChild(pop);
    reposition();
    document.addEventListener("mousedown", outside, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", reposition);
    return { close: closeAll };
  }
};

// ---------------- favorites + compare selection ----------------
const Favs = {
  KEY: "stayly.favs.v1",
  read() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  has(id) { return this.read().includes(id); },
  toggle(id) {
    const f = this.read();
    const next = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
    localStorage.setItem(this.KEY, JSON.stringify(next));
    return next;
  }
};

const CompareSel = {
  KEY: "stayly.compare.v1",
  MAX: 3,
  read() { try { return JSON.parse(sessionStorage.getItem(this.KEY)) || []; } catch { return []; } },
  has(id) { return this.read().includes(id); },
  toggle(id) {
    const f = this.read();
    let next;
    if (f.includes(id)) next = f.filter(x => x !== id);
    else if (f.length >= this.MAX) next = [...f.slice(1), id];
    else next = [...f, id];
    sessionStorage.setItem(this.KEY, JSON.stringify(next));
    return next;
  },
  clear() { sessionStorage.removeItem(this.KEY); }
};

// Approximate (x, y) coordinates within a 1000x600 SVG viewBox for the UAE map view.
const UAE_COORDS = {
  "Downtown Dubai": { x: 600, y: 280 },
  "Palm Jumeirah, Dubai": { x: 580, y: 268 },
  "Palm Jumeirah Crescent, Dubai": { x: 580, y: 263 },
  "Al Fahidi Historical District, Dubai": { x: 605, y: 290 },
  "Hatta, Dubai": { x: 700, y: 365 },
  "Al Marmoom Reserve": { x: 615, y: 320 },
  "The World, Dubai": { x: 595, y: 252 },
  "Dubai Creek Golf & Yacht Club": { x: 615, y: 295 },
  "Dubai Marina": { x: 570, y: 270 },
  "Jumeirah Beach, Dubai": { x: 590, y: 275 },
  "Jumeira Bay Island, Dubai": { x: 588, y: 273 },
  "Jumeirah Beach Residence, Dubai": { x: 565, y: 270 },
  "Corniche, Abu Dhabi": { x: 380, y: 380 },
  "Saadiyat Island, Abu Dhabi": { x: 400, y: 365 },
  "Yas Island, Abu Dhabi": { x: 420, y: 350 },
  "Liwa, Empty Quarter": { x: 320, y: 480 },
  "Jebel Jais, Ras Al Khaimah": { x: 770, y: 110 },
  "Al Hamra Village, Ras Al Khaimah": { x: 740, y: 145 },
  "Al Marjan Island, Ras Al Khaimah": { x: 745, y: 135 },
  "Wadi Khadeja, Ras Al Khaimah": { x: 760, y: 125 },
  "Dubai Desert Conservation Reserve": { x: 660, y: 320 },
  "Al Aqah, Fujairah": { x: 880, y: 230 },
  "Heart of Sharjah, Sharjah": { x: 640, y: 270 }
};
function coordsFor(loc) {
  if (UAE_COORDS[loc]) return UAE_COORDS[loc];
  // Fuzzy match: try to match the city/emirate keyword
  const k = (loc || "").toLowerCase();
  if (k.includes("dubai")) return { x: 600 + Math.random()*30, y: 280 + Math.random()*20 };
  if (k.includes("abu dhabi")) return { x: 400 + Math.random()*30, y: 370 + Math.random()*20 };
  if (k.includes("ras al khaimah") || k.includes("rak")) return { x: 750, y: 130 };
  if (k.includes("fujairah")) return { x: 880, y: 230 };
  if (k.includes("sharjah")) return { x: 640, y: 270 };
  if (k.includes("ajman")) return { x: 660, y: 250 };
  return { x: 500, y: 300 };
}

// ---------------- multi-step booking draft ----------------

// Multi-step booking draft. Persisted in sessionStorage so a refresh
// during the meals/payment steps doesn't wipe the user's selections.
const Draft = {
  KEY: "stayly.draft.v1",
  read() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY)) || null; } catch { return null; }
  },
  write(d) {
    if (d == null) sessionStorage.removeItem(this.KEY);
    else sessionStorage.setItem(this.KEY, JSON.stringify(d));
  },
  clear() { sessionStorage.removeItem(this.KEY); }
};

function priceBreakdown(d) {
  const l = Store.listings.byId(d.listingId);
  if (!l) return null;
  const nights = Math.max(1, Math.round((d.dateOut - d.dateIn) / 86400000));
  const nightly = nights * l.pricePerNight;
  const cleaning = 245;
  const service = Math.round(nightly * 0.12);
  const fest = window.festivalForRange(d.dateIn, d.dateOut);
  const discount = fest ? Math.round(nightly * FESTIVAL_DISCOUNT) : 0;
  const guestCount = (d.adults || 0) + (d.children || 0);
  const meals = d.meals || {};
  const paidMeals = MEALS.filter(m => meals[m.id]?.enabled && !m.free);
  const freeMeals = MEALS.filter(m => meals[m.id]?.enabled && m.free);
  const mealsCost = paidMeals.reduce((s, m) => s + m.pricePerPerson, 0) * guestCount * nights;
  const total = nightly + cleaning + service - discount + mealsCost;
  return { l, nights, nightly, cleaning, service, fest, discount, paidMeals, freeMeals, mealsCost, total, guestCount };
}

function bookingSummaryCard(d) {
  const b = priceBreakdown(d);
  if (!b) return el("div", {}, "Listing not found");
  const rows = [
    el("div", { class: "row", html: `<span>${fmtMoney(b.l.pricePerNight)} × ${b.nights} night${b.nights === 1 ? "" : "s"}</span><span>${fmtMoney(b.nightly)}</span>` }),
    b.fest ? el("div", { class: "row discount", html: `<span>${b.fest.emoji} ${b.fest.name} discount (5%)</span><span>−${fmtMoney(b.discount)}</span>` }) : null,
    ...b.freeMeals.map(m => el("div", { class: "row meal free-meal", html: `<span>${m.emoji} ${m.label}</span><span>Included</span>` })),
    ...b.paidMeals.map(m => el("div", { class: "row meal", html: `<span>${m.emoji} ${m.label} · ${b.guestCount}p × ${b.nights}d</span><span>${fmtMoney(m.pricePerPerson * b.guestCount * b.nights)}</span>` })),
    el("div", { class: "row", html: `<span>Cleaning fee</span><span>${fmtMoney(b.cleaning)}</span>` }),
    el("div", { class: "row", html: `<span>Service fee</span><span>${fmtMoney(b.service)}</span>` }),
    el("div", { class: "total", html: `<span>Total</span><span>${fmtMoney(b.total)}</span>` })
  ];
  return el("aside", { class: "summary-card" }, [
    el("div", { class: "summary-listing" }, [
      el("img", { src: b.l.images[0], alt: b.l.title }),
      el("div", {}, [
        el("div", { class: "summary-listing-title" }, b.l.title),
        el("div", { class: "summary-listing-loc" }, b.l.location)
      ])
    ]),
    el("div", { class: "summary-meta" }, [
      el("div", {}, [el("strong", {}, "Dates"), el("span", {}, fmtDate(d.dateIn) + " → " + fmtDate(d.dateOut))]),
      el("div", {}, [el("strong", {}, "Guests"), el("span", {}, b.guestCount + " guest" + (b.guestCount === 1 ? "" : "s"))])
    ]),
    el("div", { class: "summary-totals", html: "" }, rows.filter(Boolean))
  ]);
}

function confirmModal({ title, body, confirmText = "Confirm", danger = false }) {
  return new Promise(resolve => {
    const backdrop = el("div", { class: "modal-backdrop" });
    const modal = el("div", { class: "modal" }, [
      el("h3", {}, title),
      el("p", { class: "sub" }, body),
      el("div", { class: "modal-actions" }, [
        el("button", { class: "btn btn-ghost", onClick: () => { backdrop.remove(); resolve(false); } }, "Cancel"),
        el("button", { class: "btn " + (danger ? "btn-danger" : "btn-primary"), onClick: () => { backdrop.remove(); resolve(true); } }, confirmText)
      ])
    ]);
    backdrop.appendChild(modal);
    backdrop.addEventListener("click", e => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    document.body.appendChild(backdrop);
  });
}

// ---------------- router ----------------

const routes = [];
function route(pattern, handler) {
  const keys = [];
  const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, m => { keys.push(m.slice(1)); return "([^/]+)"; }) + "$");
  routes.push({ regex, keys, handler });
}

function navigate(path) {
  if (location.hash !== "#" + path) location.hash = "#" + path;
  else render();
}

function render() {
  // Strip query string from the hash (e.g. /payment-success?cartIds=…) for routing.
  const path = (location.hash.slice(1) || "/").split("?")[0];
  const session = Store.session.current();

  // gate: must be logged in to access anything except /login and /signup
  if (!session && !["/login", "/signup"].includes(path)) {
    return navigate("/login");
  }
  if (session && ["/login", "/signup"].includes(path)) {
    return navigate(session.role === "admin" ? "/admin" : "/");
  }
  // gate: only admins on /admin/*
  if (path.startsWith("/admin") && session?.role !== "admin") {
    return navigate("/");
  }

  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => params[k] = m[i + 1]);
      return r.handler(params);
    }
  }
  document.body.innerHTML = "<div class='empty'><h3>Page not found</h3><p>That URL leads nowhere. <a href='#/' style='color:var(--rose)'>Back home</a></p></div>";
}

window.addEventListener("hashchange", render);

// ---------------- shared chrome ----------------

const BRAND_SVG = `<svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 1C9 1 3 8 3 16c0 5 3 9 6 9 2 0 3-1 4-2l3-3 3 3c1 1 2 2 4 2 3 0 6-4 6-9C29 8 23 1 16 1zm0 4c5 0 9 5 9 11 0 3-2 5-3 5-1 0-2-1-2-1l-4-4-4 4s-1 1-2 1c-1 0-3-2-3-5 0-6 4-11 9-11z"/></svg>`;

function header({ active = "" } = {}) {
  const session = Store.session.current();
  const initials = (session?.name || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  const userMenu = el("div", { class: "user-menu", id: "userMenuBtn" }, [
    el("svg", { class: "menu-icon", viewBox: "0 0 16 16", fill: "currentColor", html: '<path d="M2 4h12v1H2zM2 8h12v1H2zM2 12h12v1H2z"/>' }),
    el("div", { class: "avatar" }, initials)
  ]);
  userMenu.addEventListener("click", e => {
    e.stopPropagation();
    let dd = document.getElementById("userDropdown");
    if (dd) { dd.remove(); return; }
    dd = el("div", { class: "dropdown", id: "userDropdown" });
    dd.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid var(--line)">
        <div style="font-weight:600">${escapeHtml(session.name)}<span class="role-pill">${session.role}</span></div>
        <div style="color:var(--ink-soft);font-size:13px">${escapeHtml(session.email)}</div>
      </div>
    `;
    if (session.role === "user") {
      const a1 = el("a", { href: "#/" }, "Browse");
      const a2 = el("a", { href: "#/trips" }, "My trips");
      dd.appendChild(a1); dd.appendChild(a2);
    } else {
      const a1 = el("a", { href: "#/admin" }, "Admin dashboard");
      const a2 = el("a", { href: "#/admin/listings" }, "Manage listings");
      const a3 = el("a", { href: "#/admin/bookings" }, "All bookings");
      const a4 = el("a", { href: "#/admin/users" }, "Users");
      [a1, a2, a3, a4].forEach(x => dd.appendChild(x));
    }
    dd.appendChild(el("div", { class: "divider" }));
    const logout = el("button", {
      onClick: () => { Store.session.logout(); navigate("/login"); }
    }, "Log out");
    dd.appendChild(logout);
    document.body.appendChild(dd);
    setTimeout(() => {
      document.addEventListener("click", function close(ev) {
        if (!dd.contains(ev.target)) { dd.remove(); document.removeEventListener("click", close); }
      });
    }, 0);
  });

  const runSearch = () => {
    const v = (document.getElementById("globalSearch")?.value || document.getElementById("globalSearchMobile")?.value || "").trim();
    window.__searchQuery = v;
    if (location.hash !== "#/") navigate("/");
    else render();
  };
  const headerEl = el("header", { class: "app-header" }, [
    el("div", { class: "header-inner" }, [
      el("a", { class: "brand", href: "#/", html: `${BRAND_SVG}<span>stayly</span>` }),
      el("div", { class: "search-pill" }, [
        el("input", { id: "globalSearch", placeholder: "Dubai, Abu Dhabi, RAK, Sharjah…", type: "text", onKeydown: e => { if (e.key === "Enter") runSearch(); } }),
        el("button", { class: "search-btn", onClick: runSearch,
          html: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-.7 4.3a6 6 0 1 1 1.4-1.4l4 4a1 1 0 1 1-1.4 1.4l-4-4z"/></svg>Search' })
      ]),
      el("div", { class: "header-right" }, [
        session.role === "user" ? (function(){
          const cartCount = Store.cart.all().length;
          return el("a", { class: "host-link cart-link", href: "#/cart", title: "Cart" }, [
            document.createTextNode("🛒 "),
            cartCount ? el("span", { class: "cart-count" }, String(cartCount)) : null
          ]);
        })() : null,
        session.role === "user" ? (function(){
          const favCount = Favs.read().length;
          const favLink = el("a", { class: "host-link fav-link", href: "#/favorites", title: "Favorites" }, [
            document.createTextNode("♥ "),
            favCount ? el("span", { class: "fav-count" }, String(favCount)) : null
          ]);
          return favLink;
        })() : null,
        session.role === "admin"
          ? el("a", { class: "host-link", href: "#/admin" }, "Admin")
          : el("a", { class: "host-link", href: "#/trips" }, "My trips"),
        userMenu
      ])
    ]),
    el("div", { class: "search-mobile" }, [
      el("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", html: '<path d="M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-.7 4.3a6 6 0 1 1 1.4-1.4l4 4a1 1 0 1 1-1.4 1.4l-4-4z"/>' }),
      el("input", { id: "globalSearchMobile", placeholder: "Search Dubai, Abu Dhabi…", type: "text", onKeydown: e => { if (e.key === "Enter") runSearch(); } })
    ])
  ]);
  return headerEl;
}

function footer() {
  return el("footer", { class: "app-footer" }, [
    el("div", { class: "footer-inner" }, [
      el("span", {}, "© Stayly demo · for educational use"),
      el("span", {}, "Built with vanilla JS · deployed on Vercel")
    ])
  ]);
}

function shell(children, opts = {}) {
  document.body.innerHTML = "";
  document.body.appendChild(header(opts));
  const main = el("div", { id: "view" });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null || c === false) return;
    main.appendChild(c);
  });
  document.body.appendChild(main);
  document.body.appendChild(footer());
}

// ---------------- auth views ----------------

route("/login", () => {
  document.body.innerHTML = "";
  const errBox = el("div", { class: "err", style: "display:none" });
  const emailIn = el("input", { type: "email", id: "email", placeholder: "you@example.com", required: true });
  const passIn = el("input", { type: "password", id: "password", placeholder: "Your password", required: true });

  const form = el("form", {
    onSubmit: async e => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true; submitBtn.textContent = "Signing in…";
      try {
        await Supa.auth.signIn({ email: emailIn.value.trim(), password: passIn.value });
        // onAuthStateChange will trigger Supa.bootstrap() + render()
        toast("Welcome back");
      } catch (err) {
        errBox.textContent = err.message || "Sign-in failed"; errBox.style.display = "block";
        submitBtn.disabled = false; submitBtn.textContent = "Log in";
      }
    }
  }, [
    errBox,
    el("div", { class: "field" }, [
      el("label", { for: "email" }, "Email"),
      emailIn
    ]),
    el("div", { class: "field" }, [
      el("label", { for: "password" }, "Password"),
      passIn
    ]),
    el("button", { class: "btn btn-primary btn-block btn-lg", type: "submit" }, "Log in"),
    el("div", { class: "switch", html: 'New to Stayly? <a onclick="location.hash=\'#/signup\'">Create an account</a>' }),
    el("div", { class: "demo-creds", html: '<strong>Powered by Supabase</strong><br>Sign up to create an account — choose Guest or Admin role on the signup page. Email confirmation may be required if enabled in your project.' })
  ]);

  const card = el("div", { class: "auth-card" }, [
    el("div", { class: "brand", style: "justify-content:center;margin-bottom:16px", html: BRAND_SVG + "<span>stayly</span>" }),
    el("h1", {}, "Welcome back"),
    el("p", { class: "sub" }, "Log in to book stays or manage your listings."),
    form
  ]);
  document.body.appendChild(el("div", { class: "auth-wrap" }, card));
});

route("/signup", () => {
  document.body.innerHTML = "";
  let role = "user";
  const errBox = el("div", { class: "err", style: "display:none" });
  const nameIn = el("input", { id: "name", placeholder: "Jane Doe", required: true });
  const emailIn = el("input", { type: "email", id: "email", placeholder: "you@example.com", required: true });
  const passIn = el("input", { type: "password", id: "password", placeholder: "At least 6 characters", required: true, minlength: 6 });

  const userBtn = el("button", { type: "button", class: "active" }, "👤 Guest");
  const adminBtn = el("button", { type: "button" }, "🛠 Admin");
  userBtn.addEventListener("click", () => { role = "user"; userBtn.classList.add("active"); adminBtn.classList.remove("active"); });
  adminBtn.addEventListener("click", () => { role = "admin"; adminBtn.classList.add("active"); userBtn.classList.remove("active"); });

  const form = el("form", {
    onSubmit: async e => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true; submitBtn.textContent = "Creating account…";
      try {
        await Supa.auth.signUp({
          name: nameIn.value.trim(),
          email: emailIn.value.trim(),
          password: passIn.value,
          role
        });
        toast("Account created — check your email if confirmation is enabled");
        try {
          await Supa.auth.signIn({ email: emailIn.value.trim(), password: passIn.value });
        } catch {
          // If email confirmation is required, signIn will fail until confirmed.
          navigate("/login");
        }
      } catch (err) {
        errBox.textContent = err.message || "Signup failed"; errBox.style.display = "block";
        submitBtn.disabled = false; submitBtn.textContent = "Create account";
      }
    }
  }, [
    errBox,
    el("div", { class: "role-toggle" }, [userBtn, adminBtn]),
    el("div", { class: "field" }, [el("label", {}, "Full name"), nameIn]),
    el("div", { class: "field" }, [el("label", {}, "Email"), emailIn]),
    el("div", { class: "field" }, [el("label", {}, "Password"), passIn]),
    el("button", { class: "btn btn-primary btn-block btn-lg", type: "submit" }, "Create account"),
    el("div", { class: "switch", html: 'Have an account? <a onclick="location.hash=\'#/login\'">Log in</a>' })
  ]);

  const card = el("div", { class: "auth-card" }, [
    el("div", { class: "brand", style: "justify-content:center;margin-bottom:16px", html: BRAND_SVG + "<span>stayly</span>" }),
    el("h1", {}, "Create your account"),
    el("p", { class: "sub" }, "Sign up as a guest to book stays, or as an admin to host them."),
    form
  ]);
  document.body.appendChild(el("div", { class: "auth-wrap" }, card));
});

// ---------------- user: home / browse ----------------

let homeView = "grid"; // "grid" | "map"

route("/", () => {
  let activeCat = window.__activeCategory || "all";
  let q = window.__searchQuery || "";

  const fest = window.nextFestival();
  const promoStrip = el("div", { class: "promo-strip", html:
    `<span class="ps-icon">🎉</span> <strong>FESTIVAL OFFER LIVE</strong> · enjoy <strong class="ps-pct">5% OFF</strong> any stay overlapping ${fest.emoji} <strong>${fest.name}</strong> · auto-applied at checkout <span class="ps-icon">🎉</span>`
  });
  const heroEl = el("section", { class: "hero" }, [
    el("div", { class: "hero-sky" }),
    el("div", { class: "hero-sun" }),
    el("div", { class: "hero-cloud cloud-1", html: "☁️" }),
    el("div", { class: "hero-cloud cloud-2", html: "☁️" }),
    el("div", { class: "hero-skyline", html: `
      <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYEnd slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="rgba(34, 34, 34, 0.92)">
          <rect x="40"  y="120" width="60"  height="80"/>
          <rect x="110" y="90"  width="40"  height="110"/>
          <rect x="160" y="110" width="55"  height="90"/>
          <rect x="225" y="60"  width="35"  height="140"/>
          <polygon points="600,200 600,10 615,40 630,10 630,200"/>
          <rect x="660" y="75"  width="50"  height="125"/>
          <rect x="720" y="100" width="45"  height="100"/>
          <rect x="775" y="55"  width="40"  height="145"/>
          <rect x="825" y="120" width="50"  height="80"/>
          <rect x="885" y="85"  width="35"  height="115"/>
          <rect x="935" y="115" width="60"  height="85"/>
          <rect x="1010" y="95" width="40"  height="105"/>
          <rect x="1060" y="130" width="55" height="70"/>
        </g>
        <g fill="rgba(34, 34, 34, 0.55)">
          <path d="M280 200 Q 320 130 360 200 Z"/>
          <path d="M360 200 Q 420 110 480 200 Z"/>
          <path d="M480 200 Q 530 140 580 200 Z"/>
        </g>
      </svg>
    ` }),
    el("div", { class: "hero-palm palm-l", html: "🌴" }),
    el("div", { class: "hero-palm palm-r", html: "🌴" }),
    el("div", { class: "hero-content" }, [
      el("h1", { class: "hero-title" }, "Stay in the Emirates."),
      el("p", { class: "hero-sub" }, "From Burj Khalifa sky suites to desert tents under the stars — find your next stay across the UAE."),
      el("div", { class: "hero-chip", html: `<span class="spark">✨</span> <strong>5% OFF</strong> festival stays · next: ${fest.emoji} ${fest.name}` })
    ])
  ]);

  const catBar = el("div", { class: "categories-bar" }, [
    el("div", { class: "categories-inner" }, CATEGORIES.map(c => {
      const btn = el("button", {
        class: "category" + (c.id === activeCat ? " active" : ""),
        onClick: () => { window.__activeCategory = c.id; render(); }
      }, [
        el("div", { class: "ico" }, c.icon),
        el("div", {}, c.label)
      ]);
      return btn;
    }))
  ]);

  const all = Store.listings.active();
  const filtered = all.filter(l => {
    const matchCat = activeCat === "all" || (CATEGORY_MAP[l.id] || []).includes(activeCat);
    const matchQ = !q || (l.title + " " + l.location + " " + l.country + " " + l.type).toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  // View toggle: grid vs map
  const viewToggle = el("div", { class: "view-toggle" }, [
    el("button", {
      class: "vt-btn" + (homeView === "grid" ? " active" : ""),
      onClick: () => { homeView = "grid"; render(); }
    }, [el("span", {}, "▦ "), document.createTextNode("Grid")]),
    el("button", {
      class: "vt-btn" + (homeView === "map" ? " active" : ""),
      onClick: () => { homeView = "map"; render(); }
    }, [el("span", {}, "📍 "), document.createTextNode("Map")])
  ]);

  let mainContent;
  if (homeView === "map") {
    mainContent = mapView(filtered);
  } else {
    const grid = el("div", { class: "listings-grid" });
    if (filtered.length === 0) {
      mainContent = el("div", { class: "empty" }, [
        el("h3", {}, "No stays match those filters"),
        el("p", {}, "Try clearing the search or picking a different category.")
      ]);
    } else {
      filtered.forEach(l => grid.appendChild(listingCard(l)));
      mainContent = grid;
    }
  }

  shell([
    promoStrip, heroEl, catBar,
    el("main", { class: "main" }, [
      el("div", { class: "view-bar" }, [
        el("div", { class: "result-count" }, filtered.length + " stay" + (filtered.length === 1 ? "" : "s")),
        viewToggle
      ]),
      mainContent
    ]),
    compareBar()
  ]);
  const sb = document.getElementById("globalSearch");
  if (sb && q) sb.value = q;
});

// Map view of listings — stylized UAE outline with hover-able pins.
function mapView(listings) {
  const wrap = el("div", { class: "map-view" });

  const popup = el("div", { class: "map-popup", style: "display:none" });
  function showPopup(l, x, y) {
    popup.innerHTML = `
      <img src="${l.images[0]}" alt="" />
      <div class="map-popup-body">
        <div class="map-popup-title">${escapeHtml(l.title)}</div>
        <div class="map-popup-loc">${escapeHtml(l.location)}</div>
        <div class="map-popup-meta"><strong>${fmtMoney(l.pricePerNight)}</strong> · ★ ${l.rating || "New"}</div>
      </div>
    `;
    popup.onclick = () => navigate("/property/" + l.id);
    const r = wrap.getBoundingClientRect();
    const popupW = 240;
    const px = Math.min(Math.max(8, x - popupW / 2), r.width - popupW - 8);
    popup.style.left = px + "px";
    popup.style.top = (y + 16) + "px";
    popup.style.display = "block";
  }
  function hidePopup() { popup.style.display = "none"; }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 1000 600");
  svg.setAttribute("class", "map-svg");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.innerHTML = `
    <defs>
      <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a1830"/>
        <stop offset="100%" stop-color="#0e0e10"/>
      </linearGradient>
      <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3a3a40"/>
        <stop offset="100%" stop-color="#2a2a2e"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1000" height="600" fill="url(#seaGrad)"/>
    <text x="80" y="40" fill="#9ca3af" font-size="14" font-family="sans-serif" font-weight="700" letter-spacing="0.1em">ARABIAN GULF</text>
    <text x="800" y="450" fill="#9ca3af" font-size="14" font-family="sans-serif" font-weight="700" letter-spacing="0.1em">GULF OF OMAN</text>
    <path d="M 240 380 Q 240 470 320 510 Q 420 530 530 510 Q 680 480 780 410 L 880 270 L 920 180 Q 920 100 870 100 L 770 100 Q 700 130 670 170 Q 600 220 510 245 Q 380 270 290 320 Q 240 350 240 380 Z"
          fill="url(#landGrad)" stroke="rgba(255, 56, 92, 0.4)" stroke-width="2"/>
    <text x="380" y="380" fill="#a0a0a8" font-size="11" font-family="sans-serif">ABU DHABI</text>
    <text x="600" y="245" fill="#a0a0a8" font-size="11" font-family="sans-serif">DUBAI</text>
    <text x="640" y="290" fill="#a0a0a8" font-size="11" font-family="sans-serif">SHARJAH</text>
    <text x="730" y="170" fill="#a0a0a8" font-size="11" font-family="sans-serif">RAS AL KHAIMAH</text>
    <text x="850" y="270" fill="#a0a0a8" font-size="11" font-family="sans-serif">FUJAIRAH</text>
  `;
  // Add pins
  listings.forEach(l => {
    const c = coordsFor(l.location);
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "map-pin");
    g.setAttribute("transform", `translate(${c.x}, ${c.y})`);
    g.innerHTML = `
      <circle r="14" fill="rgba(255, 56, 92, 0.15)" filter="url(#glow)"/>
      <circle r="7" fill="var(--rose, #ff385c)" stroke="#fff" stroke-width="2" style="cursor:pointer"/>
    `;
    g.style.cursor = "pointer";
    g.addEventListener("mouseenter", () => {
      // Convert SVG coordinates to wrapper-relative pixel coordinates for the popup.
      const r = svg.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const px = (c.x / 1000) * r.width + (r.left - wr.left);
      const py = (c.y / 600) * r.height + (r.top - wr.top);
      showPopup(l, px, py);
    });
    g.addEventListener("mouseleave", () => setTimeout(hidePopup, 80));
    g.addEventListener("click", () => navigate("/property/" + l.id));
    svg.appendChild(g);
  });

  wrap.appendChild(svg);
  wrap.appendChild(popup);
  popup.addEventListener("mouseenter", () => popup.style.display = "block");
  popup.addEventListener("mouseleave", hidePopup);

  return wrap;
}

function listingCard(l) {
  const fav = Favs.has(l.id);
  const cmp = CompareSel.has(l.id);
  const heartBtn = el("button", {
    class: "heart" + (fav ? " on" : ""),
    title: fav ? "Remove from favorites" : "Save to favorites",
    onClick: e => { e.stopPropagation(); Favs.toggle(l.id); render(); }
  }, fav ? "♥" : "♡");
  const cmpBtn = el("button", {
    class: "card-cmp" + (cmp ? " on" : ""),
    title: cmp ? "Remove from compare" : "Add to compare",
    onClick: e => { e.stopPropagation(); CompareSel.toggle(l.id); render(); }
  }, cmp ? "✓ Compare" : "Compare");
  const card = el("article", {
    class: "listing-card",
    onClick: () => navigate("/property/" + l.id)
  }, [
    el("div", { class: "imgwrap" }, [
      el("img", { src: l.images[0], alt: l.title, loading: "lazy" }),
      l.superhost ? el("div", { class: "superbadge" }, "Superhost") : null,
      heartBtn,
      cmpBtn
    ]),
    el("div", { class: "meta" }, [
      el("span", {}, l.location),
      el("span", { class: "rating", html: `★ ${l.rating || "New"}` })
    ]),
    el("div", { class: "sub" }, l.type + " · " + l.beds + " beds"),
    el("div", { class: "price", html: `<strong>${fmtMoney(l.pricePerNight)}</strong> night` })
  ]);
  return card;
}

function compareBar() {
  const ids = CompareSel.read();
  if (ids.length < 2) return null;
  return el("div", { class: "compare-bar" }, [
    el("div", { class: "compare-bar-info" }, [
      el("strong", {}, ids.length + " stays"),
      el("span", {}, " selected · pick up to " + CompareSel.MAX)
    ]),
    el("div", { class: "compare-bar-actions" }, [
      el("button", { class: "btn btn-ghost", onClick: () => { CompareSel.clear(); render(); } }, "Clear"),
      el("button", { class: "btn btn-primary", onClick: () => navigate("/compare/" + ids.join("-")) }, "Compare " + ids.length + " stays")
    ])
  ]);
}

// ---------------- user: favorites ----------------

route("/favorites", () => {
  const ids = Favs.read();
  const items = ids.map(id => Store.listings.byId(id)).filter(Boolean);

  const grid = el("div", { class: "listings-grid" });
  items.forEach(l => grid.appendChild(listingCard(l)));

  const body = el("main", { class: "main" }, [
    el("h1", { style: "margin:0 0 4px;font-size:28px" }, "Your favorites ❤️"),
    el("p", { class: "sub", style: "color:var(--ink-soft);margin:0 0 24px" },
      items.length === 0 ? "Tap the heart on any listing to save it here." :
      `${items.length} ${items.length === 1 ? "stay" : "stays"} saved across the Emirates.`),
    items.length === 0 ? el("div", { class: "empty" }, [
      el("h3", {}, "No favorites yet"),
      el("p", {}, "Browse listings and tap ♥ to save the ones you love."),
      el("a", { class: "btn btn-primary", href: "#/" }, "Browse stays")
    ]) : grid
  ]);
  shell([body, compareBar()]);
});

// ---------------- user: compare ----------------

route("/compare/:ids", ({ ids }) => {
  const idList = (ids || "").split("-").filter(Boolean);
  const items = idList.map(id => Store.listings.byId(id)).filter(Boolean);
  if (items.length < 2) { navigate("/"); return; }

  // Compare rows: each row gets a "winner" highlight where applicable.
  function bestOf(values, picker) {
    const idx = values.reduce((best, v, i) => picker(v, values[best]) ? i : best, 0);
    return idx;
  }
  const minPriceIdx = bestOf(items.map(l => l.pricePerNight), (a, b) => a < b);
  const maxRatingIdx = bestOf(items.map(l => l.rating), (a, b) => a > b);
  const maxBedsIdx = bestOf(items.map(l => l.beds), (a, b) => a > b);
  const maxGuestsIdx = bestOf(items.map(l => l.guests), (a, b) => a > b);

  function row(label, getter, winnerIdx) {
    return el("div", { class: "cmp-row" }, [
      el("div", { class: "cmp-label" }, label),
      ...items.map((l, i) => {
        const win = winnerIdx != null && i === winnerIdx && items.length > 1;
        return el("div", { class: "cmp-cell" + (win ? " winner" : "") }, [
          el("span", {}, String(getter(l))),
          win ? el("span", { class: "cmp-best" }, "BEST") : null
        ]);
      })
    ]);
  }
  function amenityRow(amenity) {
    return el("div", { class: "cmp-row" }, [
      el("div", { class: "cmp-label" }, amenity),
      ...items.map(l => el("div", { class: "cmp-cell" + (l.amenities?.includes(amenity) ? " yes" : " no") },
        l.amenities?.includes(amenity) ? "✓" : "—"))
    ]);
  }

  // Union of amenities, sorted by frequency
  const amenityCounts = {};
  items.forEach(l => (l.amenities || []).forEach(a => amenityCounts[a] = (amenityCounts[a] || 0) + 1));
  const allAmenities = Object.entries(amenityCounts)
    .sort((a, b) => b[1] - a[1] - (a[0] > b[0] ? 0 : 0))
    .map(([a]) => a);

  const headRow = el("div", { class: "cmp-row cmp-head" }, [
    el("div", { class: "cmp-label" }, ""),
    ...items.map(l => el("div", { class: "cmp-cell cmp-card-cell" }, [
      el("img", { src: l.images[0], alt: l.title }),
      el("a", { class: "cmp-title", href: "#/property/" + l.id }, l.title),
      el("div", { class: "cmp-loc" }, l.location),
      el("button", { class: "cmp-remove", onClick: () => {
        const next = idList.filter(x => x !== l.id);
        if (next.length < 2) { CompareSel.clear(); navigate("/"); }
        else navigate("/compare/" + next.join("-"));
      } }, "Remove")
    ]))
  ]);

  const body = el("main", { class: "main compare-page" }, [
    el("h1", { style: "margin:0 0 4px;font-size:28px" }, "Compare stays"),
    el("p", { class: "sub", style: "color:var(--ink-soft);margin:0 0 24px" }, "Side-by-side breakdown · best in each row highlighted"),
    el("div", { class: "cmp-grid", style: `grid-template-columns: 180px repeat(${items.length}, 1fr)` }, [
      headRow,
      row("Type", l => l.type),
      row("Price / night", l => fmtMoney(l.pricePerNight), minPriceIdx),
      row("Rating", l => `★ ${l.rating}  · ${l.reviews} reviews`, maxRatingIdx),
      row("Guests", l => l.guests, maxGuestsIdx),
      row("Beds", l => l.beds, maxBedsIdx),
      row("Baths", l => l.baths),
      row("Superhost", l => l.superhost ? "✓" : "—")
    ]),
    el("div", { class: "cmp-section-head" }, "Amenities"),
    el("div", { class: "cmp-grid", style: `grid-template-columns: 180px repeat(${items.length}, 1fr)` },
      allAmenities.map(a => amenityRow(a))
    )
  ]);
  shell(body);
});

// ---------------- user: property detail ----------------

route("/property/:id", ({ id }) => {
  const l = Store.listings.byId(id);
  if (!l) { navigate("/"); return; }

  // Booking state
  const today = new Date(); today.setDate(today.getDate() + 7);
  const out = new Date(today); out.setDate(out.getDate() + 5);
  let dateIn = today, dateOut = out;
  let adults = 2, children = 0;
  const maxGuests = l.guests;

  const checkInBtn = el("button", { type: "button", class: "df-cell" }, "");
  const checkOutBtn = el("button", { type: "button", class: "df-cell" }, "");
  const guestsBtn = el("button", { type: "button", class: "df-cell df-cell-full" }, "");
  const totalsBox = el("div", { class: "totals" });

  function fmtDayLabel(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  function refreshTriggers() {
    checkInBtn.innerHTML = `<label>Check-in</label><div class="val">${fmtDayLabel(dateIn)}</div>`;
    checkOutBtn.innerHTML = `<label>Check-out</label><div class="val">${fmtDayLabel(dateOut)}</div>`;
    const total = adults + children;
    const detail = (children ? `${adults} adult${adults === 1 ? "" : "s"} · ${children} child${children === 1 ? "" : "ren"}` : `${adults} adult${adults === 1 ? "" : "s"}`);
    guestsBtn.innerHTML = `<label>Guests</label><div class="val">${total} guest${total === 1 ? "" : "s"} <span class="muted">· ${detail}</span></div>`;
  }

  function recalcTotals() {
    const nights = Math.max(1, Math.round((dateOut - dateIn) / 86400000));
    const nightly = nights * l.pricePerNight;
    const cleaning = 245;
    const service = Math.round(nightly * 0.12);
    const fest = window.festivalForRange(dateIn.getTime(), dateOut.getTime());
    const discount = fest ? Math.round(nightly * FESTIVAL_DISCOUNT) : 0;
    const subtotal = nightly + cleaning + service - discount;
    totalsBox.innerHTML = `
      <div class="row"><span>${fmtMoney(l.pricePerNight)} × ${nights} night${nights === 1 ? "" : "s"}</span><span>${fmtMoney(nightly)}</span></div>
      ${fest ? `<div class="row discount"><span>${fest.emoji} ${fest.name} discount (5%)</span><span>−${fmtMoney(discount)}</span></div>` : ""}
      <div class="row"><span>Cleaning fee</span><span>${fmtMoney(cleaning)}</span></div>
      <div class="row"><span>Service fee</span><span>${fmtMoney(service)}</span></div>
      <div class="row meal free-meal"><span>🥐 Continental breakfast</span><span>Included</span></div>
      <div class="total"><span>Subtotal · meals next</span><span>${fmtMoney(subtotal)}</span></div>
    `;
    totalsBox._subtotal = subtotal;
    totalsBox._nights = nights;
  }

  // Calendar trigger
  let openPicker = null;
  function openCalendar(focus) {
    if (openPicker) { openPicker.close(); openPicker = null; return; }
    openPicker = DatePicker.open({
      anchor: checkInBtn,
      from: dateIn, to: dateOut,
      focus, // "in" or "out"
      minDate: new Date(),
      festivals: window.FESTIVALS,
      onChange: ({ from, to }) => {
        if (from) dateIn = from;
        if (to) {
          dateOut = to;
        } else if (from) {
          // First click only set check-in; ensure check-out is at least one day after.
          if (!dateOut || dateOut <= from) dateOut = new Date(from.getTime() + 86400000);
        }
        refreshTriggers();
        recalcTotals();
      },
      onClose: () => { openPicker = null; refreshTriggers(); recalcTotals(); }
    });
  }
  checkInBtn.addEventListener("click", () => openCalendar("in"));
  checkOutBtn.addEventListener("click", () => openCalendar("out"));

  // Guests popover
  let openGuests = null;
  function openGuestsPopover() {
    if (openGuests) { openGuests.close(); openGuests = null; return; }
    openGuests = GuestsPicker.open({
      anchor: guestsBtn,
      adults, children, maxTotal: maxGuests,
      onChange: ({ adults: a, children: c }) => { adults = a; children = c; refreshTriggers(); }
    });
  }
  refreshTriggers();
  setTimeout(recalcTotals, 0);

  const reserveBtn = el("button", { class: "btn btn-primary btn-block btn-lg" }, "Continue · choose meals");
  reserveBtn.addEventListener("click", () => {
    if (dateOut <= dateIn) { toast("Check-out must be after check-in"); return; }
    Draft.write({
      listingId: l.id,
      dateIn: dateIn.getTime(),
      dateOut: dateOut.getTime(),
      adults, children,
      // Pre-select breakfast (free, complimentary).
      meals: { breakfast: { enabled: true, items: MEALS[0].menu.slice(0, 4).map(i => i.name) } }
    });
    navigate("/booking/new/meals");
  });

  const gallery = el("div", { class: "gallery" });
  const imgs = [l.images[0], l.images[1] || l.images[0], l.images[2] || l.images[0], l.images[3] || l.images[0], l.images[4] || l.images[0]];
  imgs.forEach((src, i) => gallery.appendChild(el("img", { src, alt: l.title + " image " + (i + 1), class: i === 0 ? "main-img" : "" })));

  const page = el("div", { class: "property-page" }, [
    el("h1", { class: "property-title" }, l.title),
    el("div", { class: "property-meta", html:
      `<span>★ ${l.rating || "New"} · <u>${l.reviews} reviews</u></span>
       <span class="dot">·</span>
       <span><u>${escapeHtml(l.location)}, ${escapeHtml(l.country)}</u></span>` }),
    gallery,
    el("div", { class: "property-body" }, [
      el("div", { class: "property-info" }, [
        el("h2", {}, `${l.type} hosted by ${l.host.name}`),
        el("div", { class: "host-line" }, `${l.guests} guests · ${l.beds} beds · ${l.baths} baths`),
        el("div", { class: "divider" }),
        el("div", { class: "feature-row" }, [el("span", { class: "ico" }, "🏡"), el("div", {}, [el("strong", {}, "Entire place"), el("span", {}, "You'll have the whole space to yourself.")])]),
        el("div", { class: "feature-row" }, [el("span", { class: "ico" }, l.superhost ? "🏆" : "✓"), el("div", {}, [el("strong", {}, l.superhost ? `${l.host.name} is a Superhost` : "Verified host"), el("span", {}, l.superhost ? "Superhosts are experienced, highly rated hosts." : "Reviewed and ID-verified.")])]),
        el("div", { class: "feature-row" }, [el("span", { class: "ico" }, "📅"), el("div", {}, [el("strong", {}, "Free cancellation for 48 hours"), el("span", {}, "Get a full refund if you cancel within 48 hours of booking.")])]),
        el("div", { class: "divider" }),
        el("p", {}, l.description),
        el("div", { class: "divider" }),
        el("h3", { style: "margin:0 0 8px" }, "What this place offers"),
        el("div", { class: "amenities-grid" }, l.amenities.map(a => el("div", { class: "amenity", html: `<span>•</span>${escapeHtml(a)}` })))
      ]),
      el("div", { class: "booking-card" }, [
        el("div", { class: "price-line", html: `<span class="big">${fmtMoney(l.pricePerNight)}</span><span class="per">night</span>` }),
        el("div", { class: "df-grid" }, [
          checkInBtn, checkOutBtn, guestsBtn
        ]),
        reserveBtn,
        totalsBox
      ])
    ])
  ]);

  shell(page);
});

// ---------------- step 2: meals selection page ----------------

route("/booking/new/meals", () => {
  const draft = Draft.read();
  if (!draft) { navigate("/"); return; }
  const l = Store.listings.byId(draft.listingId);
  if (!l) { Draft.clear(); navigate("/"); return; }

  // Local meal state for this page; persists to draft on every change
  let meals = draft.meals || { breakfast: { enabled: true, items: MEALS[0].menu.slice(0, 4).map(i => i.name) } };
  let summary;

  function renderMeals() {
    const sections = MEALS.map(meal => {
      const cur = meals[meal.id] || { enabled: !!meal.free, items: [] };
      const enabled = cur.enabled;
      const cards = meal.menu.map(item => {
        const checked = cur.items.includes(item.name);
        const cb = el("input", { type: "checkbox", class: "mp-card-cb" });
        cb.checked = checked;
        if (!enabled) cb.disabled = true;
        cb.addEventListener("change", () => {
          const next = meals[meal.id] || { enabled: true, items: [] };
          if (!next.enabled) next.enabled = true;
          if (cb.checked) next.items.push(item.name);
          else next.items = next.items.filter(i => i !== item.name);
          meals[meal.id] = next;
          persist();
          renderMeals();
        });
        return el("label", { class: "mp-card" + (enabled ? "" : " disabled") + (checked ? " selected" : "") }, [
          el("img", { class: "mp-card-img", src: item.image, alt: item.name, loading: "lazy" }),
          el("div", { class: "mp-card-overlay" }),
          el("span", { class: "mp-card-name" }, item.name),
          cb
        ]);
      });
      const toggle = el("input", { type: "checkbox" });
      toggle.checked = enabled;
      if (meal.free) toggle.disabled = true;
      toggle.addEventListener("change", () => {
        const next = meals[meal.id] || { enabled: false, items: [] };
        next.enabled = toggle.checked;
        if (next.enabled && next.items.length === 0) next.items = meal.menu.slice(0, 4).map(i => i.name);
        meals[meal.id] = next;
        persist();
        renderMeals();
      });
      const priceCell = meal.free
        ? el("div", { class: "mp-price free" }, [el("strong", {}, "FREE"), el("span", {}, "with booking")])
        : el("div", { class: "mp-price" }, [el("strong", {}, fmtMoney(meal.pricePerPerson)), el("span", {}, "/ person / day")]);
      return el("section", { class: "mp-section step-section" + (enabled ? " on" : "") + (meal.free ? " free" : "") }, [
        el("header", { class: "mp-row" }, [
          el("div", { class: "mp-meal" }, [
            el("span", { class: "mp-emoji" }, meal.emoji),
            el("div", {}, [el("strong", {}, meal.label), el("div", { class: "mp-serving" }, meal.serving)])
          ]),
          priceCell,
          toggle
        ]),
        el("div", { class: "mp-items" }, cards)
      ]);
    });
    const left = document.querySelector(".step-meals .step-main");
    if (left) {
      left.innerHTML = "";
      const intro = el("div", { class: "step-intro" }, [
        el("h1", {}, "Pick your meals"),
        el("p", {}, "Continental breakfast is on us — it's complimentary with every stay. Lunch and dinner are optional add-ons; tap a card to include it on your menu.")
      ]);
      left.appendChild(intro);
      sections.forEach(s => left.appendChild(s));
    }
    if (summary) {
      const newSummary = bookingSummaryCard(Draft.read());
      summary.replaceWith(newSummary);
      summary = newSummary;
    }
  }

  function persist() {
    const cur = Draft.read() || {};
    Draft.write({ ...cur, meals });
  }

  const continueBtn = el("button", { class: "btn btn-primary btn-lg" }, "Add to cart");
  continueBtn.addEventListener("click", async () => {
    continueBtn.disabled = true;
    continueBtn.textContent = "Adding…";
    try {
      const breakdown = priceBreakdown(Draft.read());
      await Store.cart.add({
        listingId: draft.listingId,
        checkIn: draft.dateIn,
        checkOut: draft.dateOut,
        adults: draft.adults,
        children: draft.children,
        guests: (draft.adults || 0) + (draft.children || 0),
        meals,
        total: breakdown.total
      });
      Draft.clear();
      toast("Added to cart");
      navigate("/cart");
    } catch (err) {
      toast("Add failed: " + (err.message || err));
      continueBtn.disabled = false;
      continueBtn.textContent = "Add to cart";
    }
  });
  const backBtn = el("button", { class: "btn btn-ghost btn-lg" }, "← Back to listing");
  backBtn.addEventListener("click", () => navigate("/property/" + l.id));

  summary = bookingSummaryCard(draft);
  const page = el("div", { class: "step-page step-meals" }, [
    el("div", { class: "step-progress" }, [
      el("div", { class: "step-dot done" }, "✓"), el("div", { class: "step-line done" }),
      el("div", { class: "step-dot active" }, "2"), el("div", { class: "step-line" }),
      el("div", { class: "step-dot" }, "3"),
    ]),
    el("div", { class: "step-progress-labels" }, [
      el("span", { class: "done" }, "Dates & guests"),
      el("span", { class: "active" }, "Meals"),
      el("span", {}, "Payment")
    ]),
    el("div", { class: "step-shell" }, [
      el("main", { class: "step-main" }),
      summary
    ]),
    el("div", { class: "step-actions" }, [backBtn, continueBtn])
  ]);
  shell(page);
  renderMeals();
});

// ---------------- cart ----------------

route("/cart", () => {
  const items = Store.cart.all();
  const total = items.reduce((s, c) => s + c.total, 0);

  function rowFor(c) {
    const l = Store.listings.byId(c.listingId);
    const nights = Math.max(1, Math.round((c.checkOut - c.checkIn) / 86400000));
    const removeBtn = el("button", { class: "cart-remove" }, "Remove");
    removeBtn.addEventListener("click", async () => {
      try { await Store.cart.remove(c.id); toast("Removed from cart"); }
      catch (err) { toast("Remove failed: " + err.message); }
    });
    const mealLines = MEALS.filter(m => c.meals?.[m.id]?.enabled).map(m =>
      el("span", { class: "cart-meal-pill" + (m.free ? " free" : "") }, m.emoji + " " + m.label.replace("Continental ", "") + (m.free ? " · free" : ""))
    );
    return el("article", { class: "cart-row" }, [
      el("img", { class: "cart-thumb", src: l ? l.images[0] : "", alt: l ? l.title : "" }),
      el("div", { class: "cart-body" }, [
        el("div", { class: "cart-title" }, l ? l.title : "Listing removed"),
        el("div", { class: "cart-loc" }, l ? l.location : ""),
        el("div", { class: "cart-meta" }, `${fmtDate(c.checkIn)} → ${fmtDate(c.checkOut)} · ${nights} night${nights === 1 ? "" : "s"} · ${c.adults || c.guests} adults${c.children ? ` · ${c.children} children` : ""}`),
        mealLines.length ? el("div", { class: "cart-meals" }, mealLines) : null
      ]),
      el("div", { class: "cart-price" }, [
        el("strong", {}, fmtMoney(c.total)),
        removeBtn
      ])
    ]);
  }

  let checkoutErr;
  const checkoutBtn = el("button", { class: "btn btn-paynow btn-lg btn-block", "aria-label": "Confirm booking and pay with KNET" }, [
    el("span", { class: "paynow-icon" }, "🔒"),
    document.createTextNode(" Pay Now · " + fmtMoney(total))
  ]);
  checkoutBtn.addEventListener("click", async () => {
    if (items.length === 0) return;
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="cart-spinner"></span> Connecting to MyFatoorah…';
    if (checkoutErr) { checkoutErr.textContent = ""; checkoutErr.style.display = "none"; }
    try {
      const { url } = await Store.cart.checkout(items.map(c => c.id));
      sessionStorage.setItem("stayly.checkout.cartIds", items.map(c => c.id).join(","));
      window.location.assign(url);
    } catch (err) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = '<span class="paynow-icon">🔒</span> Pay Now · ' + fmtMoney(total);
      if (checkoutErr) {
        checkoutErr.textContent = err.message || String(err);
        checkoutErr.style.display = "block";
      }
    }
  });
  checkoutErr = el("div", { class: "pay-error", style: "display:none" });

  const body = el("main", { class: "main cart-page" }, [
    el("h1", { style: "margin:0 0 4px;font-size:28px" }, "Your cart 🛒"),
    el("p", { class: "sub", style: "color:var(--ink-soft);margin:0 0 24px" },
      items.length === 0 ? "Nothing in your cart yet. Browse listings to add a stay." :
      `${items.length} ${items.length === 1 ? "stay" : "stays"} ready to check out · grand total ${fmtMoney(total)}`),
    items.length === 0 ? el("div", { class: "empty" }, [
      el("h3", {}, "Cart is empty"),
      el("a", { class: "btn btn-primary", href: "#/" }, "Browse stays")
    ]) : el("div", { class: "cart-shell" }, [
      el("div", { class: "cart-list" }, items.map(rowFor)),
      el("aside", { class: "cart-summary" }, [
        el("div", { class: "summary-totals" }, [
          ...items.map(c => el("div", { class: "row", html: `<span>${escapeHtml(Store.listings.byId(c.listingId)?.title || c.listingId).slice(0, 32)}…</span><span>${fmtMoney(c.total)}</span>` })),
          el("div", { class: "total", html: `<span>Grand total</span><span>${fmtMoney(total)}</span>` })
        ]),
        checkoutErr,
        checkoutBtn,
        el("div", { class: "cart-secure" }, [
          el("span", {}, "🔒 Secured payments by "),
          el("strong", {}, "MyFatoorah"),
          el("div", { class: "cart-secure-sub" }, "Visa · Mastercard · KNET · Apple Pay · Mada")
        ])
      ])
    ])
  ]);
  shell([body, compareBar()]);
});

// ---------------- payment callbacks ----------------
// MyFatoorah redirects to /payment-success on success and /payment-failed on
// failure. Both routes parse paymentId/cartIds from the hash query, run the
// verify-payment edge function, and render the result.

function paymentResultPage(presumedSuccess) {
  return () => {
    const qs = location.hash.split("?")[1] || "";
    const params = new URLSearchParams(qs);
    const paymentId = params.get("paymentId");
    const cartIdsParam = params.get("cartIds") || sessionStorage.getItem("stayly.checkout.cartIds") || "";
    const cartIds = cartIdsParam.split(",").filter(Boolean);

    const stage = el("div", { class: "callback-stage" }, [
      el("div", { class: "callback-spinner" }),
      el("h2", {}, "Verifying your payment…"),
      el("p", { class: "sub" }, "Please don't close this window — confirming with MyFatoorah.")
    ]);
    shell(el("main", { class: "main callback-page" }, stage));

    (async () => {
      try {
        if (!paymentId && cartIds.length === 0) throw new Error("No payment reference returned");
        const result = await Store.cart.verify({ paymentId, cartIds });
        sessionStorage.removeItem("stayly.checkout.cartIds");
        stage.innerHTML = "";
        if (result.paid) {
          stage.classList.add("success");
          stage.appendChild(el("div", { class: "callback-tick", html: '<svg viewBox="0 0 64 64" width="80" height="80"><circle cx="32" cy="32" r="28" fill="none" stroke="#4ade80" stroke-width="3"/><path d="M20 33 L29 42 L46 24" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' }));
          stage.appendChild(el("h2", {}, "Payment successful 🎉"));
          stage.appendChild(el("p", { class: "sub" }, `${result.bookingIds?.length || 0} ${(result.bookingIds?.length || 0) === 1 ? "booking" : "bookings"} added to your trips. A receipt has been emailed.`));
          stage.appendChild(el("div", { class: "callback-actions" }, [
            el("a", { class: "btn btn-paynow", href: "#/trips" }, "View my trips"),
            el("a", { class: "btn btn-ghost", href: "#/" }, "Browse more stays")
          ]));
        } else {
          stage.classList.add("failed");
          stage.appendChild(el("div", { class: "callback-x" }, "✕"));
          stage.appendChild(el("h2", {}, "Payment failed"));
          stage.appendChild(el("p", { class: "sub" }, `Status: ${result.status || "Unknown"}. Your cart is saved — try again or pick a different payment method.`));
          stage.appendChild(el("div", { class: "callback-actions" }, [
            el("a", { class: "btn btn-paynow", href: "#/cart" }, "Try again"),
            el("a", { class: "btn btn-ghost", href: "#/" }, "Browse stays")
          ]));
        }
      } catch (err) {
        stage.innerHTML = "";
        stage.classList.add("failed");
        stage.appendChild(el("div", { class: "callback-x" }, "✕"));
        stage.appendChild(el("h2", {}, presumedSuccess ? "Couldn't confirm payment" : "Payment was not completed"));
        stage.appendChild(el("p", { class: "sub" }, err.message || String(err)));
        stage.appendChild(el("a", { class: "btn btn-paynow", href: "#/cart" }, "Back to cart"));
      }
    })();
  };
}

route("/payment-success", paymentResultPage(true));
route("/payment-failed", paymentResultPage(false));
// Legacy route (older cart flow) — keep it forwarding to /payment-success
route("/payment-callback", paymentResultPage(true));

// ---------------- step 3: payment page ----------------

route("/booking/new/payment", () => {
  const draft = Draft.read();
  if (!draft) { navigate("/"); return; }
  const l = Store.listings.byId(draft.listingId);
  if (!l) { Draft.clear(); navigate("/"); return; }
  const breakdown = priceBreakdown(draft);
  if (!breakdown) { navigate("/"); return; }

  // Build inline payment form (re-uses the same Mastercard styling as the modal)
  let stage = "card"; // "card" -> "processing" -> "3ds" -> "success"
  const stageHost = el("div", { class: "pay-page-stage" });

  function brand(num) {
    const n = num.replace(/\D/g, "");
    if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return "mastercard";
    if (/^4/.test(n)) return "visa";
    return "unknown";
  }
  function luhn(num) {
    const digits = num.replace(/\D/g, "").split("").reverse().map(Number);
    if (digits.length < 12) return false;
    return digits.reduce((a, d, i) => a + (i % 2 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d), 0) % 10 === 0;
  }
  function formatCard(s) { return s.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim(); }
  function formatExp(s) { const d = s.replace(/\D/g, "").slice(0, 4); return d.length < 3 ? d : d.slice(0, 2) + "/" + d.slice(2); }

  function renderCard() {
    stage = "card";
    stageHost.innerHTML = "";
    const errBox = el("div", { class: "pay-error", style: "display:none" });
    const numIn = el("input", { id: "pay_num", placeholder: "5123 4567 8901 2346", inputmode: "numeric", maxlength: "23" });
    const expIn = el("input", { id: "pay_exp", placeholder: "MM/YY", inputmode: "numeric", maxlength: "5" });
    const cvcIn = el("input", { id: "pay_cvc", type: "password", placeholder: "CVC", inputmode: "numeric", maxlength: "4" });
    const nameIn = el("input", { id: "pay_name", placeholder: "Name on card" });
    numIn.addEventListener("input", () => { numIn.value = formatCard(numIn.value); });
    expIn.addEventListener("input", () => { expIn.value = formatExp(expIn.value); });
    cvcIn.addEventListener("input", () => { cvcIn.value = cvcIn.value.replace(/\D/g, ""); });

    const submit = el("button", { class: "btn btn-primary btn-lg", type: "submit" }, [el("span", {}, "🔒 "), document.createTextNode("Pay " + fmtMoney(breakdown.total))]);
    const form = el("form", { class: "pay-page-form", onSubmit: e => {
      e.preventDefault();
      errBox.style.display = "none";
      const num = numIn.value.replace(/\s/g, "");
      if (!luhn(num)) { errBox.textContent = "Card number is invalid."; errBox.style.display = "block"; return; }
      if (brand(num) !== "mastercard") { errBox.textContent = "Only Mastercard is supported. Try 5123 4567 8901 2346."; errBox.style.display = "block"; return; }
      const m = expIn.value.match(/^(\d{2})\/(\d{2})$/);
      if (!m) { errBox.textContent = "Expiry must be MM/YY."; errBox.style.display = "block"; return; }
      const exp = new Date(2000 + +m[2], +m[1], 0, 23, 59, 59);
      if (exp < new Date()) { errBox.textContent = "Card has expired."; errBox.style.display = "block"; return; }
      if (cvcIn.value.length < 3) { errBox.textContent = "CVC must be 3 or 4 digits."; errBox.style.display = "block"; return; }
      if (!nameIn.value.trim()) { errBox.textContent = "Enter the name on the card."; errBox.style.display = "block"; return; }
      const last4 = num.slice(-4), holder = nameIn.value.trim();
      renderProcessing();
      setTimeout(() => render3DS(last4, holder), 1100);
    }}, [
      errBox,
      el("label", {}, "Card number"),
      numIn,
      el("div", { class: "pay-row" }, [
        el("div", {}, [el("label", {}, "Expiry"), expIn]),
        el("div", {}, [el("label", {}, "CVC"), cvcIn])
      ]),
      el("label", {}, "Cardholder name"),
      nameIn,
      submit,
      el("div", { class: "pay-test", html: 'Demo card: <code>5123 4567 8901 2346</code> · any future expiry · any 3-digit CVC · 3-D Secure code: <code>1234</code>' })
    ]);
    stageHost.appendChild(form);
    setTimeout(() => numIn.focus(), 50);
  }

  function renderProcessing() {
    stage = "processing";
    stageHost.innerHTML = "";
    stageHost.appendChild(el("div", { class: "pay-processing" }, [
      el("div", { class: "pay-spinner" }),
      el("div", { class: "pay-status" }, "Authorising with your bank…"),
      el("div", { class: "pay-substatus" }, "Securing payment over TLS")
    ]));
  }

  function render3DS(last4, holder) {
    stage = "3ds";
    stageHost.innerHTML = "";
    const otpIn = el("input", { id: "pay_otp", placeholder: "Enter 4-digit code", inputmode: "numeric", maxlength: "4" });
    const otpErr = el("div", { class: "pay-error", style: "display:none" });
    const verifyBtn = el("button", { class: "btn btn-primary btn-lg", type: "submit" }, "Verify");
    const otpForm = el("form", { class: "pay-3ds-form", onSubmit: e => {
      e.preventDefault();
      if (otpIn.value.trim() === "1234") finalize(last4, holder);
      else { otpErr.textContent = "Incorrect code. Try 1234 for the demo."; otpErr.style.display = "block"; }
    }}, [otpErr, otpIn, verifyBtn]);
    stageHost.appendChild(el("div", { class: "pay-3ds" }, [
      el("h3", {}, "Verify it's you"),
      el("p", {}, "We sent a 4-digit security code for the card ending in •••• " + last4 + "."),
      el("p", { class: "pay-3ds-amount" }, "Authorising " + fmtMoney(breakdown.total) + " · Stayly UAE"),
      otpForm
    ]));
    setTimeout(() => otpIn.focus(), 50);
  }

  async function finalize(last4, holder) {
    stage = "success";
    stageHost.innerHTML = "";
    stageHost.appendChild(el("div", { class: "pay-success" }, [
      el("div", { class: "pay-tick", html: '<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="28" fill="none" stroke="#4ade80" stroke-width="3"/><path d="M20 33 L29 42 L46 24" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
      el("h3", {}, "Payment approved"),
      el("p", { class: "pay-receipt" }, fmtMoney(breakdown.total) + " charged to •••• " + last4)
    ]));
    const txnId = "MC-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    try {
      const session = Store.session.current();
      const booking = await Store.bookings.create({
        userId: session.userId,
        listingId: draft.listingId,
        checkIn: draft.dateIn,
        checkOut: draft.dateOut,
        adults: draft.adults, children: draft.children,
        guests: (draft.adults || 0) + (draft.children || 0),
        total: breakdown.total,
        meals: draft.meals,
        payment: { brand: "mastercard", last4, holder, txnId }
      });
      Draft.clear();
      setTimeout(() => navigate("/booking/" + booking.id), 1000);
    } catch (err) {
      toast("Booking failed: " + (err.message || "unknown error"));
      setTimeout(() => navigate("/property/" + draft.listingId), 1500);
    }
  }

  const backBtn = el("button", { class: "btn btn-ghost btn-lg" }, "← Back to meals");
  backBtn.addEventListener("click", () => navigate("/booking/new/meals"));

  const page = el("div", { class: "step-page step-payment" }, [
    el("div", { class: "step-progress" }, [
      el("div", { class: "step-dot done" }, "✓"), el("div", { class: "step-line done" }),
      el("div", { class: "step-dot done" }, "✓"), el("div", { class: "step-line done" }),
      el("div", { class: "step-dot active" }, "3"),
    ]),
    el("div", { class: "step-progress-labels" }, [
      el("span", { class: "done" }, "Dates & guests"),
      el("span", { class: "done" }, "Meals"),
      el("span", { class: "active" }, "Payment")
    ]),
    el("div", { class: "step-shell" }, [
      el("main", { class: "step-main" }, [
        el("div", { class: "pay-page-head" }, [
          el("svg", { viewBox: "0 0 48 30", width: "48", height: "30", "aria-label": "Mastercard", html: '<circle cx="18" cy="15" r="12" fill="#eb001b"/><circle cx="30" cy="15" r="12" fill="#f79e1b"/><path d="M24 6.5a12 12 0 0 0 0 17 12 12 0 0 0 0-17z" fill="#ff5f00"/>' }),
          el("div", {}, [el("strong", {}, "Mastercard Payment Gateway"), el("div", { class: "pay-page-secure" }, "Secured with 3-D Secure ID Check")])
        ]),
        stageHost
      ]),
      bookingSummaryCard(draft)
    ]),
    el("div", { class: "step-actions" }, [backBtn])
  ]);
  shell(page);
  renderCard();
});

// ---------------- user: booking confirmation ----------------

route("/booking/:id", ({ id }) => {
  const session = Store.session.current();
  const b = Store.bookings.all().find(x => x.id === id);
  if (!b || b.userId !== session.userId) { navigate("/trips"); return; }
  const l = Store.listings.byId(b.listingId);
  const fest = window.festivalForRange(b.checkIn, b.checkOut);
  const nights = Math.max(1, Math.round((b.checkOut - b.checkIn) / 86400000));

  const page = el("div", { class: "confirm-page" }, [
    el("div", { class: "confirm-hero" }, [
      el("div", { class: "confirm-check", html: `
        <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
          <circle class="ring" cx="40" cy="40" r="36" fill="none" stroke="currentColor" stroke-width="3"/>
          <path class="tick" d="M24 42 L36 54 L58 30" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      ` }),
      el("h1", { class: "confirm-title" }, "Booking confirmed!"),
      el("p", { class: "confirm-sub" }, `Get ready for your stay in ${l ? l.location : "the UAE"}, ${(session.name || "").split(" ")[0]}.`),
      el("div", { class: "confirm-id" }, "Reservation · " + b.id.toUpperCase())
    ]),

    el("div", { class: "confirm-card" }, [
      l ? el("img", { class: "confirm-img", src: l.images[0], alt: l.title }) : null,
      el("div", { class: "confirm-info" }, [
        el("div", { class: "confirm-listing" }, l ? l.title : "Listing"),
        el("div", { class: "confirm-loc" }, l ? `${l.location}, ${l.country}` : ""),
        el("div", { class: "confirm-grid" }, [
          el("div", { class: "confirm-row" }, [el("span", { class: "k" }, "Check-in"), el("span", { class: "v" }, fmtDate(b.checkIn))]),
          el("div", { class: "confirm-row" }, [el("span", { class: "k" }, "Check-out"), el("span", { class: "v" }, fmtDate(b.checkOut))]),
          el("div", { class: "confirm-row" }, [el("span", { class: "k" }, "Nights"), el("span", { class: "v" }, String(nights))]),
          el("div", { class: "confirm-row" }, [el("span", { class: "k" }, "Guests"), el("span", { class: "v" }, b.children ? `${b.adults} adults · ${b.children} children` : `${b.adults || b.guests} adult${(b.adults || b.guests) === 1 ? "" : "s"}`)]),
          el("div", { class: "confirm-row" }, [el("span", { class: "k" }, "Status"), el("span", { class: "v" }, el("span", { class: "badge badge-on" }, b.status))])
        ]),
        fest ? el("div", { class: "confirm-fest", html: `${fest.emoji} <strong>${fest.name} discount</strong> — 5% off applied because your stay overlaps the festival window.` }) : null,
        b.meals && Object.values(b.meals).some(m => m?.enabled) ? el("div", { class: "confirm-meals" }, [
          el("strong", {}, "Included meals"),
          el("div", { class: "confirm-meals-list" }, MEALS.filter(m => b.meals[m.id]?.enabled).map(m => el("div", { class: "confirm-meal-row" }, [
            el("span", { class: "confirm-meal-head" }, `${m.emoji} ${m.label}`),
            el("span", { class: "confirm-meal-items" }, (b.meals[m.id].items || []).join(" · ") || "Chef's selection")
          ])))
        ]) : null,
        b.payment ? el("div", { class: "confirm-pay", html: `💳 Paid with <strong>Mastercard •••• ${b.payment.last4}</strong> · ref ${b.payment.txnId}` }) : null,
        el("div", { class: "confirm-total" }, [
          el("span", {}, "Total paid"),
          el("strong", {}, fmtMoney(b.total))
        ])
      ])
    ]),

    el("div", { class: "confirm-actions" }, [
      el("a", { class: "btn btn-primary btn-lg", href: "#/trips" }, "View all trips"),
      el("a", { class: "btn btn-ghost btn-lg", href: "#/" }, "Browse more stays")
    ]),

    el("div", { class: "confirm-tips" }, [
      el("div", { class: "tip", html: "📅 <strong>Cancellation</strong><br>Free cancellation in the first 48 hours. After that, a 5% fee applies and the rest is refunded." }),
      el("div", { class: "tip", html: "💬 <strong>Questions?</strong><br>Open the chat at the bottom-right or visit My trips to message the host." }),
      el("div", { class: "tip", html: "🎉 <strong>UAE festivals</strong><br>Stays during Eid, Diwali, National Day, or NYE get 5% off automatically." })
    ])
  ]);

  shell(page);
});

// ---------------- user: trips ----------------

route("/trips", () => {
  const session = Store.session.current();
  const mine = Store.bookings.byUser(session.userId);

  const rows = mine.map(b => {
    const l = Store.listings.byId(b.listingId);
    const cancelBtn = el("button", { class: "del" }, "Cancel");
    cancelBtn.addEventListener("click", async () => {
      if (b.status === "cancelled") return;
      const q = Store.bookings.cancellationQuote(b);
      const body = q.freeWindow
        ? `You're still within the 48-hour grace window — full refund of ${fmtMoney(b.total)}, no cancellation fee.`
        : `A 5% cancellation fee applies after the 48-hour grace window.\n\n• Original total: ${fmtMoney(b.total)}\n• Cancellation fee (5%): −${fmtMoney(q.fee)}\n• Refund to your card: ${fmtMoney(q.refund)}`;
      const ok = await confirmModal({ title: "Cancel this trip?", body, confirmText: q.freeWindow ? "Cancel trip" : `Cancel (fee ${fmtMoney(q.fee)})`, danger: true });
      if (!ok) return;
      try { await Store.bookings.cancel(b.id); } catch (err) { toast("Cancel failed: " + err.message); return; }
      toast(q.freeWindow ? "Trip cancelled — full refund issued" : `Trip cancelled — ${fmtMoney(q.refund)} refunded`);
    });
    const totalCell = b.status === "cancelled"
      ? el("td", { class: "stack" }, [
          el("div", { class: "muted strike" }, fmtMoney(b.total)),
          el("div", { class: "refund-line" }, `Refunded ${fmtMoney(b.refunded ?? b.total)}`),
          (b.cancellationFee || 0) > 0 ? el("div", { class: "fee-line" }, `Fee ${fmtMoney(b.cancellationFee)}`) : null
        ])
      : el("td", {}, fmtMoney(b.total));
    return el("tr", {}, [
      el("td", {}, l ? el("img", { class: "row-img", src: l.images[0] }) : "—"),
      el("td", {}, l ? l.title : "Listing removed"),
      el("td", {}, l ? `${l.location}` : "—"),
      el("td", {}, `${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}`),
      el("td", {}, b.children ? `${b.adults}a · ${b.children}c` : (b.adults || b.guests) + "a"),
      totalCell,
      el("td", {}, el("span", { class: "badge " + (b.status === "cancelled" ? "badge-cancel" : "badge-on") }, b.status)),
      el("td", { class: "actions" }, b.status === "cancelled" ? "" : cancelBtn)
    ]);
  });

  const body = el("main", { class: "main" }, [
    el("h1", { style: "margin:0 0 4px;font-size:28px" }, "My trips"),
    el("p", { class: "sub", style: "color:var(--ink-soft);margin:0 0 24px" }, mine.length ? `You have ${mine.length} booking${mine.length === 1 ? "" : "s"}.` : "You haven't booked any stays yet."),
    mine.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["", "Listing", "Location", "Dates", "Guests", "Total", "Status", ""].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ]) : el("div", { class: "empty" }, [
      el("h3", {}, "No trips yet"),
      el("p", {}, "Browse listings and book a stay — your reservations will appear here."),
      el("a", { class: "btn btn-primary", href: "#/" }, "Browse stays")
    ])
  ]);
  shell(body);
});

// ---------------- admin shell ----------------

function adminShell(active, content) {
  const openTickets = Store.tickets.all().filter(t => t.status !== "resolved").length;
  const links = [
    { href: "#/admin", label: "Dashboard", id: "dash", icon: "📊" },
    { href: "#/admin/listings", label: "Listings", id: "listings", icon: "🏘" },
    { href: "#/admin/bookings", label: "Bookings", id: "bookings", icon: "📅" },
    { href: "#/admin/payments", label: "Payments", id: "payments", icon: "💳" },
    { href: "#/admin/cancellations", label: "Cancellations", id: "cancellations", icon: "↩️" },
    { href: "#/admin/tickets", label: "Tickets", id: "tickets", icon: "💬", badge: openTickets || null },
    { href: "#/admin/users", label: "Users", id: "users", icon: "👥" }
  ];
  const side = el("aside", { class: "admin-side" }, [
    el("h4", {}, "Admin"),
    ...links.map(l => el("a", { href: l.href, class: l.id === active ? "active" : "" }, [
      el("span", {}, l.icon),
      el("span", {}, l.label),
      l.badge ? el("span", { class: "side-badge" }, String(l.badge)) : null
    ]))
  ]);
  const main = el("main", { class: "admin-main" }, content);
  return el("div", { class: "admin-shell" }, [side, main]);
}

// ---------------- admin: dashboard ----------------

route("/admin", () => {
  const listings = Store.listings.all();
  const bookings = Store.bookings.all();
  const users = Store.users.all();
  const tickets = Store.tickets.all();
  const openTickets = tickets.filter(t => t.status !== "resolved").length;
  const revenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);
  const refunded = bookings.filter(b => b.status === "cancelled").reduce((s, b) => s + (b.refunded || 0), 0);

  const recent = bookings.slice(0, 5).map(b => {
    const l = Store.listings.byId(b.listingId);
    const u = Store.users.all().find(u => u.id === b.userId);
    return el("tr", {}, [
      el("td", {}, l ? l.title : "—"),
      el("td", {}, u ? u.name : "—"),
      el("td", {}, fmtDate(b.checkIn) + " → " + fmtDate(b.checkOut)),
      el("td", {}, fmtMoney(b.total)),
      el("td", {}, el("span", { class: "badge " + (b.status === "cancelled" ? "badge-cancel" : "badge-on") }, b.status))
    ]);
  });

  const content = [
    el("h1", {}, "Dashboard"),
    el("p", { class: "sub" }, "What's happening across Stayly."),
    el("div", { class: "stat-grid" }, [
      stat("Total listings", listings.length, "+" + Math.max(0, listings.length - 12) + " from seed"),
      stat("Total bookings", bookings.length, bookings.length ? "Across all time" : "No bookings yet"),
      stat("Revenue", fmtMoney(revenue), refunded ? `${fmtMoney(refunded)} refunded` : "Confirmed bookings only"),
      stat("Users", users.length, users.filter(u => u.role === "user").length + " guests · " + users.filter(u => u.role === "admin").length + " admins"),
      stat("Open tickets", openTickets, tickets.length ? `${tickets.length - openTickets} resolved` : "Submitted via chat"),
      stat("Mastercard txns", bookings.filter(b => b.payment).length, "Captured by gateway")
    ]),
    el("h2", { style: "font-size:18px;margin:0 0 12px" }, "Recent bookings"),
    bookings.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Listing", "Guest", "Dates", "Total", "Status"].map(h => el("th", {}, h)))),
        el("tbody", {}, recent)
      ])
    ]) : el("div", { class: "empty", style: "padding:32px" }, [el("p", {}, "No bookings yet — when guests reserve, they'll show here.")]),
    el("div", { style: "margin-top:32px;display:flex;gap:8px" }, [
      el("a", { class: "btn btn-primary", href: "#/admin/listings/new" }, "+ New listing")
    ])
  ];
  shell(adminShell("dash", content));
});

function stat(label, val, delta) {
  return el("div", { class: "stat" }, [
    el("div", { class: "label" }, label),
    el("div", { class: "val" }, String(val)),
    el("div", { class: "delta" }, delta)
  ]);
}

// ---------------- admin: listings ----------------

route("/admin/listings", () => {
  const all = Store.listings.all();
  const searchIn = el("input", { placeholder: "Filter listings…" });
  let q = window.__adminListingQ || "";
  searchIn.value = q;
  searchIn.addEventListener("input", () => { window.__adminListingQ = searchIn.value; renderRows(); });

  const tbody = el("tbody", {});
  function renderRows() {
    tbody.innerHTML = "";
    const filt = all.filter(l => !window.__adminListingQ || (l.title + " " + l.location).toLowerCase().includes(window.__adminListingQ.toLowerCase()));
    if (filt.length === 0) {
      tbody.appendChild(el("tr", {}, el("td", { colspan: 7, style: "text-align:center;padding:32px;color:var(--ink-soft)" }, "No listings match.")));
      return;
    }
    filt.forEach(l => {
      const editBtn = el("button", { onClick: () => navigate("/admin/listings/" + l.id + "/edit") }, "Edit");
      const toggleBtn = el("button", { onClick: async () => {
        try { await Store.listings.update(l.id, { active: !l.active }); }
        catch (err) { toast("Update failed: " + err.message); return; }
        toast(l.active ? "Listing hidden" : "Listing published");
      } }, l.active === false ? "Publish" : "Hide");
      const delBtn = el("button", { class: "del", onClick: async () => {
        const ok = await confirmModal({ title: "Delete this listing?", body: l.title + " will be permanently removed.", confirmText: "Delete", danger: true });
        if (!ok) return;
        try { await Store.listings.remove(l.id); } catch (err) { toast("Delete failed: " + err.message); return; }
        toast("Listing deleted");
      } }, "Delete");
      tbody.appendChild(el("tr", {}, [
        el("td", {}, el("img", { class: "row-img", src: l.images[0] })),
        el("td", {}, l.title),
        el("td", {}, l.location),
        el("td", {}, fmtMoney(l.pricePerNight) + "/night"),
        el("td", {}, l.beds + " beds"),
        el("td", {}, el("span", { class: "badge " + (l.active === false ? "badge-off" : "badge-on") }, l.active === false ? "Hidden" : "Live")),
        el("td", { class: "actions" }, [editBtn, toggleBtn, delBtn])
      ]));
    });
  }
  renderRows();

  const content = [
    el("h1", {}, "Listings"),
    el("p", { class: "sub" }, all.length + " total · manage the catalog."),
    el("div", { class: "toolbar" }, [
      el("div", { class: "search" }, searchIn),
      el("a", { class: "btn btn-primary", href: "#/admin/listings/new" }, "+ New listing")
    ]),
    el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["", "Title", "Location", "Price", "Beds", "Status", ""].map(h => el("th", {}, h)))),
        tbody
      ])
    ])
  ];
  shell(adminShell("listings", content));
});

route("/admin/listings/new", () => listingForm(null));
route("/admin/listings/:id/edit", ({ id }) => {
  const l = Store.listings.byId(id);
  if (!l) { navigate("/admin/listings"); return; }
  listingForm(l);
});

function listingForm(existing) {
  const f = existing || {};
  const titleIn = el("input", { value: f.title || "", required: true });
  const typeIn = el("input", { value: f.type || "Entire home", required: true });
  const locIn = el("input", { value: f.location || "", required: true });
  const countryIn = el("input", { value: f.country || "", required: true });
  const priceIn = el("input", { type: "number", value: f.pricePerNight || 200, min: 1, required: true });
  const guestsIn = el("input", { type: "number", value: f.guests || 2, min: 1, required: true });
  const bedsIn = el("input", { type: "number", value: f.beds || 1, min: 1, required: true });
  const bathsIn = el("input", { type: "number", value: f.baths || 1, min: 1, required: true });
  const hostIn = el("input", { value: f.host?.name || Store.session.current().name, required: true });
  const imagesIn = el("textarea", { placeholder: "One image URL per line" }, (f.images || []).join("\n"));
  const amenIn = el("input", { value: (f.amenities || ["Wi-Fi", "Kitchen"]).join(", ") });
  const descIn = el("textarea", { required: true }, f.description || "");
  const superIn = el("select", {}, [el("option", { value: "no" }, "No"), el("option", { value: "yes" }, "Yes")]);
  superIn.value = f.superhost ? "yes" : "no";

  const form = el("form", {
    onSubmit: async e => {
      e.preventDefault();
      const images = imagesIn.value.split("\n").map(s => s.trim()).filter(Boolean);
      if (images.length === 0) { toast("Add at least one image URL"); return; }
      const payload = {
        title: titleIn.value.trim(),
        type: typeIn.value.trim(),
        location: locIn.value.trim(),
        country: countryIn.value.trim(),
        pricePerNight: parseInt(priceIn.value, 10),
        guests: parseInt(guestsIn.value, 10),
        beds: parseInt(bedsIn.value, 10),
        baths: parseInt(bathsIn.value, 10),
        amenities: amenIn.value.split(",").map(s => s.trim()).filter(Boolean),
        description: descIn.value.trim(),
        superhost: superIn.value === "yes",
        images,
        host: { name: hostIn.value.trim(), years: f.host?.years || 1, avatar: "https://i.pravatar.cc/120?u=" + encodeURIComponent(hostIn.value.trim()) }
      };
      try {
        if (existing) {
          await Store.listings.update(existing.id, payload);
          toast("Listing updated");
        } else {
          await Store.listings.create({ ...payload, ownerId: Store.session.current().userId });
          toast("Listing created");
        }
      } catch (err) {
        toast("Save failed: " + err.message);
        return;
      }
      navigate("/admin/listings");
    }
  }, [
    el("div", { class: "form-grid" }, [
      el("div", { class: "full" }, [el("label", {}, "Title"), titleIn]),
      el("div", {}, [el("label", {}, "Type"), typeIn]),
      el("div", {}, [el("label", {}, "Host name"), hostIn]),
      el("div", {}, [el("label", {}, "City / Region"), locIn]),
      el("div", {}, [el("label", {}, "Country"), countryIn]),
      el("div", {}, [el("label", {}, "Price per night ($)"), priceIn]),
      el("div", {}, [el("label", {}, "Max guests"), guestsIn]),
      el("div", {}, [el("label", {}, "Beds"), bedsIn]),
      el("div", {}, [el("label", {}, "Baths"), bathsIn]),
      el("div", {}, [el("label", {}, "Superhost"), superIn]),
      el("div", { class: "full" }, [el("label", {}, "Amenities (comma-separated)"), amenIn]),
      el("div", { class: "full" }, [el("label", {}, "Image URLs (one per line)"), imagesIn]),
      el("div", { class: "full" }, [el("label", {}, "Description"), descIn])
    ]),
    el("div", { class: "form-actions" }, [
      el("button", { class: "btn btn-primary", type: "submit" }, existing ? "Save changes" : "Create listing"),
      el("a", { class: "btn btn-ghost", href: "#/admin/listings" }, "Cancel")
    ])
  ]);

  const content = [
    el("h1", {}, existing ? "Edit listing" : "New listing"),
    el("p", { class: "sub" }, existing ? "Update the details and save." : "Add a property to the catalog."),
    el("div", { class: "form-card" }, form)
  ];
  shell(adminShell("listings", content));
}

// ---------------- admin: bookings ----------------

route("/admin/bookings", () => {
  const all = Store.bookings.all();
  const rows = all.map(b => {
    const l = Store.listings.byId(b.listingId);
    const u = Store.users.all().find(x => x.id === b.userId);
    const cancelBtn = el("button", { onClick: async () => {
      try { await Store.bookings.cancel(b.id); } catch (err) { toast("Cancel failed: " + err.message); return; }
      toast("Booking cancelled");
    } }, "Cancel");
    const delBtn = el("button", { class: "del", onClick: async () => {
      const ok = await confirmModal({ title: "Delete booking?", body: "This permanently removes the record.", confirmText: "Delete", danger: true });
      if (!ok) return;
      try { await Store.bookings.remove(b.id); } catch (err) { toast("Delete failed: " + err.message); return; }
      toast("Booking deleted");
    } }, "Delete");
    return el("tr", {}, [
      el("td", {}, l ? l.title : "—"),
      el("td", {}, u ? u.name + " · " + u.email : "—"),
      el("td", {}, fmtDate(b.checkIn) + " → " + fmtDate(b.checkOut)),
      el("td", {}, b.guests + ""),
      el("td", {}, fmtMoney(b.total)),
      el("td", {}, el("span", { class: "badge " + (b.status === "cancelled" ? "badge-cancel" : "badge-on") }, b.status)),
      el("td", { class: "actions" }, [b.status === "cancelled" ? null : cancelBtn, delBtn].filter(Boolean))
    ]);
  });
  const content = [
    el("h1", {}, "Bookings"),
    el("p", { class: "sub" }, all.length + " total reservation" + (all.length === 1 ? "" : "s") + "."),
    all.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Listing", "Guest", "Dates", "Guests", "Total", "Status", ""].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ]) : el("div", { class: "empty" }, [el("h3", {}, "No bookings yet"), el("p", {}, "Reservations will appear here as guests book.")])
  ];
  shell(adminShell("bookings", content));
});

// ---------------- admin: payments ----------------

route("/admin/payments", () => {
  const all = Store.bookings.all();
  const paid = all.filter(b => b.payment);
  const grossRevenue = paid.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);
  const refundedTotal = paid.filter(b => b.status === "cancelled").reduce((s, b) => s + (b.refunded || 0), 0);
  const feesCollected = paid.filter(b => b.status === "cancelled").reduce((s, b) => s + (b.cancellationFee || 0), 0);
  const netRevenue = grossRevenue + feesCollected;

  const rows = paid.map(b => {
    const u = Store.users.all().find(x => x.id === b.userId);
    const l = Store.listings.byId(b.listingId);
    const isCancelled = b.status === "cancelled";
    return el("tr", {}, [
      el("td", { class: "mono" }, b.payment.txnId),
      el("td", {}, fmtDate(b.createdAt)),
      el("td", {}, u ? u.name : "—"),
      el("td", {}, l ? l.title : "—"),
      el("td", { html: `<span class="mc-pill">💳 mc</span> •••• ${escapeHtml(b.payment.last4)}` }),
      el("td", {}, fmtMoney(b.total)),
      el("td", {}, isCancelled ? `−${fmtMoney(b.refunded || 0)}` : "—"),
      el("td", {}, el("span", { class: "badge " + (isCancelled ? "badge-cancel" : "badge-on") }, isCancelled ? "refunded" : "captured"))
    ]);
  });

  const content = [
    el("h1", {}, "Payments"),
    el("p", { class: "sub" }, paid.length + " transaction" + (paid.length === 1 ? "" : "s") + " · all charges processed via Mastercard ID Check."),
    el("div", { class: "stat-grid" }, [
      stat("Gross revenue", fmtMoney(grossRevenue), "Confirmed bookings"),
      stat("Refunds issued", fmtMoney(refundedTotal), `${paid.filter(b => b.status === "cancelled").length} cancellations`),
      stat("Fees collected", fmtMoney(feesCollected), "5% cancellation fee"),
      stat("Net revenue", fmtMoney(netRevenue), "Gross + fees")
    ]),
    paid.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Txn ref", "Date", "Guest", "Listing", "Card", "Amount", "Refunded", "Status"].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ]) : el("div", { class: "empty" }, [
      el("h3", {}, "No payments yet"),
      el("p", {}, "When guests reserve and complete Mastercard checkout, their transactions appear here.")
    ])
  ];
  shell(adminShell("payments", content));
});

// ---------------- admin: cancellations ----------------

route("/admin/cancellations", () => {
  const cancelled = Store.bookings.all().filter(b => b.status === "cancelled");
  const allBookings = Store.bookings.all();

  const totalRefunded = cancelled.reduce((s, b) => s + (b.refunded || 0), 0);
  const totalFees     = cancelled.reduce((s, b) => s + (b.cancellationFee || 0), 0);
  const grossCharged  = cancelled.reduce((s, b) => s + (b.total || 0), 0);
  const cancelRate    = allBookings.length ? (cancelled.length / allBookings.length * 100).toFixed(1) : "0";
  const free   = cancelled.filter(b => (b.cancellationFee || 0) === 0).length;
  const feed   = cancelled.length - free;

  const rows = cancelled.map(b => {
    const u = Store.users.all().find(x => x.id === b.userId);
    const l = Store.listings.byId(b.listingId);
    const reasonChip = (b.cancellationFee || 0) === 0
      ? el("span", { class: "badge badge-on" }, "free window")
      : el("span", { class: "badge badge-cancel" }, "5% fee");
    return el("tr", {}, [
      el("td", { class: "mono" }, b.id),
      el("td", {}, fmtDate(b.cancelledAt || b.createdAt)),
      el("td", {}, u ? u.name : "—"),
      el("td", {}, l ? l.title : "—"),
      el("td", {}, fmtMoney(b.total)),
      el("td", { class: "fee-cell" }, (b.cancellationFee || 0) > 0 ? `−${fmtMoney(b.cancellationFee)}` : "—"),
      el("td", { class: "refund-cell" }, fmtMoney(b.refunded ?? b.total)),
      el("td", {}, reasonChip)
    ]);
  });

  const content = [
    el("h1", {}, "Cancellations"),
    el("p", { class: "sub" }, cancelled.length + " cancelled · " + cancelRate + "% cancellation rate"),
    el("div", { class: "stat-grid" }, [
      stat("Total cancelled", cancelled.length, `${free} free · ${feed} with fee`),
      stat("Original charged", fmtMoney(grossCharged), "Before refunds"),
      stat("Refunded to guests", fmtMoney(totalRefunded), "Returned to cards"),
      stat("Fees retained", fmtMoney(totalFees), "5% of post-grace cancels")
    ]),
    cancelled.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Booking", "Cancelled", "Guest", "Listing", "Charged", "Fee", "Refunded", "Window"].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ]) : el("div", { class: "empty" }, [
      el("h3", {}, "No cancellations yet"),
      el("p", {}, "When a guest cancels a booking from My trips, the refund summary appears here.")
    ])
  ];
  shell(adminShell("cancellations", content));
});

// ---------------- admin: tickets ----------------

route("/admin/tickets", () => {
  const all = Store.tickets.all();
  const open = all.filter(t => t.status !== "resolved");

  const rows = all.map(t => {
    const isOpen = t.status !== "resolved";
    const resolveBtn = el("button", { onClick: async () => {
      try { await Store.tickets.update(t.id, { status: "resolved" }); } catch (err) { toast("Update failed: " + err.message); return; }
      toast("Marked resolved");
    } }, "Resolve");
    const reopenBtn = el("button", { onClick: async () => {
      try { await Store.tickets.update(t.id, { status: "open" }); } catch (err) { toast("Update failed: " + err.message); return; }
      toast("Reopened");
    } }, "Reopen");
    const delBtn = el("button", { class: "del", onClick: async () => {
      const ok = await confirmModal({ title: "Delete this ticket?", body: "The original message will be permanently removed.", confirmText: "Delete", danger: true });
      if (!ok) return;
      try { await Store.tickets.remove(t.id); } catch (err) { toast("Delete failed: " + err.message); return; }
      toast("Ticket deleted");
    } }, "Delete");
    return el("tr", {}, [
      el("td", {}, fmtDate(t.createdAt)),
      el("td", {}, t.name),
      el("td", { html: `<a href="mailto:${escapeHtml(t.email)}" style="color:var(--rose)">${escapeHtml(t.email)}</a>` }),
      el("td", { class: "ticket-msg" }, t.message),
      el("td", {}, el("span", { class: "badge " + (isOpen ? "badge-on" : "badge-off") }, t.status)),
      el("td", { class: "actions" }, [isOpen ? resolveBtn : reopenBtn, delBtn])
    ]);
  });

  const content = [
    el("h1", {}, "Support tickets"),
    el("p", { class: "sub" }, open.length + " open · " + (all.length - open.length) + " resolved · submitted via the chat widget."),
    el("div", { class: "tickets-hint" }, [
      el("span", {}, "Try it: open the chat at the bottom-right, type \"talk to support\", and send a test ticket — it'll appear here.")
    ]),
    all.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Date", "Name", "Email", "Message", "Status", ""].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ]) : el("div", { class: "empty" }, [
      el("h3", {}, "No tickets yet"),
      el("p", {}, "When guests submit the contact form in the chat widget, their requests appear here.")
    ])
  ];
  shell(adminShell("tickets", content));
});

// ---------------- admin: users ----------------

route("/admin/users", () => {
  const session = Store.session.current();
  const users = Store.users.all();
  const rows = users.map(u => {
    const isMe = u.id === session.userId;
    const bookingsCount = Store.bookings.byUser(u.id).length;
    const delBtn = el("button", { class: "del", onClick: async () => {
      const ok = await confirmModal({ title: "Remove user?", body: "Bookings tied to this user will become orphaned.", confirmText: "Remove", danger: true });
      if (!ok) return;
      try { await Store.users.remove(u.id); } catch (err) { toast("Remove failed: " + err.message); return; }
      toast("User removed");
    } }, "Delete");
    return el("tr", {}, [
      el("td", {}, u.name + (isMe ? " (you)" : "")),
      el("td", {}, u.email),
      el("td", {}, el("span", { class: "badge " + (u.role === "admin" ? "badge-admin" : "badge-user") }, u.role)),
      el("td", {}, bookingsCount + ""),
      el("td", {}, fmtDate(u.createdAt)),
      el("td", { class: "actions" }, isMe ? "" : delBtn)
    ]);
  });
  const content = [
    el("h1", {}, "Users"),
    el("p", { class: "sub" }, users.length + " account" + (users.length === 1 ? "" : "s") + "."),
    el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Name", "Email", "Role", "Bookings", "Joined", ""].map(h => el("th", {}, h)))),
        el("tbody", {}, rows)
      ])
    ])
  ];
  shell(adminShell("users", content));
});

// ---------------- start ----------------
// First render is kicked off by the boot() IIFE at the top of this file
// once Supa is initialised and the cache is hydrated.

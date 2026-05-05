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

Store.init();

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
  const path = location.hash.slice(1) || "/";
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
  (Array.isArray(children) ? children : [children]).forEach(c => main.appendChild(c));
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
    onSubmit: e => {
      e.preventDefault();
      try {
        const sess = Store.session.login(emailIn.value.trim(), passIn.value);
        toast(`Welcome back, ${sess.name}`);
        navigate(sess.role === "admin" ? "/admin" : "/");
      } catch (err) {
        errBox.textContent = err.message; errBox.style.display = "block";
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
    el("div", { class: "demo-creds", html: '<strong>Try the demo</strong><br>Admin — admin@stayly.com / admin123<br>Guest — guest@stayly.com / guest123' })
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
    onSubmit: e => {
      e.preventDefault();
      try {
        Store.users.create({ name: nameIn.value.trim(), email: emailIn.value.trim(), password: passIn.value, role });
        const sess = Store.session.login(emailIn.value.trim(), passIn.value);
        toast(`Account created — welcome, ${sess.name}`);
        navigate(sess.role === "admin" ? "/admin" : "/");
      } catch (err) {
        errBox.textContent = err.message; errBox.style.display = "block";
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

route("/", () => {
  let activeCat = window.__activeCategory || "all";
  let q = window.__searchQuery || "";

  const fest = window.nextFestival();
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
      el("div", { class: "hero-chip", html: `🎉 5% off festival stays · next: ${fest.emoji} ${fest.name}` })
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

  const grid = el("div", { class: "listings-grid" });
  if (filtered.length === 0) {
    grid.replaceWith(el("div", { class: "empty" }, [
      el("h3", {}, "No stays match those filters"),
      el("p", {}, "Try clearing the search or picking a different category.")
    ]));
  }
  filtered.forEach(l => grid.appendChild(listingCard(l)));

  shell([heroEl, catBar, el("main", { class: "main" }, [grid])]);
  const sb = document.getElementById("globalSearch");
  if (sb && q) sb.value = q;
});

function listingCard(l) {
  const card = el("article", {
    class: "listing-card",
    onClick: () => navigate("/property/" + l.id)
  }, [
    el("div", { class: "imgwrap" }, [
      el("img", { src: l.images[0], alt: l.title, loading: "lazy" }),
      l.superhost ? el("div", { class: "superbadge" }, "Superhost") : null,
      el("div", { class: "heart" }, "♡")
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

// ---------------- user: property detail ----------------

route("/property/:id", ({ id }) => {
  const l = Store.listings.byId(id);
  if (!l) { navigate("/"); return; }

  const today = new Date(); today.setDate(today.getDate() + 7);
  const out = new Date(today); out.setDate(out.getDate() + 5);
  const inStr = today.toISOString().slice(0, 10);
  const outStr = out.toISOString().slice(0, 10);

  const checkInIn = el("input", { type: "date", value: inStr, min: new Date().toISOString().slice(0, 10) });
  const checkOutIn = el("input", { type: "date", value: outStr, min: inStr });
  const guestsIn = el("select", {}, Array.from({ length: l.guests }, (_, i) => el("option", { value: i + 1 }, (i + 1) + (i === 0 ? " guest" : " guests"))));

  const totalsBox = el("div", { class: "totals" });
  function recalcTotals() {
    const a = new Date(checkInIn.value), b = new Date(checkOutIn.value);
    const nights = Math.max(1, Math.round((b - a) / 86400000));
    const nightly = nights * l.pricePerNight;
    const cleaning = 245;
    const service = Math.round(nightly * 0.12);
    const fest = window.festivalForRange(a.getTime(), b.getTime());
    const discount = fest ? Math.round(nightly * FESTIVAL_DISCOUNT) : 0;
    const total = nightly + cleaning + service - discount;
    totalsBox.innerHTML = `
      <div class="row"><span>${fmtMoney(l.pricePerNight)} × ${nights} night${nights === 1 ? "" : "s"}</span><span>${fmtMoney(nightly)}</span></div>
      ${fest ? `<div class="row discount"><span>${fest.emoji} ${fest.name} discount (5%)</span><span>−${fmtMoney(discount)}</span></div>` : ""}
      <div class="row"><span>Cleaning fee</span><span>${fmtMoney(cleaning)}</span></div>
      <div class="row"><span>Service fee</span><span>${fmtMoney(service)}</span></div>
      <div class="total"><span>Total</span><span>${fmtMoney(total)}</span></div>
    `;
    totalsBox._total = total;
    totalsBox._nights = nights;
  }
  [checkInIn, checkOutIn].forEach(i => i.addEventListener("change", recalcTotals));
  setTimeout(recalcTotals, 0);

  const reserveBtn = el("button", { class: "btn btn-primary btn-block btn-lg" }, "Reserve");
  reserveBtn.addEventListener("click", () => {
    const session = Store.session.current();
    const a = new Date(checkInIn.value), b = new Date(checkOutIn.value);
    if (b <= a) { toast("Check-out must be after check-in"); return; }
    Store.bookings.create({
      userId: session.userId,
      listingId: l.id,
      checkIn: a.getTime(),
      checkOut: b.getTime(),
      guests: parseInt(guestsIn.value, 10),
      total: totalsBox._total
    });
    toast("Booking confirmed!");
    navigate("/trips");
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
        el("div", { class: "booking-fields" }, [
          el("div", { class: "row" }, [
            el("div", { class: "cell" }, [el("label", {}, "Check-in"), checkInIn]),
            el("div", { class: "cell" }, [el("label", {}, "Check-out"), checkOutIn])
          ]),
          el("div", { style: "padding:10px 12px;border-top:1px solid var(--ink)" }, [
            el("label", { style: "font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em" }, "Guests"),
            guestsIn
          ])
        ]),
        reserveBtn,
        totalsBox
      ])
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
      const ok = await confirmModal({ title: "Cancel this trip?", body: "Your refund policy depends on the host's terms.", confirmText: "Cancel trip", danger: true });
      if (!ok) return;
      Store.bookings.cancel(b.id);
      toast("Trip cancelled");
      render();
    });
    return el("tr", {}, [
      el("td", {}, l ? el("img", { class: "row-img", src: l.images[0] }) : "—"),
      el("td", {}, l ? l.title : "Listing removed"),
      el("td", {}, l ? `${l.location}` : "—"),
      el("td", {}, `${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}`),
      el("td", {}, b.guests + ""),
      el("td", {}, fmtMoney(b.total)),
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
  const links = [
    { href: "#/admin", label: "Dashboard", id: "dash", icon: "📊" },
    { href: "#/admin/listings", label: "Listings", id: "listings", icon: "🏘" },
    { href: "#/admin/bookings", label: "Bookings", id: "bookings", icon: "📅" },
    { href: "#/admin/users", label: "Users", id: "users", icon: "👥" }
  ];
  const side = el("aside", { class: "admin-side" }, [
    el("h4", {}, "Admin"),
    ...links.map(l => el("a", { href: l.href, class: l.id === active ? "active" : "" }, [
      el("span", {}, l.icon),
      el("span", {}, l.label)
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
  const revenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.total, 0);

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
      stat("Revenue", fmtMoney(revenue), "Confirmed bookings only"),
      stat("Users", users.length, users.filter(u => u.role === "user").length + " guests · " + users.filter(u => u.role === "admin").length + " admins")
    ]),
    el("h2", { style: "font-size:18px;margin:0 0 12px" }, "Recent bookings"),
    bookings.length ? el("div", { class: "table-wrap" }, [
      el("table", { class: "table" }, [
        el("thead", {}, el("tr", {}, ["Listing", "Guest", "Dates", "Total", "Status"].map(h => el("th", {}, h)))),
        el("tbody", {}, recent)
      ])
    ]) : el("div", { class: "empty", style: "padding:32px" }, [el("p", {}, "No bookings yet — when guests reserve, they'll show here.")]),
    el("div", { style: "margin-top:32px;display:flex;gap:8px" }, [
      el("a", { class: "btn btn-primary", href: "#/admin/listings/new" }, "+ New listing"),
      el("button", { class: "btn btn-ghost", onClick: async () => {
        const ok = await confirmModal({ title: "Reset all data?", body: "This wipes users, listings, and bookings, then re-seeds the demo data.", confirmText: "Reset", danger: true });
        if (ok) { Store.resetSeed(); toast("Demo data reset"); navigate("/login"); }
      } }, "Reset demo data")
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
      const toggleBtn = el("button", { onClick: () => { Store.listings.update(l.id, { active: !l.active }); toast(l.active ? "Listing hidden" : "Listing published"); render(); } }, l.active === false ? "Publish" : "Hide");
      const delBtn = el("button", { class: "del", onClick: async () => {
        const ok = await confirmModal({ title: "Delete this listing?", body: l.title + " will be permanently removed.", confirmText: "Delete", danger: true });
        if (!ok) return;
        Store.listings.remove(l.id); toast("Listing deleted"); render();
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
    onSubmit: e => {
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
      if (existing) {
        Store.listings.update(existing.id, payload);
        toast("Listing updated");
      } else {
        Store.listings.create({ ...payload, ownerId: Store.session.current().userId });
        toast("Listing created");
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
    const cancelBtn = el("button", { onClick: () => { Store.bookings.cancel(b.id); toast("Booking cancelled"); render(); } }, "Cancel");
    const delBtn = el("button", { class: "del", onClick: async () => {
      const ok = await confirmModal({ title: "Delete booking?", body: "This permanently removes the record.", confirmText: "Delete", danger: true });
      if (!ok) return;
      Store.bookings.remove(b.id); toast("Booking deleted"); render();
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
      Store.users.remove(u.id); toast("User removed"); render();
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

render();

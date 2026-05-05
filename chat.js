// Stayly customer-care chat widget.
// Pure DOM, no deps. Rule-based intent matching with quick-reply chips.

(function () {
  const CHAT_KEY = "stayly.chat.v1";
  const BOT_NAME = "Layla";
  const BOT_AVATAR = "L";
  const TYPING_MS = 600;

  // ---------- intents ----------
  // Each intent: keywords (any-of), reply, optional follow-up quick replies.
  const INTENTS = [
    {
      id: "greet",
      keywords: ["hi", "hello", "hey", "salam", "marhaba", "good morning", "good evening", "good afternoon"],
      reply: () => `Welcome to Stayly UAE — I'm ${BOT_NAME}. How can I help you today?`,
      chips: ["How do I book?", "Festival discount?", "Cancellation policy", "Talk to support"]
    },
    {
      id: "booking",
      keywords: ["book", "reserve", "reservation", "how to book"],
      reply: () => "Booking takes about a minute:\n1. Pick a stay from the home grid.\n2. Choose your check-in and check-out dates.\n3. Click **Reserve** — you'll see the full breakdown before confirming.\nNo card needed for the demo. Your booking lives in **My trips**.",
      chips: ["Festival discount?", "Cancellation policy", "Where can I stay?"]
    },
    {
      id: "discount",
      keywords: ["discount", "festival", "promotion", "promo", "deal", "offer", "eid", "diwali", "national day", "new year"],
      reply: () => {
        const f = window.nextFestival ? window.nextFestival() : null;
        return f
          ? `We give **5% off** any stay that overlaps a UAE festival window — auto-applied on the booking page.\n\nUpcoming: ${f.emoji} ${f.name} (${f.start} → ${f.end}).`
          : "We give **5% off** any stay that overlaps a UAE festival — Eid Al Fitr, Eid Al Adha, Diwali, UAE National Day, or New Year. Auto-applied at booking.";
      },
      chips: ["How do I book?", "Where can I stay?"]
    },
    {
      id: "cancel",
      keywords: ["cancel", "cancellation", "refund", "change date"],
      reply: () => "**Free cancellation in the first 48 hours** of booking — full refund.\nAfter the grace window: a **5% cancellation fee** is charged and the remaining 95% is refunded.\nCancel any trip from **My trips → Cancel** — you'll see the exact refund before confirming.",
      chips: ["Talk to support", "Payment methods"]
    },
    {
      id: "payment",
      keywords: ["pay", "payment", "card", "credit", "debit", "fee", "service fee", "cleaning", "cost", "price", "charge", "aed"],
      reply: () => "All prices are in **AED**. Final total includes:\n• Nightly rate × nights\n• Cleaning fee — AED 245\n• Service fee — 12% of nightly subtotal\n• Festival discount (if applicable, −5%)\n\nWe accept **Mastercard** (with 3-D Secure ID Check). Demo card: 5123 4567 8901 2346, any future expiry, any CVC, OTP 1234.",
      chips: ["Festival discount?", "Cancellation policy"]
    },
    {
      id: "checkin",
      keywords: ["check in", "check-in", "checkin", "check out", "check-out", "checkout", "arrival", "departure"],
      reply: () => "Default **check-in 3 PM**, **check-out 11 AM**. Some hosts offer flexible timing — message them through the property page after booking.",
      chips: ["How do I book?", "Talk to support"]
    },
    {
      id: "locations",
      keywords: ["location", "where", "city", "cities", "dubai", "abu dhabi", "sharjah", "fujairah", "ras al khaimah", "rak", "hatta", "ajman", "marmoom", "desert", "yas", "saadiyat", "palm jumeirah", "burj"],
      reply: () => "We host stays across all seven emirates:\n🏙 **Dubai** — Burj Khalifa suites, Palm Jumeirah villas, Al Fahidi heritage homes\n🕌 **Abu Dhabi** — Saadiyat beachfront, Yas Marina lofts, Corniche penthouses\n⛰ **Ras Al Khaimah** — Jebel Jais cliff houses\n🌊 **Fujairah** — coral-coast bungalows\n🛍 **Sharjah** — Heart of Sharjah heritage stays\n🐪 **Hatta & Al Marmoom** — mountain lodges and desert tents",
      chips: ["How do I book?", "Festival discount?"]
    },
    {
      id: "wifi",
      keywords: ["wifi", "wi-fi", "internet", "workspace", "remote work"],
      reply: () => "Every Stayly listing includes **fast Wi-Fi**. Look for the **🎨 Design** category for stays with dedicated workspaces.",
      chips: ["Where can I stay?"]
    },
    {
      id: "pets",
      keywords: ["pet", "dog", "cat", "animal"],
      reply: () => "Pet policy varies by listing — check the **What this place offers** section on each property page. Search the homepage for 'pet-friendly' to filter.",
      chips: ["Talk to support"]
    },
    {
      id: "host",
      keywords: ["host", "list my", "become host", "earn", "rent out my"],
      reply: () => "Want to host on Stayly? **Sign up as Admin** on the signup page — admins can add and manage listings from the admin dashboard.",
      chips: ["How do I book?", "Talk to support"]
    },
    {
      id: "support",
      keywords: ["agent", "human", "support", "talk to", "speak to", "call", "phone", "email", "contact"],
      reply: () => "Sure — drop your **name, email, and message** below and a Stayly specialist will reply within an hour.\n\n_Demo note: messages are stored locally; no email actually sent._",
      chips: ["Open contact form"],
      action: "support"
    },
    {
      id: "thanks",
      keywords: ["thanks", "thank you", "thx", "shukran", "appreciate"],
      reply: () => "Anytime — enjoy your stay across the Emirates! 🌴",
      chips: ["How do I book?", "Festival discount?"]
    }
  ];

  function detectIntent(text) {
    const t = text.toLowerCase();
    for (const intent of INTENTS) {
      if (intent.keywords.some(k => t.includes(k))) return intent;
    }
    return null;
  }

  function fallback() {
    return {
      reply: () => "I didn't quite catch that. I can help with **booking**, **cancellation**, **festival discounts**, **payment**, **locations across the UAE**, or **getting in touch with support**.",
      chips: ["How do I book?", "Festival discount?", "Cancellation policy", "Talk to support"]
    };
  }

  // ---------- state ----------
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch { return []; }
  }
  function saveHistory(msgs) {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))); } catch {}
  }
  let history = loadHistory();
  let isOpen = false;
  let supportFormVisible = false;

  // ---------- render ----------
  const fab = document.createElement("button");
  fab.className = "chat-fab";
  fab.setAttribute("aria-label", "Open chat with Stayly support");
  fab.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 5h10v2H7zm0 4h7v2H7z"/>
    </svg>
    <span class="chat-fab-pulse"></span>
  `;
  fab.addEventListener("click", () => toggle(true));

  const panel = document.createElement("aside");
  panel.className = "chat-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <header class="chat-head">
      <div class="chat-avatar">${BOT_AVATAR}</div>
      <div class="chat-meta">
        <div class="chat-name">${BOT_NAME} · Stayly support</div>
        <div class="chat-status"><span class="dot"></span>Usually replies instantly</div>
      </div>
      <button class="chat-close" aria-label="Close chat">✕</button>
    </header>
    <div class="chat-body" id="chatBody"></div>
    <div class="chat-quickrow" id="chatQuickRow"></div>
    <form class="chat-input" id="chatForm" autocomplete="off">
      <input id="chatInput" type="text" placeholder="Ask about bookings, festivals, cancellations…" />
      <button type="submit" class="chat-send" aria-label="Send">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
      </button>
    </form>
  `;
  panel.querySelector(".chat-close").addEventListener("click", () => toggle(false));
  const body = panel.querySelector("#chatBody");
  const quickRow = panel.querySelector("#chatQuickRow");
  const form = panel.querySelector("#chatForm");
  const input = panel.querySelector("#chatInput");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    handleUser(v);
  });

  document.addEventListener("DOMContentLoaded", init, { once: true });
  if (document.readyState !== "loading") init();

  function init() {
    attach();
    // The host SPA wipes document.body on route changes — re-attach if our nodes get removed.
    const obs = new MutationObserver(() => {
      if (!document.body.contains(fab)) attach();
    });
    obs.observe(document.body, { childList: true });
  }

  function attach() {
    if (document.body.contains(fab)) return;
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    if (history.length === 0 && body.children.length === 0) {
      pushBot(`Hi! I'm ${BOT_NAME} from Stayly UAE. Need help finding a stay or booking one? Pick a topic 👇`, [
        "How do I book?",
        "Festival discount?",
        "Cancellation policy",
        "Where can I stay?",
        "Talk to support"
      ], { silent: true });
    } else if (body.children.length === 0 && history.length > 0) {
      history.forEach(m => renderMsg(m, true));
      scrollToBottom();
    }
  }

  // ---------- chat plumbing ----------
  function toggle(open) {
    isOpen = open;
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", String(!open));
    fab.classList.toggle("hidden", open);
    if (open) {
      setTimeout(() => { input.focus(); scrollToBottom(); }, 50);
    }
  }

  function renderMsg(msg, skipAnim) {
    const row = document.createElement("div");
    row.className = "chat-msg " + (msg.from === "bot" ? "bot" : "user");
    if (skipAnim) row.style.animation = "none";
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.innerHTML = formatMarkdown(msg.text);
    row.appendChild(bubble);
    body.appendChild(row);
    scrollToBottom();
    return row;
  }

  function formatMarkdown(t) {
    return escapeHtml(t)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  }

  function pushBot(text, chips, { silent = false } = {}) {
    if (!silent) {
      const typing = document.createElement("div");
      typing.className = "chat-msg bot typing";
      typing.innerHTML = `<div class="chat-bubble"><span class="d"></span><span class="d"></span><span class="d"></span></div>`;
      body.appendChild(typing);
      scrollToBottom();
      return new Promise(resolve => {
        setTimeout(() => {
          typing.remove();
          const msg = { from: "bot", text, ts: Date.now() };
          history.push(msg);
          saveHistory(history);
          renderMsg(msg);
          renderChips(chips || []);
          resolve();
        }, TYPING_MS);
      });
    } else {
      const msg = { from: "bot", text, ts: Date.now() };
      history.push(msg);
      saveHistory(history);
      renderMsg(msg, true);
      renderChips(chips || []);
    }
  }

  function pushUser(text) {
    const msg = { from: "user", text, ts: Date.now() };
    history.push(msg);
    saveHistory(history);
    renderMsg(msg);
    renderChips([]);
  }

  function renderChips(chips) {
    quickRow.innerHTML = "";
    if (!chips.length) return;
    chips.forEach(label => {
      const c = document.createElement("button");
      c.className = "chat-chip";
      c.type = "button";
      c.textContent = label;
      c.addEventListener("click", () => {
        if (label === "Open contact form") return showSupportForm();
        handleUser(label);
      });
      quickRow.appendChild(c);
    });
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }

  async function handleUser(text) {
    pushUser(text);
    const intent = detectIntent(text) || fallback();
    await pushBot(intent.reply(), intent.chips);
    if (intent.action === "support") showSupportForm();
  }

  function showSupportForm() {
    if (supportFormVisible) return;
    supportFormVisible = true;
    quickRow.innerHTML = "";
    const wrap = document.createElement("form");
    wrap.className = "chat-support";
    wrap.innerHTML = `
      <input name="name" placeholder="Your name" required>
      <input name="email" type="email" placeholder="Email" required>
      <textarea name="message" placeholder="How can we help?" required rows="3"></textarea>
      <div class="chat-support-actions">
        <button type="button" class="chat-chip cancel">Cancel</button>
        <button type="submit" class="chat-chip primary">Send</button>
      </div>
    `;
    wrap.querySelector(".cancel").addEventListener("click", () => {
      wrap.remove();
      supportFormVisible = false;
      renderChips(["How do I book?", "Festival discount?", "Cancellation policy"]);
    });
    wrap.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(wrap);
      const name = fd.get("name");
      const email = fd.get("email");
      const message = fd.get("message");
      try {
        if (window.Store && Store.tickets) Store.tickets.create({ name, email, message });
      } catch {}
      wrap.remove();
      supportFormVisible = false;
      pushUser(`(Support request) ${name} · ${email}\n${message}`);
      await pushBot(`Thanks ${String(name).split(" ")[0]} — your request is logged. A Stayly specialist will email **${email}** within an hour.`, ["How do I book?", "Festival discount?"]);
    });
    quickRow.appendChild(wrap);
    scrollToBottom();
  }

  // expose for debugging
  window.StaylyChat = { open: () => toggle(true), close: () => toggle(false), reset: () => { history = []; localStorage.removeItem(CHAT_KEY); body.innerHTML = ""; attach(); } };
})();

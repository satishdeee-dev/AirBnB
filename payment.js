// Mastercard demo payment dialog. Client-side only — no real network calls.
// Modeled on Mastercard Hosted Checkout flow: card details → processing → ID Check (3DS) → result.

(function () {
  function luhn(num) {
    const digits = num.replace(/\D/g, "").split("").reverse().map(Number);
    if (digits.length < 12) return false;
    const sum = digits.reduce((a, d, i) => a + (i % 2 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d), 0);
    return sum % 10 === 0;
  }
  function brand(num) {
    const n = num.replace(/\D/g, "");
    if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return "mastercard";
    if (/^4/.test(n)) return "visa";
    if (/^3[47]/.test(n)) return "amex";
    return "unknown";
  }
  function formatCard(s) {
    return s.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExp(s) {
    const d = s.replace(/\D/g, "").slice(0, 4);
    if (d.length < 3) return d;
    return d.slice(0, 2) + "/" + d.slice(2);
  }
  function txnId() {
    return "MC-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  const MC_LOGO = `
    <svg viewBox="0 0 48 30" width="40" height="25" aria-label="Mastercard">
      <circle cx="18" cy="15" r="12" fill="#eb001b"/>
      <circle cx="30" cy="15" r="12" fill="#f79e1b"/>
      <path d="M24 6.5a12 12 0 0 0 0 17 12 12 0 0 0 0-17z" fill="#ff5f00"/>
    </svg>
  `;

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v != null && v !== false) n.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  function fmtAmount(n) { return "AED " + Math.round(n).toLocaleString(); }

  // ---------- public API ----------
  // Payment.collect({ amount, listingTitle }) → Promise resolving with { brand, last4, txnId, holder } or rejecting on cancel.
  function collect({ amount, listingTitle }) {
    return new Promise((resolve, reject) => {
      const backdrop = el("div", { class: "pay-backdrop", role: "dialog", "aria-modal": "true" });
      const modal = el("div", { class: "pay-modal" });

      // ----- header -----
      const head = el("header", { class: "pay-head" }, [
        el("div", { class: "pay-brand", html: MC_LOGO + '<span>Mastercard <em>Payment Gateway</em></span>' }),
        el("button", { class: "pay-close", "aria-label": "Cancel payment", onClick: () => { backdrop.remove(); reject(new Error("cancelled")); } }, "✕")
      ]);

      // ----- summary -----
      const summary = el("div", { class: "pay-summary" }, [
        el("div", { class: "pay-merchant" }, "Stayly UAE"),
        el("div", { class: "pay-listing" }, listingTitle || "Reservation"),
        el("div", { class: "pay-amount" }, [
          el("span", {}, "Amount due"),
          el("strong", {}, fmtAmount(amount))
        ])
      ]);

      // ----- card form -----
      const errorBox = el("div", { class: "pay-error", style: "display:none" });
      const numberIn = el("input", { id: "pay_num", placeholder: "1234 5678 9012 3456", inputmode: "numeric", autocomplete: "cc-number", maxlength: "23", required: true });
      const expIn    = el("input", { id: "pay_exp", placeholder: "MM/YY", inputmode: "numeric", autocomplete: "cc-exp", maxlength: "5", required: true });
      const cvvIn    = el("input", { id: "pay_cvv", placeholder: "CVC", inputmode: "numeric", autocomplete: "cc-csc", maxlength: "4", type: "password", required: true });
      const nameIn   = el("input", { id: "pay_name", placeholder: "Name on card", autocomplete: "cc-name", required: true });

      const brandPill = el("div", { class: "pay-brand-pill", html: MC_LOGO });

      numberIn.addEventListener("input", () => {
        numberIn.value = formatCard(numberIn.value);
        const b = brand(numberIn.value);
        brandPill.dataset.brand = b;
        brandPill.style.opacity = b === "unknown" ? "0.3" : "1";
      });
      expIn.addEventListener("input", () => { expIn.value = formatExp(expIn.value); });
      cvvIn.addEventListener("input", () => { cvvIn.value = cvvIn.value.replace(/\D/g, ""); });

      const submitBtn = el("button", { class: "btn btn-primary btn-block btn-lg", type: "submit" }, [
        el("span", { class: "lock", html: "🔒" }), document.createTextNode(" Pay " + fmtAmount(amount))
      ]);

      const form = el("form", { class: "pay-form", onSubmit: e => { e.preventDefault(); attemptPayment(); } }, [
        errorBox,
        el("label", {}, "Card number"),
        el("div", { class: "pay-input-wrap" }, [numberIn, brandPill]),
        el("div", { class: "pay-row" }, [
          el("div", {}, [el("label", {}, "Expiry"), expIn]),
          el("div", {}, [el("label", {}, "CVC"), cvvIn])
        ]),
        el("label", {}, "Cardholder name"),
        nameIn,
        submitBtn,
        el("div", { class: "pay-test", html: 'Demo card: <code>5123 4567 8901 2346</code> · any future expiry · any 3-digit CVC · 3-D Secure code: <code>1234</code>' })
      ]);

      // ----- attempt payment -----
      function showError(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = "block";
      }
      function clearError() {
        errorBox.style.display = "none";
      }

      function attemptPayment() {
        clearError();
        const num = numberIn.value.replace(/\s/g, "");
        const b = brand(num);
        if (!luhn(num)) return showError("Card number is invalid.");
        if (b !== "mastercard") return showError("Only Mastercard is supported in this demo. Try 5123 4567 8901 2346.");
        const expMatch = expIn.value.match(/^(\d{2})\/(\d{2})$/);
        if (!expMatch) return showError("Expiry must be MM/YY.");
        const month = parseInt(expMatch[1], 10), year = 2000 + parseInt(expMatch[2], 10);
        if (month < 1 || month > 12) return showError("Expiry month is invalid.");
        const expDate = new Date(year, month, 0, 23, 59, 59);
        if (expDate < new Date()) return showError("Card has expired.");
        if (cvvIn.value.length < 3) return showError("CVC must be 3 or 4 digits.");
        if (!nameIn.value.trim()) return showError("Enter the name on the card.");

        runProcessing(num, nameIn.value.trim());
      }

      // ----- processing screen -----
      const stage = el("div", { class: "pay-stage" }, [head, summary, form]);
      modal.appendChild(stage);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      setTimeout(() => numberIn.focus(), 50);

      function swapStage(content) {
        stage.innerHTML = "";
        (Array.isArray(content) ? content : [content]).forEach(c => stage.appendChild(c));
      }

      function runProcessing(num, holder) {
        const last4 = num.slice(-4);
        swapStage([
          head,
          summary,
          el("div", { class: "pay-processing" }, [
            el("div", { class: "pay-spinner" }),
            el("div", { class: "pay-status" }, "Authorising with your bank…"),
            el("div", { class: "pay-substatus" }, "Securing payment over TLS")
          ])
        ]);
        setTimeout(() => run3DS(num, holder, last4), 1100);
      }

      function run3DS(num, holder, last4) {
        const otpIn = el("input", { id: "pay_otp", placeholder: "Enter 4-digit code", inputmode: "numeric", maxlength: "4", autofocus: true });
        const otpErr = el("div", { class: "pay-error", style: "display:none" });
        const verifyBtn = el("button", { class: "btn btn-primary btn-block btn-lg", type: "submit" }, "Verify");
        const otpForm = el("form", { class: "pay-3ds-form", onSubmit: e => {
          e.preventDefault();
          const code = otpIn.value.trim();
          if (code === "1234") finalizeSuccess(num, holder, last4);
          else { otpErr.textContent = "Incorrect code. Try 1234 for the demo."; otpErr.style.display = "block"; }
        } }, [
          otpErr,
          otpIn,
          verifyBtn,
          el("button", { class: "pay-resend", type: "button", onClick: () => alert("Demo: code is 1234.") }, "Didn't get the code?")
        ]);

        swapStage([
          el("header", { class: "pay-head pay-head-3ds" }, [
            el("div", { class: "pay-brand", html: MC_LOGO + '<span>Mastercard <em>ID Check</em></span>' }),
            el("button", { class: "pay-close", onClick: () => { backdrop.remove(); reject(new Error("cancelled")); } }, "✕")
          ]),
          el("div", { class: "pay-3ds" }, [
            el("h3", {}, "Verify it's you"),
            el("p", {}, "We sent a 4-digit security code to your bank's app for the card ending in •••• " + last4 + "."),
            el("p", { class: "pay-3ds-amount" }, "Authorising " + fmtAmount(amount) + " · Stayly UAE"),
            otpForm
          ])
        ]);
        setTimeout(() => otpIn.focus(), 50);
      }

      function finalizeSuccess(num, holder, last4) {
        swapStage([
          el("div", { class: "pay-success" }, [
            el("div", { class: "pay-tick", html: `
              <svg viewBox="0 0 64 64" width="64" height="64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#4ade80" stroke-width="3"/>
                <path d="M20 33 L29 42 L46 24" fill="none" stroke="#4ade80" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            ` }),
            el("h3", {}, "Payment approved"),
            el("p", { class: "pay-receipt" }, fmtAmount(amount) + " charged to •••• " + last4),
            el("p", { class: "pay-txn" }, "Authorisation ref · " + txnId())
          ])
        ]);
        setTimeout(() => {
          backdrop.remove();
          resolve({ brand: "mastercard", last4, holder, txnId: txnId() });
        }, 950);
      }
    });
  }

  window.Payment = { collect };
})();

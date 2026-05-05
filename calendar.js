// Two-month calendar range picker. Anchors to a trigger element; click-outside or Done to close.
// Highlights UAE festival windows with a gold ring + tooltip.

(function () {
  const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

  function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function addDays(d, n)  { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { const x = new Date(d); x.setDate(1); x.setMonth(x.getMonth() + n); return x; }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dInRange(d, a, b) { return d >= a && d <= b; }
  function fmtShort(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

  function festivalAt(d, festivals) {
    if (!festivals) return null;
    const ts = startOfDay(d).getTime();
    return festivals.find(f => {
      const fs = new Date(f.start + "T00:00:00").getTime();
      const fe = new Date(f.end   + "T00:00:00").getTime();
      return ts >= fs && ts <= fe;
    });
  }

  function open({ anchor, from, to, focus, minDate, festivals, onChange, onClose }) {
    const today = startOfDay(new Date());
    const min = minDate ? startOfDay(minDate) : today;

    // local state
    let selFrom = from ? startOfDay(from) : null;
    let selTo   = to   ? startOfDay(to)   : null;
    let hoverDate = null;
    let viewStart = startOfDay(addMonths((focus === "out" && selTo) || selFrom || today, 0));
    viewStart.setDate(1);
    // Phase: which date is the next click going to set?
    // - focus "out" with both set → user wants to change check-out only.
    // - selFrom && !selTo → mid-selection.
    // - else (both set or both null) → start fresh from check-in.
    let phase = (focus === "out" && selFrom) ? "out" : (selFrom && !selTo ? "out" : "in");

    const pop = el("div", { class: "datepicker-pop", role: "dialog", "aria-label": "Pick check-in and check-out dates" });

    function closeAndCleanup() {
      doc.removeEventListener("mousedown", outsideClick, true);
      doc.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      pop.remove();
      if (onClose) onClose({ from: selFrom, to: selTo });
    }

    function outsideClick(e) {
      if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) {
        closeAndCleanup();
      }
    }
    function onKey(e) { if (e.key === "Escape") closeAndCleanup(); }
    const doc = document;
    doc.addEventListener("mousedown", outsideClick, true);
    doc.addEventListener("keydown", onKey, true);

    function emitChange() {
      if (onChange) onChange({ from: selFrom, to: selTo });
    }

    function clickDay(d) {
      if (d < min) return;
      if (phase === "in" || (selFrom && d < selFrom)) {
        selFrom = d; selTo = null; phase = "out";
        emitChange();
        rerender();
      } else if (phase === "out") {
        if (sameDay(d, selFrom)) {
          // can't be same day — extend by 1
          selTo = addDays(selFrom, 1);
        } else {
          selTo = d;
        }
        phase = "in"; // next click resets
        emitChange();
        rerender();
        // small delay then close
        setTimeout(closeAndCleanup, 200);
      }
    }

    function renderMonth(start) {
      const year = start.getFullYear();
      const month = start.getMonth();
      const firstDow = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const grid = el("div", { class: "dp-grid" });
      DAYS_OF_WEEK.forEach(d => grid.appendChild(el("div", { class: "dp-dow" }, d)));
      // padding cells for first row
      for (let i = 0; i < firstDow; i++) grid.appendChild(el("div", { class: "dp-cell empty" }));
      for (let day = 1; day <= daysInMonth; day++) {
        const date = startOfDay(new Date(year, month, day));
        const past = date < min;
        const isFrom = sameDay(date, selFrom);
        const isTo = sameDay(date, selTo);
        const inRange = selFrom && selTo && dInRange(date, selFrom, selTo);
        const inHover = selFrom && !selTo && hoverDate && date > selFrom && date <= hoverDate;
        const fest = festivalAt(date, festivals);
        const cls = ["dp-cell"];
        if (past) cls.push("past");
        if (isFrom) cls.push("from");
        if (isTo) cls.push("to");
        if (inRange) cls.push("in-range");
        if (inHover) cls.push("hover-range");
        if (fest && !past) cls.push("festival");

        const btn = el("button", {
          type: "button",
          class: cls.join(" "),
          "aria-label": date.toDateString() + (fest ? ` — ${fest.name}` : ""),
          title: fest ? `${fest.emoji} ${fest.name}` : "",
          disabled: past,
          onClick: e => { e.stopPropagation(); clickDay(date); },
          onMouseenter: () => { if (selFrom && !selTo) { hoverDate = date; rerender(); } }
        }, [
          el("span", { class: "dp-day" }, String(day)),
          fest ? el("span", { class: "dp-fest-dot", html: fest.emoji }) : null
        ]);
        grid.appendChild(btn);
      }

      const head = el("div", { class: "dp-month-head" }, MONTH_NAMES[month] + " " + year);
      return el("div", { class: "dp-month" }, [head, grid]);
    }

    function rerender() {
      pop.innerHTML = "";
      const head = el("header", { class: "dp-head" }, [
        el("button", { type: "button", class: "dp-nav", "aria-label": "Previous month", onClick: () => { viewStart = addMonths(viewStart, -1); rerender(); } }, "‹"),
        el("div", { class: "dp-summary" }, [
          el("div", { class: "dp-segment " + (phase === "in" ? "active" : "") }, [el("div", { class: "dp-label" }, "Check-in"), el("div", { class: "dp-value" }, selFrom ? fmtShort(selFrom) : "Add date")]),
          el("div", { class: "dp-arrow" }, "→"),
          el("div", { class: "dp-segment " + (phase === "out" ? "active" : "") }, [el("div", { class: "dp-label" }, "Check-out"), el("div", { class: "dp-value" }, selTo ? fmtShort(selTo) : "Add date")])
        ]),
        el("button", { type: "button", class: "dp-nav", "aria-label": "Next month", onClick: () => { viewStart = addMonths(viewStart, 1); rerender(); } }, "›")
      ]);

      const months = el("div", { class: "dp-months" }, [
        renderMonth(viewStart),
        renderMonth(addMonths(viewStart, 1))
      ]);

      const legend = el("div", { class: "dp-legend" }, [
        el("span", {}, "🟡 = UAE festival window · stays during these dates get 5% off")
      ]);

      const foot = el("footer", { class: "dp-foot" }, [
        el("button", { type: "button", class: "dp-clear", onClick: () => { selFrom = null; selTo = null; phase = "in"; emitChange(); rerender(); } }, "Clear"),
        el("button", { type: "button", class: "dp-done", onClick: closeAndCleanup }, selTo ? "Done" : "Close")
      ]);

      pop.appendChild(head);
      pop.appendChild(months);
      pop.appendChild(legend);
      pop.appendChild(foot);
    }

    function reposition() {
      const r = anchor.getBoundingClientRect();
      const popW = pop.offsetWidth || 640;
      const popH = pop.offsetHeight || 420;
      const margin = 8;
      // Mobile: center as modal
      if (window.innerWidth < 720) {
        pop.classList.add("mobile");
        pop.style.left = ""; pop.style.top = ""; pop.style.right = "";
        return;
      }
      pop.classList.remove("mobile");
      let top = r.bottom + window.scrollY + margin;
      let left = r.left + window.scrollX;
      // Keep on-screen
      if (left + popW > window.scrollX + window.innerWidth - margin) {
        left = window.scrollX + window.innerWidth - popW - margin;
      }
      if (top + popH > window.scrollY + window.innerHeight - margin) {
        top = r.top + window.scrollY - popH - margin;
      }
      pop.style.left = Math.max(margin, left) + "px";
      pop.style.top = Math.max(margin, top) + "px";
    }

    rerender();
    document.body.appendChild(pop);
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return { close: closeAndCleanup };
  }

  window.DatePicker = { open };
})();

(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Shared: year, mobile nav, back-to-top, fade-in ---------- */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  var toggle = $(".nav-toggle"), menu = $("#nav-menu");
  if (toggle && menu) toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  var topBtn = document.createElement("button");
  topBtn.type = "button"; topBtn.className = "to-top"; topBtn.textContent = "\u2191";
  topBtn.setAttribute("aria-label", "Back to top");
  document.body.appendChild(topBtn);
  topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", function () { topBtn.classList.toggle("show", window.scrollY > 300); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    $$(".fade-in").forEach(function (el) { io.observe(el); });
  } else { $$(".fade-in").forEach(function (el) { el.classList.add("visible"); }); }

  /* ---------- Modal (native dialog) ---------- */
  var how = $("#how-dialog"), openHow = $("#open-how");
  if (how) {
    if (openHow) openHow.addEventListener("click", function () { how.showModal(); });
    how.addEventListener("click", function (e) { if (e.target === how || e.target.hasAttribute("data-close")) how.close(); });
  }

  /* ---------- Animated counters (home) ---------- */
  $$(".count").forEach(function (el) {
    var target = +el.dataset.target, n = 0, step = Math.max(1, Math.ceil(target / 40));
    var t = setInterval(function () { n = Math.min(target, n + step); el.textContent = n; if (n >= target) clearInterval(t); }, 40);
  });

  /* ---------- Gallery lightbox ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var links = $$("#gallery .gallery-link"), idx = 0, img = $("#lb-img"), cap = $("#lb-cap");
    var show = function (i) {
      idx = (i + links.length) % links.length;
      img.src = links[idx].getAttribute("href");
      img.alt = $("img", links[idx]).alt;
      cap.textContent = links[idx].dataset.caption + " (" + (idx + 1) + " of " + links.length + ")";
    };
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) { e.preventDefault(); show(i); lb.showModal(); });
    });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Services: tabs, accordion, dynamic list + search ---------- */
  var tabs = $$(".tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
    });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var next = tabs[(tabs.indexOf(tab) + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); next.click();
      }
    });
  });

  $$(".acc-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", String(!open));
      $("#" + b.getAttribute("aria-controls")).hidden = open;
    });
  });

  var list = $("#pro-list"), pros = [];
  function loadPros() {
    return fetch("data/professionals.json").then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function renderPros() {
    var q = $("#search").value.trim().toLowerCase(), sp = $("#filter-specialty").value, so = $("#sort").value;
    var out = pros.filter(function (p) {
      var hay = (p.name + " " + p.specialty + " " + p.language + " " + p.title).toLowerCase();
      return (sp === "all" || p.specialty === sp) && hay.indexOf(q) !== -1;
    });
    out.sort(function (a, b) { return so === "low" ? a.rate - b.rate : so === "high" ? b.rate - a.rate : a.name.localeCompare(b.name); });
    list.textContent = "";
    $("#result-count").textContent = out.length + " professional" + (out.length === 1 ? "" : "s") + " found";
    if (!out.length) { var m = document.createElement("p"); m.textContent = "No professionals match your search. Try a different keyword or specialty."; list.appendChild(m); return; }
    out.forEach(function (p) {
      var c = document.createElement("article"); c.className = "pro-card";
      var h = document.createElement("h3"); h.textContent = p.name;
      var lines = [p.title, "Specialty: " + p.specialty, "Experience: " + p.experience, "Languages: " + p.language, "Available: " + p.days.join(", ")];
      c.appendChild(h);
      lines.forEach(function (t) { var el = document.createElement("p"); el.textContent = t; c.appendChild(el); });
      var price = document.createElement("p"); price.className = "price"; price.textContent = "R" + p.rate + " per hour"; c.appendChild(price);
      list.appendChild(c);
    });
  }
  if (list) {
    loadPros().then(function (d) { pros = d; renderPros(); })
      .catch(function () { list.textContent = "Sorry, professionals could not be loaded. Please run the site from a web server and refresh."; });
    ["input", "change"].forEach(function (ev) {
      $("#search").addEventListener(ev, renderPros); $("#filter-specialty").addEventListener(ev, renderPros); $("#sort").addEventListener(ev, renderPros);
    });
  }

  /* ---------- Form helpers ---------- */
  function setErr(id, msg) {
    var el = $("#" + id + "-err"), inp = $("#" + id);
    if (el) el.textContent = msg || "";
    if (inp) { inp.classList.toggle("invalid", !!msg); inp.setAttribute("aria-invalid", msg ? "true" : "false"); }
    return !msg;
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneRe = /^(\+27|0)[0-9]{9}$/;
  var nameRe = /^[A-Za-z\u00C0-\u017F' \-]{2,60}$/;
  function vName(id) { var v = $("#" + id).value.trim(); return setErr(id, !v ? "Please enter your name." : !nameRe.test(v) ? "Use 2 to 60 letters only (no numbers)." : ""); }
  function vEmail(id) { var v = $("#" + id).value.trim(); return setErr(id, !v ? "Please enter your email address." : !emailRe.test(v) ? "Enter a valid email, e.g. name@example.com." : ""); }
  function vPhone(id, req) { var v = $("#" + id).value.replace(/\s/g, ""); return setErr(id, !v ? (req ? "Please enter your phone number." : "") : !phoneRe.test(v) ? "Use a South African number like 0821234567 or +27821234567." : ""); }
  function vSelect(id, label) { return setErr(id, $("#" + id).value ? "" : "Please choose " + label + "."); }
  function vMsg(id, max) { var v = $("#" + id).value.trim(); return setErr(id, v.length < 20 ? "Message must be at least 20 characters (now " + v.length + ")." : v.length > max ? "Message is too long (max " + max + ")." : ""); }

  /* ---------- Enquiry form: validation + AJAX response ---------- */
  var ef = $("#enquiry-form");
  if (ef) {
    var today = new Date().toISOString().split("T")[0]; $("#date").min = today;
    var msg = $("#message"), cnt = $("#msg-count");
    msg.addEventListener("input", function () { cnt.textContent = msg.value.length + "/500"; });
    var sg = $("#specialty-group");
    $("#etype").addEventListener("change", function () { sg.hidden = $("#etype").value !== "session"; });
    sg.hidden = true;
    var blurs = { fullname: function () { return vName("fullname"); }, email: function () { return vEmail("email"); }, phone: function () { return vPhone("phone", true); }, message: function () { return vMsg("message", 500); } };
    Object.keys(blurs).forEach(function (k) { $("#" + k).addEventListener("blur", blurs[k]); });

    ef.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = [vName("fullname"), vEmail("email"), vPhone("phone", true), vSelect("etype", "an enquiry type")];
      if ($("#etype").value === "session") ok.push(vSelect("specialty", "the support you need"));
      var d = $("#date").value;
      ok.push(setErr("date", !d ? "Please choose a date." : d < today ? "The date cannot be in the past." : ""));
      ok.push(vMsg("message", 500));
      ok.push(setErr("consent", $("#consent").checked ? "" : "You must agree before sending."));
      if (ok.indexOf(false) !== -1) { var f = $(".invalid", ef); if (f) f.focus(); return; }

      var res = $("#enquiry-result"), btn = $(".btn-submit", ef);
      btn.disabled = true; btn.textContent = "Sending...";
      res.hidden = false; res.className = "result"; res.textContent = "Processing your enquiry...";
      loadPros().then(function (data) {
        var type = $("#etype").value, name = $("#fullname").value.trim().split(" ")[0];
        var rates = data.map(function (p) { return p.rate; });
        var lo = Math.min.apply(null, rates), hi = Math.max.apply(null, rates), text;
        if (type === "session") {
          var sp = $("#specialty").value;
          var m = data.filter(function (p) { return p.specialty === sp; }).sort(function (a, b) { return a.rate - b.rate; });
          var dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d + "T12:00:00").getDay()];
          var onDay = m.filter(function (p) { return p.days.indexOf(dayName) !== -1; });
          text = "Thank you, " + name + ". We have " + m.length + " professional(s) for " + sp + ", from R" + m[0].rate + " to R" + m[m.length - 1].rate + " per hour. " +
            (onDay.length ? onDay.map(function (p) { return p.name + " (R" + p.rate + ")"; }).join(", ") + " can see you on " + dayName + " " + d + "." : "No one is free on " + dayName + " " + d + ". Please try another day: available days are listed on the Services page.");
        } else if (type === "pricing") {
          text = "Thank you, " + name + ". Sessions currently cost between R" + lo + " and R" + hi + " per hour, depending on the professional's experience. See the Services page to compare.";
        } else {
          text = "Thank you, " + name + ". Professionals keep 70% of every session fee and set their own rate. We will email " + $("#email").value.trim() + " with the next steps within 48 business hours.";
        }
        res.textContent = text; res.className = "result success"; ef.reset(); cnt.textContent = "0/500"; sg.hidden = true;
      }).catch(function () {
        res.textContent = "Sorry, we could not process your enquiry right now. Please try again or email us from the Contact page."; res.className = "result fail";
      }).then(function () { btn.disabled = false; btn.textContent = "Send Enquiry"; });
    });
  }

  /* ---------- Contact form: validation + compose email ---------- */
  var cf = $("#contact-form");
  if (cf) {
    cf.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = [vName("cname"), vEmail("cemail"), vPhone("cphone", false), vSelect("ctype", "a message type"), vMsg("cmessage", 1000)];
      if (ok.indexOf(false) !== -1) { var f = $(".invalid", cf); if (f) f.focus(); return; }
      var subject = "TalkAboutIt: " + $("#ctype").value + " from " + $("#cname").value.trim();
      var body = "Name: " + $("#cname").value.trim() + "\nEmail: " + $("#cemail").value.trim() + "\nPhone: " + ($("#cphone").value.trim() || "not given") + "\nType: " + $("#ctype").value + "\n\nMessage:\n" + $("#cmessage").value.trim();
      var href = "mailto:sekamengkatlego@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var r = $("#contact-result"); r.hidden = false; r.className = "result success"; r.textContent = "";
      var p = document.createElement("p"); p.textContent = "Your message is ready. If your email app did not open, press the button below.";
      var pre = document.createElement("pre"); pre.textContent = "To: sekamengkatlego@gmail.com\nSubject: " + subject + "\n\n" + body;
      var a = document.createElement("a"); a.href = href; a.className = "btn-submit btn-link"; a.textContent = "Open in email app";
      r.appendChild(p); r.appendChild(pre); r.appendChild(a);
      window.location.href = href;
    });
  }

  /* ---------- Interactive map (Leaflet) ---------- */
  function initMap() {
    var el = $("#map"); if (!el || typeof L === "undefined") return;
    var pos = [-26.1467, 28.0436];
    var map = L.map(el).setView(pos, 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    L.marker(pos).addTo(map).bindPopup("<strong>TalkAboutIt</strong><br>Rosebank, Johannesburg").openPopup();
  }
  if ($("#map")) { if (typeof L !== "undefined") initMap(); else window.addEventListener("load", initMap); }
})();

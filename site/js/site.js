(function () {
  "use strict";

  var data = window.NGX_DATA || {};
  var TRACKED_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "li_fat_id"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var motion = !reduce && window.gsap && window.ScrollTrigger;

  if (motion) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  bindData();
  initTracking();
  initForm();
  initIndex();
  initLoops();
  initMarquee();

  if (motion) {
    initLenis();
    initLineRise();
    initMagnetic();
    initInk();
    initWindow();
    initCounters();
  }

  function bindData() {
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      var key = el.getAttribute("data-bind");
      if (key === "specialists" && data.specialists != null) {
        el.textContent = String(data.specialists);
      } else if (key === "productsShipped" && data.productsShipped != null) {
        el.textContent = String(data.productsShipped);
      } else if (key === "contact" && data.contact) {
        if (el.tagName === "A") el.setAttribute("href", "mailto:" + data.contact);
        var labels = el.querySelectorAll(".roll span");
        if (labels.length) labels.forEach(function (span) { span.textContent = data.contact; });
        else el.textContent = data.contact;
      } else if (key === "priceConsult" && data.pricing) {
        el.textContent = data.pricing.consult;
      } else if (key === "priceBuild" && data.pricing) {
        el.textContent = data.pricing.build;
      } else if (key === "priceRun" && data.pricing) {
        el.textContent = data.pricing.run;
      } else if (key === "automationsMark") {
        if (data.automationsInProduction == null) {
          el.textContent = data.automationsMark || "--";
          el.removeAttribute("data-counter");
        } else {
          el.textContent = String(data.automationsInProduction);
          el.setAttribute("data-counter", "");
        }
      } else if (key === "automationsNote") {
        if (data.automationsInProduction == null) {
          el.hidden = false;
          el.textContent = data.automationsNote || "PLACEHOLDER";
        } else {
          el.hidden = true;
        }
      }
    });

    document.querySelectorAll("[data-socials]").forEach(function (el) {
      if (!data.socials || !data.socials.length) return;
      var frag = document.createDocumentFragment();
      data.socials.forEach(function (item) {
        var span = document.createElement("span");
        span.textContent = item.label;
        frag.appendChild(span);
      });
      el.replaceChildren(frag);
    });
  }

  function initLenis() {
    if (!fine || !window.Lenis) return;
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  }

  function initLineRise() {
    var blocks = document.querySelectorAll("[data-rise]");
    if (!blocks.length) return;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        blocks.forEach(function (block) {
          var lines = block.querySelectorAll(".line-in");
          if (!lines.length) return;
          window.gsap.set(lines, { yPercent: 110 });
          var tween = {
            yPercent: 0,
            duration: 0.85,
            ease: "expo.out",
            stagger: 0.1
          };
          if (block.hasAttribute("data-rise-load") || isInView(block)) {
            window.gsap.to(lines, tween);
          } else {
            tween.scrollTrigger = { trigger: block, start: "top 82%", once: true };
            window.gsap.to(lines, tween);
          }
        });
      });
    });
  }

  function isInView(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
  }

  function initMagnetic() {
    if (!fine) return;
    document.querySelectorAll(".magnet").forEach(function (el) {
      var xTo = window.gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
      var yTo = window.gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
      el.addEventListener("mousemove", function (event) {
        var rect = el.getBoundingClientRect();
        var dx = event.clientX - (rect.left + rect.width / 2);
        var dy = event.clientY - (rect.top + rect.height / 2);
        xTo(Math.max(-8, Math.min(8, dx * 0.25)));
        yTo(Math.max(-6, Math.min(6, dy * 0.3)));
      });
      el.addEventListener("mouseleave", function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  function initInk() {
    document.querySelectorAll("[data-ink]").forEach(function (block) {
      var words = block.querySelectorAll(".inked");
      if (!words.length) return;
      window.gsap.set(words, { opacity: 0 });
      window.gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: {
          trigger: block,
          start: "top 70%",
          end: "bottom 55%",
          scrub: true
        }
      });
    });
  }

  function initWindow() {
    var pin = document.querySelector("[data-window-pin]");
    var frame = document.querySelector("[data-window]");
    if (!pin || !frame) return;
    var img = frame.querySelector("[data-window-img]");
    var caption = frame.querySelector("[data-window-caption]");
    var distance = window.matchMedia("(max-width: 759px)").matches ? "+=70%" : "+=110%";
    if (caption) window.gsap.set(caption, { autoAlpha: 0, y: 16 });
    window.gsap.set(frame, { scale: 0.62, transformOrigin: "center center" });
    if (img) window.gsap.set(img, { yPercent: -4, transformOrigin: "center center" });
    var timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "center center",
        end: distance,
        pin: true,
        scrub: true,
        anticipatePin: 1
      }
    });
    timeline.to(frame, { scale: 1, ease: "none", duration: 1 }, 0);
    if (img) timeline.to(img, { yPercent: 0, ease: "none", duration: 1 }, 0);
    if (caption) timeline.to(caption, { autoAlpha: 1, y: 0, ease: "none", duration: 0.35 }, 0.7);
  }

  function initCounters() {
    document.querySelectorAll("[data-counter]").forEach(function (el) {
      var value = el.textContent.trim();
      if (!/^\d+$/.test(value)) return;
      var label = document.createElement("span");
      label.className = "visually-hidden";
      label.textContent = value;
      var visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      for (var i = 0; i < value.length; i += 1) {
        var digit = document.createElement("span");
        digit.className = "digit";
        var strip = document.createElement("span");
        strip.className = "digit-strip";
        for (var n = 0; n <= 9; n += 1) {
          var cell = document.createElement("span");
          cell.textContent = String(n);
          strip.appendChild(cell);
        }
        digit.appendChild(strip);
        visual.appendChild(digit);
        var cell = strip.firstChild.getBoundingClientRect().height || 64;
        window.gsap.set(strip, { y: 0 });
        window.gsap.to(strip, {
          y: -Number(value.charAt(i)) * cell,
          duration: 0.9,
          ease: "expo.out",
          delay: i * 0.08,
          scrollTrigger: { trigger: el, start: "top 85%", once: true }
        });
      }
      el.textContent = "";
      el.appendChild(label);
      el.appendChild(visual);
    });
  }

  function initMarquee() {
    var root = document.querySelector("[data-marquee]");
    if (!root) return;
    var button = root.querySelector("[data-marquee-toggle]");
    if (!button) return;
    button.addEventListener("click", function () {
      var paused = root.classList.toggle("is-paused");
      button.textContent = paused ? "Play" : "Pause";
    });
  }

  function initIndex() {
    var rows = document.querySelectorAll("[data-index-row]");
    rows.forEach(function (row) {
      var button = row.querySelector(".index-toggle");
      var panel = row.querySelector(".index-panel");
      if (!button || !panel) return;
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", function () {
        var open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", open ? "false" : "true");
        panel.classList.toggle("is-open", !open);
      });
    });

    if (!fine) return;
    var preview = document.querySelector(".cursor-preview");
    if (!preview) return;
    var image = preview.querySelector("img");
    var xTo = motion ? window.gsap.quickTo(preview, "x", { duration: 0.45, ease: "power3.out" }) : null;
    var yTo = motion ? window.gsap.quickTo(preview, "y", { duration: 0.45, ease: "power3.out" }) : null;
    var active = false;

    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        var src = row.getAttribute("data-preview");
        if (src && image.getAttribute("src") !== src) image.setAttribute("src", src);
        preview.style.opacity = "1";
        active = true;
      });
      row.addEventListener("mouseleave", function () {
        preview.style.opacity = "0";
        active = false;
      });
    });

    var list = document.querySelector(".index-list");
    if (!list) return;
    list.addEventListener("mousemove", function (event) {
      if (!active) return;
      var width = 288;
      var height = 216;
      var x = event.clientX + 20;
      var y = event.clientY + 20;
      if (x + width > window.innerWidth - 8) x = event.clientX - width - 20;
      if (y + height > window.innerHeight - 8) y = event.clientY - height - 20;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      if (xTo) {
        xTo(x);
        yTo(y);
      } else {
        preview.style.transform = "translate(" + x + "px," + y + "px)";
      }
    });
  }

  function initLoops() {
    var videos = document.querySelectorAll("video[data-loop]");
    if (!videos.length) return;
    videos.forEach(function (video) {
      var scope = video.closest("figure") || video.parentElement;
      var button = scope.querySelector("[data-loop-toggle]");
      var src = video.getAttribute("data-src");
      var wanted = false;

      function attach() {
        if (!src || video.getAttribute("data-attached") === "1") return;
        video.setAttribute("data-attached", "1");
        var source = document.createElement("source");
        source.src = src;
        source.type = "video/mp4";
        video.appendChild(source);
        video.load();
      }

      function play() {
        if (reduce && !wanted) return;
        attach();
        var pending = video.play();
        if (pending && pending.catch) pending.catch(function () {});
        if (button) button.textContent = "Pause";
      }

      function pause() {
        video.pause();
        if (button) button.textContent = "Play";
      }

      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) play();
            else pause();
          });
        }, { threshold: 0.45 });
        observer.observe(video);
      }

      if (button) {
        button.addEventListener("click", function () {
          if (video.paused) {
            wanted = true;
            play();
          } else {
            wanted = false;
            pause();
          }
        });
      }
    });
  }

  function field(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : "";
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validHours(value) {
    if (!/^\d+(\.\d+)?$/.test(value)) return false;
    var number = Number(value);
    return number >= 0 && number <= 168;
  }

  function validWebsite(value) {
    if (!value) return true;
    return /^https?:\/\/[^\s]+\.[^\s]+$/.test(value);
  }

  function buildPayload(form) {
    var tracking = window.ngxGetTrackingPayload ? window.ngxGetTrackingPayload() : {};
    var staff = form.querySelector('input[name="staff_size"]:checked');
    var config = window.NGX_FORM || {};
    var payload = {
      name: field(form, "name"),
      email: field(form, "email"),
      phone: "",
      company: field(form, "company"),
      industry: "",
      revenue: "",
      message: field(form, "message"),
      website: field(form, "website"),
      staff_size: staff ? staff.value : "",
      role: field(form, "role"),
      admin_hours_per_week: field(form, "admin_hours_per_week"),
      source: config.source || "ngx-site-v1"
    };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "li_fat_id", "landing_path"].forEach(function (key) {
      payload[key] = tracking[key] || "";
    });
    return payload;
  }

  window.ngxBuildAuditPayload = buildPayload;

  function initForm() {
    var form = document.getElementById("auditForm");
    if (!form) return;
    var config = window.NGX_FORM || {};
    if (config.endpoint) form.setAttribute("action", config.endpoint);
    form.setAttribute("novalidate", "");

    var progress = form.querySelector("[data-progress]");
    var bar = form.querySelector("[data-progress-bar]");
    var alertBox = document.getElementById("form-alert");
    var confirmBox = document.getElementById("audit-confirm");
    var refEl = document.getElementById("audit-ref");
    var button = document.getElementById("audit-submit");
    var body = form.querySelector("[data-form-body]");
    var requiredNames = ["name", "email", "company", "role", "admin_hours_per_week"];

    function staffDone() {
      return !!form.querySelector('input[name="staff_size"]:checked');
    }

    function completedCount() {
      var count = 0;
      if (field(form, "name")) count += 1;
      if (validEmail(field(form, "email"))) count += 1;
      if (field(form, "company")) count += 1;
      if (staffDone()) count += 1;
      if (field(form, "role")) count += 1;
      if (validHours(field(form, "admin_hours_per_week"))) count += 1;
      return count;
    }

    function paintProgress() {
      var count = completedCount();
      var max = 6;
      if (progress) {
        progress.setAttribute("aria-valuenow", String(count));
        progress.setAttribute("aria-valuemax", String(max));
      }
      if (bar) bar.style.transform = "scaleX(" + (count / max) + ")";
    }

    function messageFor(name) {
      if (name === "name" && !field(form, "name")) return "Error: Enter your name.";
      if (name === "email" && !validEmail(field(form, "email"))) return "Error: Enter an email address in the format you@example.com.";
      if (name === "company" && !field(form, "company")) return "Error: Enter the company name.";
      if (name === "website" && !validWebsite(field(form, "website"))) return "Error: Enter a full address, such as https://example.com.";
      if (name === "staff_size" && !staffDone()) return "Error: Choose a staff size.";
      if (name === "role" && !field(form, "role")) return "Error: Enter your role.";
      if (name === "admin_hours_per_week" && !validHours(field(form, "admin_hours_per_week"))) return "Error: Enter admin hours per week as a number from 0 to 168.";
      return "";
    }

    function groupOf(name) {
      return form.querySelector('[data-field="' + name + '"]');
    }

    function showFieldError(name) {
      var group = groupOf(name);
      if (!group) return;
      var message = messageFor(name);
      var error = group.querySelector(".error");
      var control = group.querySelector("input, textarea");
      if (message) {
        group.classList.add("is-invalid");
        if (error) error.textContent = message;
        if (control) {
          control.setAttribute("aria-invalid", "true");
          var ids = (control.getAttribute("data-described") || "").split(/\s+/).filter(Boolean);
          if (error && ids.indexOf(error.id) === -1) ids.push(error.id);
          if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
        }
      } else {
        group.classList.remove("is-invalid");
        if (control) {
          control.setAttribute("aria-invalid", "false");
          var base = control.getAttribute("data-described") || "";
          if (base) control.setAttribute("aria-describedby", base);
          else control.removeAttribute("aria-describedby");
        }
      }
    }

    function validateAll() {
      var names = requiredNames.concat(["website", "staff_size"]);
      var invalid = [];
      names.forEach(function (name) {
        showFieldError(name);
        if (messageFor(name)) invalid.push(name);
      });
      return invalid;
    }

    requiredNames.concat(["website"]).forEach(function (name) {
      var control = form.querySelector('[name="' + name + '"]');
      if (!control) return;
      control.addEventListener("blur", function () {
        if (!control.value.trim() && name !== "website" && control.dataset.touched !== "1") return;
        control.dataset.touched = "1";
        showFieldError(name);
      });
      control.addEventListener("input", function () {
        control.dataset.touched = "1";
        if (groupOf(name) && groupOf(name).classList.contains("is-invalid")) showFieldError(name);
        paintProgress();
      });
    });

    form.querySelectorAll('input[name="staff_size"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        showFieldError("staff_size");
        paintProgress();
      });
    });

    form.addEventListener("submit", function (event) {
      if (!window.fetch) return;
      event.preventDefault();
      var honeypot = form.querySelector('[name="fax_number"]');
      if (honeypot && honeypot.value) {
        if (alertBox) {
          alertBox.textContent = "Error: Something went wrong. Email hello@ngx.agency and we will set it up.";
          alertBox.classList.add("is-on");
        }
        return;
      }
      var invalid = validateAll();
      paintProgress();
      if (invalid.length) {
        if (alertBox) {
          alertBox.textContent = "Error: Some fields need attention. The note under each one says what to fix.";
          alertBox.classList.add("is-on");
          alertBox.setAttribute("tabindex", "-1");
          alertBox.focus();
        }
        var first = groupOf(invalid[0]);
        var focusEl = first ? first.querySelector("input, textarea") : null;
        if (focusEl) focusEl.focus();
        return;
      }
      if (alertBox) alertBox.classList.remove("is-on");

      var payload = buildPayload(form);
      window.__NGX_LAST_PAYLOAD = payload;
      var endpoint = (config.endpoint) || form.getAttribute("action");
      if (button) {
        button.disabled = true;
        var label = button.querySelector(".roll span");
        if (label) label.textContent = "Sending...";
      }

      window.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error("submit failed");
        return response.json().catch(function () { return {}; });
      }).then(function (body) {
        var serverRef = body && (body.reference || body.id);
        var ref = (typeof serverRef === "string" && /^[A-Za-z0-9-]{4,24}$/.test(serverRef)) ? serverRef : makeRef();
        showConfirm(ref);
        if (window.ngxTrackLead) window.ngxTrackLead({ source: payload.source });
      }).catch(function () {
        if (button) {
          button.disabled = false;
          button.querySelectorAll(".roll span").forEach(function (span) {
            span.textContent = "Request the audit";
          });
        }
        if (alertBox) {
          alertBox.textContent = "Error: Something went wrong. Email hello@ngx.agency and we will set it up.";
          alertBox.classList.add("is-on");
          alertBox.focus();
        }
      });
    });

    function showConfirm(ref) {
      if (body) body.hidden = true;
      if (confirmBox) {
        confirmBox.classList.add("is-on");
        confirmBox.focus();
      }
      if (refEl) scramble(refEl, ref);
    }

    paintProgress();
  }

  function makeRef() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var bytes = new Uint8Array(6);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    var out = "NGX-";
    for (var i = 0; i < bytes.length; i += 1) out += alphabet[bytes[i] % alphabet.length];
    return out;
  }

  function scramble(el, finalText) {
    if (reduce) {
      el.textContent = finalText;
      return;
    }
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var frame = 0;
    var total = 18;
    var timer = window.setInterval(function () {
      frame += 1;
      var out = "";
      for (var i = 0; i < finalText.length; i += 1) {
        var ch = finalText.charAt(i);
        if (ch === "-") {
          out += "-";
          continue;
        }
        if (frame >= total || frame > (i + 1) * 2) out += ch;
        else out += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      el.textContent = out;
      if (frame >= total) {
        window.clearInterval(timer);
        el.textContent = finalText;
      }
    }, 40);
  }

  function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var stored = {};
      try {
        stored = JSON.parse(window.sessionStorage.getItem("ngx_utm_payload") || "{}") || {};
      } catch (error) {
        stored = {};
      }
      var updated = false;
      TRACKED_KEYS.forEach(function (key) {
        var value = params.get(key);
        if (value) {
          stored[key] = value;
          updated = true;
        } else if (typeof stored[key] === "undefined") {
          stored[key] = "";
        }
      });
      if (!stored.landing_path) {
        stored.landing_path = window.location.pathname || "/";
        updated = true;
      }
      if (updated || !window.sessionStorage.getItem("ngx_utm_payload")) {
        window.sessionStorage.setItem("ngx_utm_payload", JSON.stringify(stored));
      }
    } catch (error) {
      return;
    }
  }

  window.ngxGetTrackingPayload = function () {
    var fallback = {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
      fbclid: "",
      gclid: "",
      li_fat_id: "",
      landing_path: window.location.pathname || "/"
    };
    try {
      var raw = JSON.parse(window.sessionStorage.getItem("ngx_utm_payload") || "{}") || {};
      Object.keys(fallback).forEach(function (key) {
        if (raw[key]) fallback[key] = raw[key];
      });
    } catch (error) {
      return fallback;
    }
    return fallback;
  };

  function consentValue() {
    try {
      return window.localStorage.getItem("ngx_consent") || "";
    } catch (error) {
      return "";
    }
  }

  function idSet(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function injectScript(src) {
    var script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function loadTrackers() {
    var cfg = window.NGX_TRACKING || {};
    if (consentValue() !== "granted") return;
    if (window.navigator && window.navigator.globalPrivacyControl) return;

    if (idSet(cfg.metaPixelId)) {
      window.fbq = window.fbq || function () {
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
      window.fbq.queue = window.fbq.queue || [];
      injectScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", cfg.metaPixelId);
      window.fbq("track", "PageView");
    }

    if (idSet(cfg.tiktokPixelId)) {
      window.ttq = window.ttq || [];
      injectScript("https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + encodeURIComponent(cfg.tiktokPixelId));
    }

    if (idSet(cfg.ga4MeasurementId)) {
      injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4MeasurementId));
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", cfg.ga4MeasurementId);
    }

    if (idSet(cfg.googleAdsId) && idSet(cfg.googleAdsLabel)) {
      if (!idSet(cfg.ga4MeasurementId)) {
        injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.googleAdsId));
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
      }
      window.gtag("config", cfg.googleAdsId);
    }

    if (idSet(cfg.clarityProjectId)) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      injectScript("https://www.clarity.ms/tag/" + encodeURIComponent(cfg.clarityProjectId));
    }

    if (idSet(cfg.searchConsoleVerification) && !document.querySelector('meta[name="google-site-verification"]')) {
      var meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = cfg.searchConsoleVerification.trim();
      document.head.appendChild(meta);
    }
  }

  window.ngxTrackLead = function (lead) {
    var cfg = window.NGX_TRACKING || {};
    if (consentValue() !== "granted") return;
    lead = lead || {};
    if (idSet(cfg.metaPixelId) && typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: lead.source || "ngx-site-v1" });
    }
    if (idSet(cfg.tiktokPixelId) && window.ttq && typeof window.ttq.track === "function") {
      window.ttq.track("SubmitForm");
    }
    if (idSet(cfg.ga4MeasurementId) && typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", { event_category: lead.source || "ngx-site-v1" });
    }
    if (idSet(cfg.googleAdsId) && idSet(cfg.googleAdsLabel) && typeof window.gtag === "function") {
      window.gtag("event", "conversion", { send_to: cfg.googleAdsId + "/" + cfg.googleAdsLabel });
    }
  };

  function initTracking() {
    captureAttribution();
    var banner = document.getElementById("consent");
    var accept = document.getElementById("consent-accept");
    var decline = document.getElementById("consent-decline");
    var gpc = window.navigator && window.navigator.globalPrivacyControl;

    function store(value) {
      try {
        window.localStorage.setItem("ngx_consent", value);
      } catch (error) {
        return;
      }
    }

    if (banner && !consentValue() && !gpc) banner.classList.add("is-on");
    if (accept) {
      accept.addEventListener("click", function () {
        store("granted");
        if (banner) banner.classList.remove("is-on");
        loadTrackers();
      });
    }
    if (decline) {
      decline.addEventListener("click", function () {
        store("denied");
        if (banner) banner.classList.remove("is-on");
      });
    }
    if (consentValue() === "granted") loadTrackers();
  }

  window.addEventListener("load", function () {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
})();

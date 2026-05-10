/* DIGIY LOC — Contact WhatsApp public
   Version propre unifiée.
   Peut être posée à la racine: contact-whatsapp.js
   ou dans: assets/js/contact-whatsapp.js

   Rôle:
   - attend un formulaire id="locLeadForm"
   - prépare un message WhatsApp clair
   - ne transporte pas de téléphone dans l’URL de la page
   - masque les références sensibles
   - fonctionne avec picked_slug / picked_room_slug / picked_phone / picked_title
*/
(function () {
  "use strict";

  const DEFAULT_TEAM_WA = "221771342889";
  const cfg = window.DIGIY_CONTACT_CONFIG || {};

  const TEAM_WA = digits(cfg.phone || cfg.fallbackPhone || DEFAULT_TEAM_WA);
  const MODULE = String(cfg.module || "LOC").trim().toUpperCase();
  const API_BASE = String(cfg.apiBase || "").trim();
  const BUSINESS_ID = String(cfg.businessId || "").trim();

  function $(id) {
    return document.getElementById(id);
  }

  function safe(value) {
    return String(value || "").trim();
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isSensitiveSlug(value) {
    const s = safe(value).toLowerCase();
    return /^loc-\d{7,}/.test(s) || /\d{9,}/.test(s);
  }

  function safeRef(value) {
    const s = safe(value);
    if (!s) return "";
    if (isSensitiveSlug(s)) return "Référence logement sécurisée";
    return s;
  }

  function cleanPageUrl() {
    try {
      const u = new URL(location.href);
      let changed = false;

      [
        "phone",
        "tel",
        "wa",
        "whatsapp",
        "owner_phone",
        "client_phone",
        "guest_phone",
        "p_phone",
        "token",
        "pin",
        "pin4"
      ].forEach((key) => {
        if (u.searchParams.has(key)) {
          u.searchParams.delete(key);
          changed = true;
        }
      });

      ["slug", "room_slug"].forEach((key) => {
        const v = u.searchParams.get(key);
        if (v && isSensitiveSlug(v)) {
          u.searchParams.delete(key);
          changed = true;
        }
      });

      if (changed) {
        history.replaceState({}, "", u.pathname + u.search + u.hash);
      }
    } catch (_) {}
  }

  function field(form, names) {
    for (const name of names) {
      const el =
        form.querySelector(`[name="${name}"]`) ||
        form.querySelector(`#${name}`);

      if (el) return safe(el.value);
    }

    return "";
  }

  function pickedPhone(form) {
    const fromForm = field(form, ["picked_phone", "pickedPhone"]);
    return digits(fromForm) || TEAM_WA;
  }

  function pickedSlug(form) {
    return field(form, [
      "picked_slug",
      "picked_room_slug",
      "pickedRoomSlug",
      "room_slug",
      "slug"
    ]);
  }

  function pickedTitle(form) {
    return field(form, [
      "picked_title",
      "pickedTitle",
      "logement_title",
      "room_title",
      "title"
    ]) || "Logement DIGIY LOC";
  }

  function buildMessage(form) {
    const title = pickedTitle(form);
    const ref = safeRef(pickedSlug(form));

    const name = field(form, ["name", "leadName", "guestName"]);
    const dates = field(form, ["dates", "leadDates"]);
    const people = field(form, ["people", "leadPeople", "guestCount"]);
    const budget = field(form, ["budget", "leadBudget", "guestBudget"]);
    const note = field(form, ["message", "note", "guestNote", "leadMessage"]);

    return [
      "Bonjour 👋",
      "Je viens de DIGIY LOC.",
      "",
      "LOGEMENT",
      "• Nom : " + (title || "Logement DIGIY LOC"),
      ref ? "• Référence : " + ref : "",
      "",
      "MA DEMANDE",
      "• Prénom : " + (name || "à préciser"),
      "• Dates : " + (dates || "à préciser"),
      "• Personnes : " + (people || "à préciser"),
      "• Budget : " + (budget || "non précisé"),
      note ? "• Message : " + note : "",
      "",
      "Pouvez-vous me confirmer la disponibilité et le tarif ?"
    ].filter(Boolean).join("\n");
  }

  async function trackLead(form, phone, message) {
    if (!API_BASE || !BUSINESS_ID) return;

    try {
      await fetch(API_BASE.replace(/\/+$/, "") + "/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          business_id: BUSINESS_ID,
          module: MODULE,
          channel: "whatsapp_link",
          customer_name: field(form, ["name", "leadName", "guestName"]),
          customer_need: message,
          meta: {
            room_ref: safeRef(pickedSlug(form)),
            room_title: pickedTitle(form),
            to: phone
          }
        })
      });
    } catch (_) {
      /* Tracking best-effort seulement. WhatsApp reste prioritaire. */
    }
  }

  function openWhatsApp(phone, message) {
    const p = digits(phone) || TEAM_WA;
    if (!p) return false;

    const url =
      "https://wa.me/" +
      p +
      "?text=" +
      encodeURIComponent(message || "");

    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function bindForm(form) {
    if (!form || form.dataset.digiyContactBound === "1") return;

    form.dataset.digiyContactBound = "1";

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const phone = pickedPhone(form);
      const message = buildMessage(form);

      await trackLead(form, phone, message);
      openWhatsApp(phone, message);
    });
  }

  function bindPickButtons() {
    document.querySelectorAll("[data-digiy-pick-room]").forEach((btn) => {
      if (btn.dataset.digiyPickBound === "1") return;

      btn.dataset.digiyPickBound = "1";

      btn.addEventListener("click", () => {
        const form = $("locLeadForm");
        if (!form) return;

        const slug = safe(btn.dataset.slug || btn.dataset.roomSlug);
        const title = safe(
          btn.dataset.title ||
          btn.dataset.name ||
          "Logement DIGIY LOC"
        );
        const phone = digits(btn.dataset.phone || btn.dataset.whatsapp || "");

        const slugInput =
          form.querySelector('[name="picked_slug"]') ||
          form.querySelector('[name="picked_room_slug"]') ||
          $("pickedSlug") ||
          $("pickedRoomSlug");

        const titleInput =
          form.querySelector('[name="picked_title"]') ||
          $("pickedTitle");

        const phoneInput =
          form.querySelector('[name="picked_phone"]') ||
          $("pickedPhone");

        if (slugInput) slugInput.value = safeRef(slug);
        if (titleInput) titleInput.value = title;
        if (phoneInput && phone) phoneInput.value = phone;
      });
    });
  }

  function boot() {
    cleanPageUrl();
    bindForm($("locLeadForm"));
    bindPickButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.DIGIY_LOC_CONTACT = {
    cleanPageUrl,
    bindForm,
    buildMessage,
    openWhatsApp
  };
})();

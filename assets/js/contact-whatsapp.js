/* DIGIY — CONTACT WHATSAPP (V1 sans WhatsApp API)
   - dépend de window.DIGIY_CONTACT_CONFIG
   - attend un formulaire id="locLeadForm"
   - si un logement est choisi: picked_phone/picked_slug
*/

(function () {
  const cfg = window.DIGIY_CONTACT_CONFIG || {};
  const apiBase    = (cfg.apiBase || "").toString().trim();
  const module     = (cfg.module || "LOC").toString().trim();
  const businessId = (cfg.businessId || "").toString().trim();
  const fallbackPhone = (cfg.phone || "").toString().trim(); // digits only preferred

  const form = document.getElementById("locLeadForm");
  if (!form) return;

  const enc = (s) => encodeURIComponent(String(s || ""));
  const safe = (v) => (v || "").toString().trim();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    const pickedSlug  = safe(fd.get("picked_slug"));
    const pickedPhone = safe(fd.get("picked_phone"));

    const name   = safe(fd.get("name"));
    const dates  = safe(fd.get("dates"));
    const people = safe(fd.get("people"));
    const budget = safe(fd.get("budget"));

    const finalPhone = (pickedPhone || fallbackPhone).toString();
    const digits = finalPhone.replace(/\D/g, "");
    if (!digits) return;

    // 1) tracking (best-effort)
    if (apiBase && businessId) {
      try {
        await fetch(`${apiBase}/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            module,
            customer_name: name,
            customer_need: `Logement: ${pickedSlug || "-"} | Dates: ${dates} | Personnes: ${people} | Budget: ${budget || "-"}`,
            channel: "whatsapp_link",
            meta: { pickedSlug, dates, people, budget, to: digits }
          })
        });
      } catch (_) {}
    }

    // 2) message WhatsApp pré-rempli (court)
    const msg =
`Bonjour 👋 je viens de DIGIY LOC.
• Logement: ${pickedSlug || "-"}
• Prénom: ${name}
• Dates: ${dates}
• Personnes: ${people}
• Budget: ${budget || "-"}

Pouvez-vous me confirmer la disponibilité et le tarif ?`;

    // 3) open wa.me
    const url = `https://wa.me/${digits}?text=${enc(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();


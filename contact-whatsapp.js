<!-- BLOC CONTACT LOC (V1 sans WhatsApp API) -->
<section class="digiy-contact">
  <h3>Contacter sur WhatsApp</h3>
  <p>Réponse rapide. Paiement direct. 0% commission.</p>

  <form id="locLeadForm" class="digiy-form">
    <label>
      Votre prénom
      <input name="name" type="text" placeholder="Ex: Awa" autocomplete="given-name" required>
    </label>

    <label>
      Dates (arrivée / départ)
      <input name="dates" type="text" placeholder="Ex: 12/03 - 18/03" required>
    </label>

    <label>
      Nombre de personnes
      <input name="people" type="number" min="1" placeholder="Ex: 2" required>
    </label>

    <label>
      Budget (facultatif)
      <input name="budget" type="text" placeholder="Ex: 25 000 FCFA / nuit">
    </label>

    <button type="submit">Ouvrir WhatsApp</button>
    <small>En cliquant, vous ouvrez WhatsApp avec un message déjà prêt.</small>
  </form>
</section>

<script>
/** CONFIG LOC **/
const DIGIY_API_BASE = "https://api.digiylyfe.com"; // ton backend
const PRO_PHONE_E164 = "22177XXXXXXX";              // téléphone pro sans + (format wa.me)
const BUSINESS_ID = "LOC_BUSINESS_ID";              // id vitrine/fiche
const MODULE = "LOC";

function enc(s){ return encodeURIComponent(s); }
function safe(v){ return (v || "").toString().trim(); }

document.getElementById("locLeadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);

  const name   = safe(fd.get("name"));
  const dates  = safe(fd.get("dates"));
  const people = safe(fd.get("people"));
  const budget = safe(fd.get("budget"));

  // 1) Tracking DIGIY (on n’empêche pas WhatsApp si ça échoue)
  try{
    await fetch(`${DIGIY_API_BASE}/leads`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        business_id: BUSINESS_ID,
        module: MODULE,
        customer_name: name,
        customer_need: `Dates: ${dates} | Personnes: ${people} | Budget: ${budget || "-"}`,
        channel: "whatsapp_link",
        meta: { dates, people, budget }
      })
    });
  } catch(err){}

  // 2) Message WhatsApp pré-rempli (court + clair)
  const msg =
`Bonjour 👋 je viens de votre vitrine DIGIY.
• Prénom: ${name}
• Dates: ${dates}
• Personnes: ${people}
• Budget: ${budget || "-"}

Pouvez-vous me confirmer la disponibilité et le tarif ?`;

  // 3) Ouvre WhatsApp (sans API)
  const url = `https://wa.me/${PRO_PHONE_E164}?text=${enc(msg)}`;
  window.open(url, "_blank");
});
</script>

<style>
/* style minimal (tu peux l’intégrer à ton thème DIGIY) */
.digiy-contact{padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px}
.digiy-form{display:grid;gap:10px;margin-top:10px}
.digiy-form label{display:grid;gap:6px;font-size:14px}
.digiy-form input{padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#fff}
.digiy-form button{padding:12px 14px;border-radius:12px;border:0;font-weight:700;cursor:pointer}
.digiy-form small{opacity:.8}
</style>

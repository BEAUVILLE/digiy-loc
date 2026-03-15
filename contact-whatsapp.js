<!-- BLOC CONTACT LOC — rail public DIGIY -->
<section class="digiy-contact">
  <h3>Contacter sur WhatsApp</h3>
  <p>Réponse rapide. Paiement direct. 0% commission.</p>

  <form id="locLeadForm" class="digiy-form">
    <input type="hidden" name="picked_slug" id="pickedSlug">
    <input type="hidden" name="picked_phone" id="pickedPhone">
    <input type="hidden" name="picked_title" id="pickedTitle">

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
  const TEAM_WA = "+221771342889";

  function waDigits(phone){
    return String(phone || "").replace(/\D/g, "");
  }

  function openWa(phone, message){
    const digits = waDigits(phone);
    if (!digits) return false;
    const url = "https://wa.me/" + digits + "?text=" + encodeURIComponent(message || "");
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function safe(v){
    return String(v || "").trim();
  }

  function bindLocLeadFormFromRow(row){
    const pickedSlug = document.getElementById("pickedSlug");
    const pickedPhone = document.getElementById("pickedPhone");
    const pickedTitle = document.getElementById("pickedTitle");

    if (!pickedSlug || !pickedPhone || !pickedTitle) return;

    pickedSlug.value = safe(row?.slug);
    pickedPhone.value = safe(row?.phone) || TEAM_WA;
    pickedTitle.value = safe(row?.nom || row?.title || "Logement");
  }

  document.getElementById("locLeadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    const pickedSlug  = safe(fd.get("picked_slug"));
    const pickedPhone = safe(fd.get("picked_phone")) || TEAM_WA;
    const pickedTitle = safe(fd.get("picked_title")) || "Logement";

    const name   = safe(fd.get("name"));
    const dates  = safe(fd.get("dates"));
    const people = safe(fd.get("people"));
    const budget = safe(fd.get("budget"));

    const msg = [
      "Bonjour 👋",
      "Je vous contacte via DIGIY LOC.",
      `Logement : ${pickedTitle}`,
      pickedSlug ? `Référence : ${pickedSlug}` : "",
      `Prénom : ${name || "à préciser"}`,
      `Dates : ${dates || "à préciser"}`,
      `Personnes : ${people || "à préciser"}`,
      `Budget : ${budget || "non précisé"}`
    ].filter(Boolean).join("\n");

    try{
      if (window.sb && pickedSlug) {
        await window.sb
          .from("loc_reservation_requests")
          .insert({
            pin_slug: pickedSlug || null,
            logement_title: pickedTitle || null,
            owner_phone: pickedPhone || null
          });
      }
    }catch(err){
      console.warn("[DIGIY LOC] tracking lead ignoré :", err?.message || err);
    }

    openWa(pickedPhone, msg);
  });
</script>

<style>
  .digiy-contact{
    padding:14px;
    border:1px solid rgba(255,255,255,.12);
    border-radius:16px;
  }
  .digiy-form{
    display:grid;
    gap:10px;
    margin-top:10px;
  }
  .digiy-form label{
    display:grid;
    gap:6px;
    font-size:14px;
  }
  .digiy-form input{
    padding:12px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.14);
    background:rgba(0,0,0,.25);
    color:#fff;
  }
  .digiy-form button{
    padding:12px 14px;
    border-radius:12px;
    border:0;
    font-weight:700;
    cursor:pointer;
  }
  .digiy-form small{
    opacity:.8;
  }
</style>

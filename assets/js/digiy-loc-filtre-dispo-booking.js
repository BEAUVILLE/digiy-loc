/*
  DIGIY LOC — filtre disponibilité façon Booking
  À charger dans BEAUVILLE/digiy-loc/index.html APRÈS le script principal de la galerie LOC.

  Effet :
  - ajoute Date arrivée + Date départ dans le moteur public
  - lit digiy_loc_availability dans Supabase
  - si un logement est fermé / réservé / occupé / bloqué sur la période, il disparaît des résultats
  - la fiche publique reste intacte : elle présente seulement le logement
*/

(function(){
  "use strict";

  if (window.DIGIY_LOC_PUBLIC_AVAILABILITY_PATCH) return;
  window.DIGIY_LOC_PUBLIC_AVAILABILITY_PATCH = true;

  const DATE_IN_ID = "digiyLocDateIn";
  const DATE_OUT_ID = "digiyLocDateOut";

  function ymd(value){
    if(!value) return "";
    const s = String(value).trim().slice(0, 10);
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const d = new Date(value);
    if(isNaN(d.getTime())) return "";
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dayNum(value){
    const s = ymd(value);
    if(!s) return NaN;
    const d = new Date(s + "T00:00:00");
    if(isNaN(d.getTime())) return NaN;
    return Math.floor(d.getTime() / 86400000);
  }

  function norm(value){
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function getDateRange(){
    const start = ymd(document.getElementById(DATE_IN_ID)?.value || "");
    const end = ymd(document.getElementById(DATE_OUT_ID)?.value || "");

    if(!start && !end){
      return { active:false, valid:true, start:"", end:"" };
    }

    if(!start || !end){
      return { active:true, valid:false, start, end };
    }

    if(dayNum(end) <= dayNum(start)){
      return { active:true, valid:false, start, end };
    }

    return {
      active:true,
      valid:true,
      start,
      end
    };
  }

  function isBlockingRow(row){
    if(!row || typeof row !== "object") return false;

    const status = norm(
      row.status ||
      row.state ||
      row.etat ||
      row.availability ||
      row.disponibilite ||
      row.disponibilite_status ||
      ""
    );

    const explicitClosed =
      row.is_closed === true ||
      row.closed === true ||
      row.is_blocked === true ||
      row.blocked === true ||
      row.is_booked === true ||
      row.booked === true ||
      row.is_reserved === true ||
      row.reserved === true ||
      row.is_occupied === true ||
      row.occupied === true;

    const byStatus = [
      "closed",
      "ferme",
      "fermee",
      "fermeture",
      "bloque",
      "bloquee",
      "blocked",
      "reserved",
      "reserve",
      "reservee",
      "booked",
      "occupe",
      "occupee",
      "occupied",
      "indisponible",
      "cleaning",
      "nettoyage",
      "menage"
    ].some(token => status.includes(token));

    return !!(explicitClosed || byStatus);
  }

  function rowSlug(row){
    return String(
      row?.slug ||
      row?.room_slug ||
      row?.pin_slug ||
      row?.logement_slug ||
      row?.place_slug ||
      row?.workspace_slug ||
      ""
    ).trim();
  }

  function pinSlug(pin){
    try{
      if(typeof canonicalRoomSlug === "function"){
        return String(canonicalRoomSlug(pin) || "").trim();
      }
    }catch(_){}

    return String(pin?.room_slug || pin?.slug || pin?.legacy_slug || "").trim();
  }

  function slugAliases(slug){
    const s = norm(slug);
    const aliases = new Set([s]);

    if(s === "chez-baptiste" || s.includes("baptiste")){
      aliases.add("chez-baptiste");
      aliases.add("appartement-chez-baptiste");
      aliases.add("chez baptiste");
      aliases.add("baptiste");
    }

    return aliases;
  }

  function injectDateControls(){
    if(document.getElementById(DATE_IN_ID) || document.getElementById(DATE_OUT_ID)) return;

    const gridEl = document.querySelector(".filter-grid");
    if(!gridEl) return;

    const css = document.createElement("style");
    css.textContent = `
      @media(min-width:981px){
        .filter-grid{
          grid-template-columns:1.15fr .82fr .72fr .72fr auto auto !important;
        }
      }

      .digiy-date-control{
        min-height:50px;
        width:100%;
        border-radius:14px;
        border:1px solid var(--line-2);
        background:rgba(2,6,23,.62);
        color:var(--text);
        padding:0 14px;
        font-weight:900;
      }

      .digiy-date-control:focus{
        border-color:rgba(238,200,126,.6);
        box-shadow:0 0 0 4px rgba(238,200,126,.10);
      }

      .digiy-date-control::-webkit-calendar-picker-indicator{
        filter:invert(1);
        opacity:.85;
      }

      .digiy-dispo-line{
        grid-column:1/-1;
        border:1px solid rgba(238,200,126,.22);
        background:rgba(238,200,126,.08);
        color:var(--brand-2);
        border-radius:14px;
        padding:10px 12px;
        font-size:13px;
        font-weight:900;
        line-height:1.35;
        display:none;
      }

      .digiy-dispo-line.show{display:block}

      .digiy-dispo-line.bad{
        border-color:rgba(239,68,68,.34);
        background:rgba(239,68,68,.10);
        color:#fecaca;
      }
    `;
    document.head.appendChild(css);

    const dateIn = document.createElement("input");
    dateIn.id = DATE_IN_ID;
    dateIn.className = "digiy-date-control";
    dateIn.type = "date";
    dateIn.title = "Date d’arrivée";
    dateIn.setAttribute("aria-label", "Date d’arrivée");

    const dateOut = document.createElement("input");
    dateOut.id = DATE_OUT_ID;
    dateOut.className = "digiy-date-control";
    dateOut.type = "date";
    dateOut.title = "Date de départ";
    dateOut.setAttribute("aria-label", "Date de départ");

    const line = document.createElement("div");
    line.id = "digiyDispoLine";
    line.className = "digiy-dispo-line";
    line.textContent = "Choisis des dates : les logements fermés ou réservés disparaissent des résultats.";

    const kind = document.getElementById("kind");

    if(kind && kind.parentNode === gridEl){
      kind.insertAdjacentElement("afterend", dateOut);
      kind.insertAdjacentElement("afterend", dateIn);
    }else{
      gridEl.insertBefore(dateIn, gridEl.children[2] || null);
      gridEl.insertBefore(dateOut, gridEl.children[3] || null);
    }

    gridEl.appendChild(line);

    [dateIn, dateOut].forEach(input => {
      input.addEventListener("change", function(){
        if(typeof render === "function") render();
      });

      input.addEventListener("input", function(){
        if(typeof render === "function") render();
      });
    });

    const reset = document.getElementById("btnReset");

    if(reset && !reset.dataset.digiyDispoPatched){
      reset.dataset.digiyDispoPatched = "1";

      reset.addEventListener("click", function(){
        setTimeout(function(){
          const a = document.getElementById(DATE_IN_ID);
          const b = document.getElementById(DATE_OUT_ID);

          if(a) a.value = "";
          if(b) b.value = "";

          setDispoLine("", "");

          if(typeof render === "function") render();
        }, 0);
      });
    }
  }

  function setDispoLine(text, mode){
    const line = document.getElementById("digiyDispoLine");
    if(!line) return;

    line.textContent = text || "";
    line.className =
      "digiy-dispo-line" +
      (text ? " show" : "") +
      (mode === "bad" ? " bad" : "");
  }

  async function fetchBlockedSlugsForRange(range){
    const blocked = new Set();

    if(!range.active || !range.valid) return blocked;

    let sb = null;

    try{
      sb = typeof getSb === "function" ? getSb() : null;
    }catch(e){
      console.warn("[DIGIY LOC dispo] Supabase non disponible.", e?.message || e);
      return blocked;
    }

    if(!sb || typeof sb.from !== "function") return blocked;

    const start = range.start;
    const end = range.end;

    const attempts = [
      async () => sb
        .from("digiy_loc_availability")
        .select("*")
        .gte("date", start)
        .lte("date", end),

      async () => sb
        .from("loc_availability")
        .select("*")
        .gte("date", start)
        .lte("date", end),

      async () => sb
        .rpc("digiy_loc_public_unavailable_slugs", {
          p_start: start,
          p_end: end
        }),

      async () => sb
        .rpc("digiy_loc_unavailable_slugs", {
          p_start: start,
          p_end: end
        })
    ];

    for(const attempt of attempts){
      try{
        const { data, error } = await attempt();

        if(error) throw error;

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.rows)
              ? data.rows
              : Array.isArray(data?.slugs)
                ? data.slugs.map(slug => ({ slug, status:"blocked" }))
                : [];

        rows.forEach(row => {
          const s = typeof row === "string" ? row : rowSlug(row);
          if(!s) return;

          if(typeof row === "string" || isBlockingRow(row)){
            slugAliases(s).forEach(alias => blocked.add(alias));
          }
        });

        console.log("[DIGIY LOC dispo] Source disponibilité lue.", {
          start,
          end,
          blocked:[...blocked]
        });

        return blocked;
      }catch(e){
        console.warn("[DIGIY LOC dispo] Source disponibilité ignorée :", e?.message || e);
      }
    }

    return blocked;
  }

  function filterPinsByBlockedSlugs(list, blocked){
    if(!blocked || !blocked.size) return list;

    return (list || []).filter(pin => {
      const s = pinSlug(pin);
      const aliases = slugAliases(s);

      for(const alias of aliases){
        if(blocked.has(alias)) return false;
      }

      const title = norm(pin?.title || "");

      if(title.includes("baptiste") && (blocked.has("chez-baptiste") || blocked.has("baptiste"))){
        return false;
      }

      return true;
    });
  }

  async function filterAvailableBySearchDates(list){
    const range = getDateRange();

    if(!range.active){
      setDispoLine("", "");
      return list;
    }

    if(!range.valid){
      setDispoLine("Dates à corriger : indique une arrivée et un départ après l’arrivée.", "bad");
      return [];
    }

    setDispoLine("Vérification des disponibilités en cours…", "");

    const blocked = await fetchBlockedSlugsForRange(range);
    const filtered = filterPinsByBlockedSlugs(list, blocked);

    const hidden = (list || []).length - filtered.length;

    if(hidden > 0){
      setDispoLine(`${hidden} logement(s) fermé(s) ou réservé(s) retiré(s) des résultats pour ces dates.`, "");
    }else{
      setDispoLine("Aucun logement bloqué trouvé sur ces dates. Les disponibilités restent confirmées par le propriétaire.", "");
    }

    return filtered;
  }

  function patchRender(){
    if(typeof render !== "function") {
      console.warn("[DIGIY LOC dispo] Fonction render introuvable. Charge ce fichier après le script principal LOC.");
      return false;
    }

    const originalRender = render;

    render = async function(){
      try{
        if(typeof CARD_STORE !== "undefined" && CARD_STORE?.clear){
          CARD_STORE.clear();
        }

        grid.innerHTML = `<div class="message-card">Chargement des logements…</div>`;
        openingGrid.innerHTML = "";
        openingGrid.style.display = "none";
        openingTitle.classList.remove("show");
        resultCount.textContent = "0";

        const sbReadyNow = !!getSb();

        if (!sbReadyNow && typeof scheduleRenderRetry === "function"){
          scheduleRenderRetry();
        }

        const [pinsRes, occMap] = await Promise.all([
          fetchLocPins(),
          fetchOccupancyToday()
        ]);

        let dbPins = [];

        if (pinsRes.ok){
          dbPins = (pinsRes.rows || []).map(p => ({ ...p, kind: computeKind(p) }));
        }

        let livePins = placeOfficialPartnerFirst(dbPins);

        /*
          CŒUR DE LA CORRECTION :
          avant d’appliquer zone / type / texte, on retire les logements bloqués
          sur la période choisie.
          Donc CHEZ BAPTISTE reste vedette seulement s’il est disponible.
        */
        livePins = await filterAvailableBySearchDates(livePins);

        const filteredLive = applyFilters(livePins);
        const filteredOpening = applyFilters(OPENING_ZONES);

        resultCount.textContent = String(filteredLive.length);

        if (!filteredLive.length){
          if (livePins.length > 0){
            grid.innerHTML = `
              <div class="message-card">
                Aucun résultat sur les logements publiés. Clique <b>Effacer</b> ou change de zone / dates.<br><br>
                Besoin d’aide ?
                <a
                  href="https://wa.me/221771342889?text=Bonjour%20DIGIY,%20je%20cherche%20un%20logement%20mais%20je%20ne%20trouve%20pas%20encore."
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color:#ffdc9a;text-decoration:underline;"
                >
                  Écris-nous sur WhatsApp
                </a>.
              </div>
            `;
          } else if (pinsRes.error === "supabase_unavailable"){
            grid.innerHTML = `
              <div class="message-card">
                Chargement du service logement… <b>réessai automatique</b> en cours.<br><br>
                En attendant :
                <a
                  href="https://wa.me/221771342889?text=Bonjour%20DIGIY,%20je%20cherche%20un%20logement%20sur%20la%20Petite%20C%C3%B4te."
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color:#ffdc9a;text-decoration:underline;"
                >
                  WhatsApp +221 77 134 28 89
                </a>
              </div>
            `;
          } else {
            grid.innerHTML = `
              <div class="message-card">
                Aucun logement disponible sur ces dates.
                Change les dates ou écris à <b>DIGIY</b> sur WhatsApp au <b>+221 77 134 28 89</b>.
              </div>
            `;
          }
        } else {
          grid.innerHTML = filteredLive.map(p => cardTemplate(p, occMap)).join("");
        }

        if (filteredOpening.length){
          openingTitle.classList.add("show");
          openingGrid.style.display = "grid";
          openingGrid.innerHTML = filteredOpening.map(p => openingCardTemplate(p)).join("");
        }
      }catch(e){
        console.warn("[DIGIY LOC dispo] Patch render en erreur, retour au rendu original.", e?.message || e);

        try {
          await originalRender();
        } catch(err){
          console.warn("[DIGIY LOC dispo] Rendu original en erreur aussi.", err?.message || err);
        }
      }
    };

    console.log("[DIGIY LOC dispo] Rendu public patché façon Booking.");
    return true;
  }

  function boot(){
    injectDateControls();

    if(patchRender()){
      setTimeout(function(){
        if(typeof render === "function") render();
      }, 0);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }
})();

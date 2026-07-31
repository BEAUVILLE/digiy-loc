(() => {
  "use strict";

  const SUPPORTED = ["fr", "en", "es", "de", "it", "nl", "ar"];
  const COPY = {
    fr: {
      eyebrow: "PORTES LOC",
      title: "Accéder directement aux autres espaces",
      text: "Inscription, catalogue, espace professionnel et maison DIGIY restent accessibles depuis la page principale.",
      registration: "Inscrire un logement",
      registrationNote: "Tarifs, formule et activation LOC",
      catalogue: "Voir le catalogue",
      catalogueNote: "Locations actives et contact direct",
      pro: "Espace professionnel",
      proNote: "Accès sécurisé des partenaires LOC",
      hub: "Maison DIGIY",
      hubNote: "Revenir au HUB et aux autres métiers"
    },
    en: {
      eyebrow: "LOC DOORS",
      title: "Open the other LOC areas directly",
      text: "Registration, catalogue, professional space and the DIGIY house remain accessible from the main page.",
      registration: "Register a property",
      registrationNote: "LOC prices, plan and activation",
      catalogue: "View the catalogue",
      catalogueNote: "Active stays and direct contact",
      pro: "Professional space",
      proNote: "Secure access for LOC partners",
      hub: "DIGIY house",
      hubNote: "Return to the HUB and other services"
    },
    es: {
      eyebrow: "PUERTAS LOC",
      title: "Accede directamente a los otros espacios",
      text: "La inscripción, el catálogo, el espacio profesional y la casa DIGIY siguen accesibles desde la página principal.",
      registration: "Registrar un alojamiento",
      registrationNote: "Tarifas, fórmula y activación LOC",
      catalogue: "Ver el catálogo",
      catalogueNote: "Alojamientos activos y contacto directo",
      pro: "Espacio profesional",
      proNote: "Acceso seguro para socios LOC",
      hub: "Casa DIGIY",
      hubNote: "Volver al HUB y a los otros servicios"
    },
    de: {
      eyebrow: "LOC-ZUGÄNGE",
      title: "Direkt zu den weiteren Bereichen",
      text: "Registrierung, Katalog, Profibereich und das DIGIY-Haus bleiben von der Hauptseite aus erreichbar.",
      registration: "Unterkunft registrieren",
      registrationNote: "LOC-Tarife, Paket und Aktivierung",
      catalogue: "Katalog ansehen",
      catalogueNote: "Aktive Unterkünfte und direkter Kontakt",
      pro: "Profibereich",
      proNote: "Sicherer Zugang für LOC-Partner",
      hub: "DIGIY-Haus",
      hubNote: "Zurück zum HUB und zu weiteren Diensten"
    },
    it: {
      eyebrow: "PORTE LOC",
      title: "Accedi direttamente agli altri spazi",
      text: "Iscrizione, catalogo, spazio professionale e casa DIGIY restano accessibili dalla pagina principale.",
      registration: "Registra un alloggio",
      registrationNote: "Tariffe, formula e attivazione LOC",
      catalogue: "Vedi il catalogo",
      catalogueNote: "Alloggi attivi e contatto diretto",
      pro: "Spazio professionale",
      proNote: "Accesso sicuro per i partner LOC",
      hub: "Casa DIGIY",
      hubNote: "Torna all’HUB e agli altri servizi"
    },
    nl: {
      eyebrow: "LOC-POORTEN",
      title: "Ga direct naar de andere ruimtes",
      text: "Registratie, catalogus, professionele ruimte en het DIGIY-huis blijven bereikbaar vanaf de hoofdpagina.",
      registration: "Accommodatie registreren",
      registrationNote: "LOC-tarieven, formule en activering",
      catalogue: "Bekijk de catalogus",
      catalogueNote: "Actieve verblijven en direct contact",
      pro: "Professionele ruimte",
      proNote: "Beveiligde toegang voor LOC-partners",
      hub: "DIGIY-huis",
      hubNote: "Terug naar de HUB en andere diensten"
    },
    ar: {
      eyebrow: "بوابات ديجي لوك",
      title: "الوصول مباشرة إلى المساحات الأخرى",
      text: "يبقى التسجيل والكتالوج والمساحة المهنية وبيت ديجي متاحة من الصفحة الرئيسية.",
      registration: "تسجيل مكان إقامة",
      registrationNote: "أسعار وخطة وتفعيل ديجي لوك",
      catalogue: "عرض الكتالوج",
      catalogueNote: "إقامات نشطة وتواصل مباشر",
      pro: "المساحة المهنية",
      proNote: "دخول آمن لشركاء ديجي لوك",
      hub: "بيت ديجي",
      hubNote: "العودة إلى المركز والخدمات الأخرى"
    }
  };

  function currentLang() {
    try {
      const fromUrl = (new URLSearchParams(location.search).get("lang") || "").toLowerCase();
      if (SUPPORTED.includes(fromUrl)) return fromUrl;
      for (const key of ["digiyLocLang", "digiy-lang", "digiy_loc_lang_native_v1"]) {
        const value = (localStorage.getItem(key) || "").toLowerCase();
        if (SUPPORTED.includes(value)) return value;
      }
      const browser = (navigator.language || "fr").slice(0, 2).toLowerCase();
      return SUPPORTED.includes(browser) ? browser : "fr";
    } catch (_) {
      return "fr";
    }
  }

  function withLang(path, lang) {
    try {
      const url = new URL(path, location.href);
      url.searchParams.set("lang", lang);
      return url.pathname + url.search + url.hash;
    } catch (_) {
      return path;
    }
  }

  function addStyles() {
    if (document.getElementById("digiyLocDoorsStyle")) return;
    const style = document.createElement("style");
    style.id = "digiyLocDoorsStyle";
    style.textContent = `
      .loc-doors{margin:18px 14px 4px;padding:18px;border:1px solid rgba(250,204,21,.34);border-radius:24px;background:radial-gradient(circle at top right,rgba(250,204,21,.13),transparent 38%),linear-gradient(145deg,rgba(16,55,40,.98),rgba(7,31,23,.98));box-shadow:0 18px 48px rgba(0,0,0,.28)}
      .loc-doors__eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;border:1px solid rgba(250,204,21,.38);background:rgba(250,204,21,.10);color:#ffe68a;font-size:11px;font-weight:950;letter-spacing:.09em}
      .loc-doors h2{margin:10px 0 7px;font-size:clamp(23px,5vw,32px);line-height:1.08}
      .loc-doors__text{margin:0;color:rgba(236,253,245,.76);font-size:14px;line-height:1.5;font-weight:720}
      .loc-doors__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:15px}
      .loc-door{min-height:112px;padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);color:#fff;text-decoration:none;display:flex;flex-direction:column;justify-content:space-between;gap:10px;transition:transform .16s ease,border-color .16s ease,background .16s ease}
      .loc-door:hover,.loc-door:focus-visible{transform:translateY(-2px);border-color:rgba(250,204,21,.58);background:rgba(250,204,21,.10);outline:none}
      .loc-door--primary{background:linear-gradient(135deg,#facc15,#f59e0b);color:#071b14;border:0}
      .loc-door__top{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:950}
      .loc-door__icon{font-size:23px;line-height:1}
      .loc-door__note{font-size:12px;line-height:1.38;font-weight:760;opacity:.78}
      html[dir="rtl"] .loc-door__top{flex-direction:row-reverse;justify-content:flex-end}
      @media(max-width:820px){.loc-doors__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:480px){.loc-doors{margin-inline:10px;padding:15px}.loc-doors__grid{grid-template-columns:1fr}.loc-door{min-height:88px}}
    `;
    document.head.appendChild(style);
  }

  function createDoor({ href, icon, title, note, primary = false, external = false }) {
    const link = document.createElement("a");
    link.className = `loc-door${primary ? " loc-door--primary" : ""}`;
    link.href = href;
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.innerHTML = `<span class="loc-door__top"><span class="loc-door__icon">${icon}</span><span>${title}</span></span><span class="loc-door__note">${note}</span>`;
    return link;
  }

  function mount() {
    if (document.getElementById("locDoors")) return;
    const lang = currentLang();
    const t = COPY[lang] || COPY.fr;
    addStyles();

    const block = document.createElement("section");
    block.id = "locDoors";
    block.className = "loc-doors";
    block.setAttribute("aria-label", t.title);
    block.innerHTML = `<span class="loc-doors__eyebrow">${t.eyebrow}</span><h2>${t.title}</h2><p class="loc-doors__text">${t.text}</p><div class="loc-doors__grid"></div>`;

    const grid = block.querySelector(".loc-doors__grid");
    grid.append(
      createDoor({ href: withLang("./inscription-loc.html", lang), icon: "🧾", title: t.registration, note: t.registrationNote, primary: true }),
      createDoor({ href: withLang("./catalogue.html", lang), icon: "🏠", title: t.catalogue, note: t.catalogueNote }),
      createDoor({ href: "https://pro-loc.digiylyfe.com/", icon: "🔐", title: t.pro, note: t.proNote, external: true }),
      createDoor({ href: "https://digiy-hub.digiylyfe.com/", icon: "🧭", title: t.hub, note: t.hubNote, external: true })
    );

    const anchor = document.querySelector(".search-wrap");
    if (anchor && anchor.parentNode) {
      anchor.insertAdjacentElement("afterend", block);
      return;
    }
    const main = document.querySelector("main.app, .app, main");
    if (main) main.prepend(block);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();

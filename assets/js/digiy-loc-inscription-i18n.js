(() => {
  "use strict";

  const SUPPORTED = ["fr", "en", "es", "de", "it", "nl", "ar"];
  const LOCALES = { fr:"fr-FR", en:"en-GB", es:"es-ES", de:"de-DE", it:"it-IT", nl:"nl-NL", ar:"ar-SA" };
  const FLAGS = { fr:"🇫🇷", en:"🇬🇧", es:"🇪🇸", de:"🇩🇪", it:"🇮🇹", nl:"🇳🇱", ar:"🇸🇦" };

  function currentLang(){
    try{
      const p = new URLSearchParams(location.search);
      const q = String(p.get("lang") || "").toLowerCase();
      if(SUPPORTED.includes(q)) return q;
      for(const key of ["digiyLocLang","digiy-lang","digiy_loc_lang_native_v1"]){
        const v = String(localStorage.getItem(key) || "").toLowerCase();
        if(SUPPORTED.includes(v)) return v;
      }
    }catch(_){}
    return "fr";
  }

  const lang = currentLang();
  if(lang === "fr") return;

  const DATA = window.DIGIY_LOC_INSCRIPTION_I18N || {D:{},FR:{}};
  const D = DATA.D;
  const FR = DATA.FR;
  const T = D[lang];
  if(!T) return;

  const PHRASES = Object.entries(FR).sort((a,b) => b[0].length - a[0].length);
  const SKIP = new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","OPTION"]);
  let busy = false;

  function translateText(raw){
    if(!raw || !raw.trim()) return raw;
    let out = raw;
    for(const [fr,key] of PHRASES){
      const value = T[key];
      if(value && out.includes(fr)) out = out.split(fr).join(value);
    }
    out = out
      .replace(/choix sélectionnés/g, T.selectedPlural)
      .replace(/choix sélectionné/g, T.selected)
      .replace(/Visibilité LOC \+ fiche logements détaillée \+ moteur/g, T.withDetailed)
      .replace(/Visibilité LOC sans fiche détaillée ni moteur/g, T.noDetailed)
      .replace(/Option complémentaire distincte/g, T.complementary)
      .replace(/Paiement Wave direct/g, T.waveDirect)
      .replace(/Paiement Sendwave → Wave Sénégal/g, T.sendwave)
      .replace(/Date de demande\s*:/g, T.requestDate)
      .replace(/Tarif France à valider/g, lang === "en" ? "France price to confirm" : lang === "es" ? "Tarifa Francia por confirmar" : lang === "de" ? "Frankreich-Preis zu bestätigen" : lang === "it" ? "Tariffa Francia da confermare" : lang === "nl" ? "Frankrijk-tarief te bevestigen" : "سعر فرنسا يحتاج إلى تأكيد");
    return out;
  }

  function translateNode(root){
    if(!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const p = node.parentElement;
        if(!p || SKIP.has(p.tagName) || p.closest("[data-i18n-lock='1']")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const n of nodes){
      const v = translateText(n.nodeValue);
      if(v !== n.nodeValue) n.nodeValue = v;
    }
    root.querySelectorAll?.("[placeholder],[aria-label],[title]").forEach(el => {
      for(const attr of ["placeholder","aria-label","title"]){
        const v = el.getAttribute(attr);
        if(!v) continue;
        const nv = translateText(v)
          .replace("Ex :", lang === "en" ? "E.g.:" : lang === "es" ? "Ej.:" : lang === "de" ? "Z. B.:" : lang === "it" ? "Es.:" : lang === "nl" ? "Bijv.:" : "مثال:");
        if(nv !== v) el.setAttribute(attr,nv);
      }
    });
    root.querySelectorAll?.("option").forEach(opt => {
      const v = translateText(opt.textContent);
      if(v !== opt.textContent) opt.textContent = v;
    });
  }

  function translateOutbound(message){
    let out = translateText(String(message || ""));
    const generic = {
      en:[["Bonjour JB, je veux avancer avec DIGIY LOC.","Hello JB, I want to move forward with DIGIY LOC."],["Date de demande","Request date"],["Pays / règlement","Country / payment"],["Infos propriétaire / résidence","Owner / residence details"],["Choix","Choices"],["Doctrine LOC","LOC doctrine"],["Montant","Amount"],["Règlement","Payment"],["Note / preuve paiement","Payment note / proof"],["Après paiement, je vous envoie la preuve ici.","After payment, I will send the proof here."],["Canal souhaité : WhatsApp ou SMS.","Preferred channel: WhatsApp or SMS."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","Hello JB, here is the payment proof for DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","I am attaching the screenshot / payment proof to this message."]],
      es:[["Bonjour JB, je veux avancer avec DIGIY LOC.","Hola JB, quiero avanzar con DIGIY LOC."],["Date de demande","Fecha de solicitud"],["Pays / règlement","País / pago"],["Infos propriétaire / résidence","Datos del propietario / residencia"],["Choix","Opciones"],["Doctrine LOC","Doctrina LOC"],["Montant","Importe"],["Règlement","Pago"],["Note / preuve paiement","Nota / comprobante de pago"],["Après paiement, je vous envoie la preuve ici.","Después del pago, enviaré aquí el comprobante."],["Canal souhaité : WhatsApp ou SMS.","Canal deseado: WhatsApp o SMS."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","Hola JB, aquí está el comprobante de pago de DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","Adjunto la captura / el comprobante de pago a este mensaje."]],
      de:[["Bonjour JB, je veux avancer avec DIGIY LOC.","Hallo JB, ich möchte mit DIGIY LOC fortfahren."],["Date de demande","Anfragedatum"],["Pays / règlement","Land / Zahlung"],["Infos propriétaire / résidence","Eigentümer-/Residenzdaten"],["Choix","Auswahl"],["Doctrine LOC","LOC-Grundsatz"],["Montant","Betrag"],["Règlement","Zahlung"],["Note / preuve paiement","Zahlungsnotiz / Nachweis"],["Après paiement, je vous envoie la preuve ici.","Nach der Zahlung sende ich den Nachweis hier."],["Canal souhaité : WhatsApp ou SMS.","Gewünschter Kanal: WhatsApp oder SMS."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","Hallo JB, hier ist der Zahlungsnachweis für DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","Ich füge diesem Bericht den Screenshot / Zahlungsnachweis bei."]],
      it:[["Bonjour JB, je veux avancer avec DIGIY LOC.","Ciao JB, voglio procedere con DIGIY LOC."],["Date de demande","Data della richiesta"],["Pays / règlement","Paese / pagamento"],["Infos propriétaire / résidence","Dati proprietario / residence"],["Choix","Scelte"],["Doctrine LOC","Dottrina LOC"],["Montant","Importo"],["Règlement","Pagamento"],["Note / preuve paiement","Nota / prova pagamento"],["Après paiement, je vous envoie la preuve ici.","Dopo il pagamento invierò qui la prova."],["Canal souhaité : WhatsApp ou SMS.","Canale desiderato: WhatsApp o SMS."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","Ciao JB, ecco la prova di pagamento per DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","Allego lo screenshot / la prova di pagamento a questo messaggio."]],
      nl:[["Bonjour JB, je veux avancer avec DIGIY LOC.","Hallo JB, ik wil verdergaan met DIGIY LOC."],["Date de demande","Aanvraagdatum"],["Pays / règlement","Land / betaling"],["Infos propriétaire / résidence","Gegevens eigenaar / residentie"],["Choix","Keuzes"],["Doctrine LOC","LOC-doctrine"],["Montant","Bedrag"],["Règlement","Betaling"],["Note / preuve paiement","Betalingsnotitie / bewijs"],["Après paiement, je vous envoie la preuve ici.","Na betaling stuur ik hier het bewijs."],["Canal souhaité : WhatsApp ou SMS.","Gewenst kanaal: WhatsApp of sms."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","Hallo JB, hierbij het betalingsbewijs voor DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","Ik voeg de screenshot / het betalingsbewijs aan dit bericht toe."]],
      ar:[["Bonjour JB, je veux avancer avec DIGIY LOC.","مرحباً JB، أريد المتابعة مع DIGIY LOC."],["Date de demande","تاريخ الطلب"],["Pays / règlement","البلد / الدفع"],["Infos propriétaire / résidence","بيانات المالك / الإقامة"],["Choix","الاختيارات"],["Doctrine LOC","عقيدة LOC"],["Montant","المبلغ"],["Règlement","الدفع"],["Note / preuve paiement","ملاحظة / إثبات الدفع"],["Après paiement, je vous envoie la preuve ici.","بعد الدفع سأرسل الإثبات هنا."],["Canal souhaité : WhatsApp ou SMS.","القناة المطلوبة: واتساب أو رسالة نصية."],["Bonjour JB, voici la preuve de paiement pour DIGIY LOC.","مرحباً JB، هذا هو إثبات الدفع لـ DIGIY LOC."],["Je joins la capture / preuve de paiement à ce message.","أرفق لقطة الشاشة / إثبات الدفع بهذه الرسالة."]]
    };
    for(const [a,b] of (generic[lang] || [])) out = out.split(a).join(b);
    return out;
  }

  function localizeWhatsAppHref(anchor){
    try{
      const u = new URL(anchor.href, location.href);
      const msg = u.searchParams.get("text");
      if(!msg) return;
      u.searchParams.set("text", translateOutbound(msg));
      anchor.href = u.toString();
    }catch(_){}
  }

  function addSwitch(){
    if(document.getElementById("locInscriptionLang")) return;
    const box = document.createElement("div");
    box.id = "locInscriptionLang";
    box.setAttribute("data-i18n-lock","1");
    box.setAttribute("aria-label",T.switchLabel);
    box.innerHTML = SUPPORTED.map(code => `<button type="button" data-code="${code}" aria-pressed="${code===lang}">${FLAGS[code]} ${code.toUpperCase()}</button>`).join("");
    const style = document.createElement("style");
    style.textContent = `#locInscriptionLang{display:flex;flex-wrap:wrap;gap:5px;padding:7px;margin:10px 0;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(0,0,0,.18)}#locInscriptionLang button{min-height:38px;padding:0 10px;border:1px solid rgba(255,255,255,.13);border-radius:12px;background:rgba(255,255,255,.07);color:#fff;font-weight:950}#locInscriptionLang button[aria-pressed="true"]{background:linear-gradient(135deg,#facc15,#f59e0b);color:#111827;border-color:transparent}html[dir="rtl"] #locInscriptionLang{direction:rtl}`;
    document.head.appendChild(style);
    const header = document.querySelector("header.top") || document.querySelector(".app");
    if(header) header.insertAdjacentElement("afterend",box);
    box.addEventListener("click",e => {
      const b=e.target.closest("button[data-code]"); if(!b) return;
      const code=b.dataset.code;
      try{ localStorage.setItem("digiyLocLang",code); localStorage.setItem("digiy-lang",code); }catch(_){}
      const u=new URL(location.href); u.searchParams.set("lang",code); location.href=u.toString();
    });
  }

  function setMeta(){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = T.title;
    const meta=document.querySelector('meta[name="description"]');
    if(meta) meta.content = lang === "en" ? "Register your accommodation on DIGIY LOC with direct contact, 0% commission and clear country pricing." : lang === "es" ? "Registra tu alojamiento en DIGIY LOC con contacto directo, 0% de comisión y tarifas claras por país." : lang === "de" ? "Registrieren Sie Ihre Unterkunft bei DIGIY LOC mit Direktkontakt, 0 % Provision und klaren Länderpreisen." : lang === "it" ? "Registra il tuo alloggio su DIGIY LOC con contatto diretto, 0% commissioni e tariffe chiare per paese." : lang === "nl" ? "Registreer uw accommodatie op DIGIY LOC met rechtstreeks contact, 0% commissie en duidelijke landentarieven." : "سجّل سكنك على DIGIY LOC باتصال مباشر وعمولة 0% وأسعار واضحة حسب البلد.";
  }

  function localizeLinks(){
    document.querySelectorAll('a[href^="./index.html"],a[href^="index.html"]').forEach(a => {
      try{ const u=new URL(a.href,location.href); u.searchParams.set("lang",lang); a.href=u.toString(); }catch(_){}
    });
  }

  function updateDate(){
    const box=document.getElementById("dateBox");
    if(!box) return;
    try{ box.textContent = `${T.requestDate} ${new Intl.DateTimeFormat(LOCALES[lang],{dateStyle:"full",timeStyle:"short"}).format(new Date())}`; }catch(_){}
  }

  function apply(){
    if(busy) return; busy=true;
    try{ translateNode(document.body); localizeLinks(); updateDate(); }
    finally{ busy=false; }
  }

  function setupOutbound(){
    document.addEventListener("click",e => {
      const a=e.target.closest("#btnWa,#btnProof");
      if(a) localizeWhatsAppHref(a);
    },true);

    const sms=document.getElementById("btnSms");
    if(sms){
      sms.addEventListener("click",e => {
        if(lang === "fr") return;
        e.preventDefault(); e.stopImmediatePropagation();
        const fields=["proName","proPhone","proZone","proActivity"].map(id=>document.getElementById(id));
        const bad=fields.find(x=>!x || !String(x.value||"").trim() || !x.checkValidity());
        if(bad){
          const warn=document.getElementById("formWarning"); if(warn){warn.textContent=T.fieldsWarning;warn.classList.add("show");}
          bad?.focus(); return;
        }
        const selected=document.getElementById("choiceList")?.innerText?.trim() || "";
        if(!selected || selected.includes("Aucun choix") || selected.includes(T.noChoice)){
          const warn=document.getElementById("formWarning"); if(warn){warn.textContent=T.chooseWarning;warn.classList.add("show");}
          return;
        }
        const total=document.getElementById("totalText")?.textContent?.trim() || "";
        const country=document.querySelector("[data-country].active strong")?.textContent?.trim() || "";
        const message=[T.title,country,selected,total,`${T.name}: ${fields[0].value}`,`${T.phone}: ${fields[1].value}`,`${T.zone}: ${fields[2].value}`,`${T.activity}: ${fields[3].value}`,"0% commission DIGIY"].join("\n");
        const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
        location.href=`sms:+221771342889${ios?"&":"?"}body=${encodeURIComponent(message)}`;
      },true);
    }
  }

  setMeta();
  addSwitch();
  apply();
  setupOutbound();
  let timer=0;
  const obs=new MutationObserver(() => { clearTimeout(timer); timer=setTimeout(apply,35); });
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
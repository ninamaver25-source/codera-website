import { useSyncExternalStore } from "react";
import { isLang, type Lang } from "../../lib/configurator";

/**
 * The words of the site in its six languages (English first). The film's props — the website on
 * the laptop, the design tool, the care dashboard — stay in English, like real products do.
 */
type Lines = string[];
interface Step {
  title: Lines;
  sub: Lines;
}
export interface Dict {
  meta: { title: string };
  nav: { process: string; services: string; price: string; cta: string; home: string; language: string };
  hero: { title: [string, string]; sub: string; cta: string; cue: string };
  steps: [Step, Step, Step, Step];
  more: { title: [string, string]; sub: string };
  services: [Step, Step, Step];
  build: { title: [string, string]; sub: string };
  gen: {
    brand: string;
    online: string;
    reading: string;
    calculating: string;
    placeholder: string;
    ask: string;
    hello: string;
    readingLine: string;
    understood: string;
    hintMore: string;
    hintEmpty: string;
    options: string;
    opt: Record<"website" | "shop" | "booking" | "multilingual" | "visuals" | "care", string>;
    price: string;
    month: string;
    monthCare: string;
    get: string;
    update: string;
    send: string;
    readingBtn: string;
    calculatingBtn: string;
    sending: string;
    back: string;
    sent: string;
    note: string;
    noteForm: string;
    noteSent: string;
    name: string;
    email: string;
    company: string;
    message: string;
    optional: string;
    addName: string;
    addEmail: string;
    failed: string;
    tooMany: string;
    thanks: string;
    received: string;
  };
  foot: { email: string; contact: string };
}

const en: Dict = {
  meta: { title: "codERA — We build digital experiences" },
  nav: { process: "Process", services: "Services", price: "Price", cta: "Start a project", home: "codERA — back to the start", language: "Language" },
  hero: { title: ["WE BUILD DIGITAL", "EXPERIENCES."], sub: "Web development · Visual production · Website care", cta: "Start a project", cue: "Scroll to explore" },
  steps: [
    { title: ["YOUR", "IDEA."], sub: ["You bring the vision.", "We shape the direction."] },
    { title: ["DESIGN."], sub: ["From first sketch", "to final interface."] },
    { title: ["DEVELOP-", "MENT."], sub: ["Clean, fast code", "that works on every device."] },
    { title: ["LAUNCH."], sub: ["Tested, live", "and ready to grow."] },
  ],
  more: { title: ["WE BUILD MORE", "THAN WEBSITES."], sub: "Websites. Visuals. Digital experiences." },
  services: [
    { title: ["WEB", "DEVELOPMENT."], sub: ["Custom websites built to look", "exceptional and perform beautifully."] },
    { title: ["VISUAL", "PRODUCTION."], sub: ["Visuals designed to make brands", "impossible to ignore."] },
    { title: ["WEBSITE CARE."], sub: ["We keep your website updated,", "polished and running smoothly."] },
  ],
  build: { title: ["NOW, LET’S", "BUILD YOURS."], sub: "Create your project. Get an instant estimate." },
  gen: {
    brand: "Price generator",
    online: "Online",
    reading: "Reading",
    calculating: "Calculating",
    placeholder: "Tell us what you want to build...",
    ask: "Tell us what you want to build",
    hello: "Write it in your own words — the AI ticks the options for you.",
    readingLine: "Reading your description",
    understood: "Understood: ",
    hintMore: "Tell me a little more — or tick an option.",
    hintEmpty: "Write what you want to build — or tick an option.",
    options: "Options",
    opt: { website: "Website", shop: "Online shop", booking: "Booking", multilingual: "Multilingual", visuals: "Visual production", care: "Website care" },
    price: "Estimated project price",
    month: " / month",
    monthCare: "/ month website care",
    get: "Get my estimate",
    update: "Update estimate",
    send: "Send project request",
    readingBtn: "Reading…",
    calculatingBtn: "Calculating…",
    sending: "Sending…",
    back: "← Back",
    sent: "Sent",
    note: "This is an instant AI estimate. Final pricing may vary depending on project requirements.",
    noteForm: "Your description, the options and the estimate are included.",
    noteSent: "We’ll review your project and get back to you shortly.",
    name: "Name",
    email: "Email",
    company: "Company",
    message: "Additional message",
    optional: " · optional",
    addName: "Add your name.",
    addEmail: "Add a valid email.",
    failed: "We couldn’t send your request just now. Please try again.",
    tooMany: "Too many requests. Try again later.",
    thanks: "Thank you",
    received: "PROJECT RECEIVED.",
  },
  foot: { email: "Email", contact: "Contact" },
};

const sl: Dict = {
  meta: { title: "codERA — Ustvarjamo digitalne izkušnje" },
  nav: { process: "Proces", services: "Storitve", price: "Cena", cta: "Začni projekt", home: "codERA — nazaj na začetek", language: "Jezik" },
  hero: { title: ["USTVARJAMO DIGITALNE", "IZKUŠNJE."], sub: "Spletni razvoj · Vizualna produkcija · Vzdrževanje strani", cta: "Začni projekt", cue: "Pomaknite se navzdol" },
  steps: [
    { title: ["VAŠA", "IDEJA."], sub: ["Vi prinesete vizijo.", "Mi ji damo smer."] },
    { title: ["OBLIKO-", "VANJE."], sub: ["Od prve skice", "do končnega vmesnika."] },
    { title: ["RAZVOJ."], sub: ["Čista, hitra koda,", "ki deluje na vseh napravah."] },
    { title: ["ZAGON."], sub: ["Preizkušeno, objavljeno", "in pripravljeno na rast."] },
  ],
  more: { title: ["USTVARJAMO VEČ", "KOT SPLETNE STRANI."], sub: "Spletne strani. Vizualne vsebine. Digitalne izkušnje." },
  services: [
    { title: ["SPLETNI", "RAZVOJ."], sub: ["Spletne strani po meri, ki so videti", "izjemno in delujejo brezhibno."] },
    { title: ["VIZUALNA", "PRODUKCIJA."], sub: ["Vizualne vsebine, zaradi katerih", "znamke ne gredo neopažene."] },
    { title: ["VZDRŽEVANJE", "SPLETNE STRANI."], sub: ["Vašo spletno stran redno posodabljamo,", "izpopolnjujemo in skrbimo, da teče gladko."] },
  ],
  build: { title: ["ZDAJ PA", "USTVARIMO VAŠO."], sub: "Ustvarite svoj projekt. Dobite takojšnjo oceno." },
  gen: {
    brand: "Generator cene",
    online: "Na voljo",
    reading: "Berem",
    calculating: "Računam",
    placeholder: "Povejte nam, kaj želite ustvariti ...",
    ask: "Povejte nam, kaj želite ustvariti",
    hello: "Napišite s svojimi besedami — AI sam označi možnosti.",
    readingLine: "Berem vaš opis",
    understood: "Razumem: ",
    hintMore: "Povejte še kaj več — ali označite možnost.",
    hintEmpty: "Napišite, kaj želite ustvariti — ali označite možnost.",
    options: "Možnosti",
    opt: { website: "Spletna stran", shop: "Spletna trgovina", booking: "Rezervacije", multilingual: "Večjezičnost", visuals: "Vizualna produkcija", care: "Vzdrževanje" },
    price: "Ocenjena cena projekta",
    month: " / mesec",
    monthCare: "/ mesec vzdrževanje",
    get: "Izračunaj oceno",
    update: "Posodobi oceno",
    send: "Pošlji povpraševanje",
    readingBtn: "Berem …",
    calculatingBtn: "Računam …",
    sending: "Pošiljam …",
    back: "← Nazaj",
    sent: "Poslano",
    note: "To je takojšnja ocena AI. Končna cena se lahko razlikuje glede na zahteve projekta.",
    noteForm: "Vaš opis, izbrane možnosti in ocena so priloženi.",
    noteSent: "Projekt bomo pregledali in se vam kmalu oglasili.",
    name: "Ime",
    email: "E-pošta",
    company: "Podjetje",
    message: "Dodatno sporočilo",
    optional: " · neobvezno",
    addName: "Vpišite ime.",
    addEmail: "Vpišite veljaven e-poštni naslov.",
    failed: "Povpraševanja trenutno ni bilo mogoče poslati. Poskusite znova.",
    tooMany: "Preveč zahtev. Poskusite znova pozneje.",
    thanks: "Hvala",
    received: "PROJEKT PREJET.",
  },
  foot: { email: "E-pošta", contact: "Kontakt" },
};

const fr: Dict = {
  meta: { title: "codERA — Nous créons des expériences digitales" },
  nav: { process: "Processus", services: "Services", price: "Prix", cta: "Démarrer un projet", home: "codERA — retour au début", language: "Langue" },
  hero: { title: ["NOUS CRÉONS DES", "EXPÉRIENCES DIGITALES."], sub: "Développement web · Production visuelle · Maintenance de site", cta: "Démarrer un projet", cue: "Faites défiler" },
  steps: [
    { title: ["VOTRE", "IDÉE."], sub: ["Vous apportez la vision.", "Nous traçons la direction."] },
    { title: ["DESIGN."], sub: ["De la première esquisse", "à l’interface finale."] },
    { title: ["DÉVELOP-", "PEMENT."], sub: ["Un code propre et rapide,", "sur tous les appareils."] },
    { title: ["LANCE-", "MENT."], sub: ["Testé, en ligne", "et prêt à grandir."] },
  ],
  more: { title: ["NOUS FAISONS PLUS", "QUE DES SITES WEB."], sub: "Sites web. Visuels. Expériences digitales." },
  services: [
    { title: ["DÉVELOP-", "PEMENT WEB."], sub: ["Des sites sur mesure, superbes", "et parfaitement performants."] },
    { title: ["PRODUCTION", "VISUELLE."], sub: ["Des visuels qui rendent les marques", "impossibles à ignorer."] },
    { title: ["MAINTENANCE", "DE SITE."], sub: ["Nous gardons votre site à jour,", "soigné et parfaitement fonctionnel."] },
  ],
  build: { title: ["MAINTENANT,", "CRÉONS LE VÔTRE."], sub: "Créez votre projet. Obtenez une estimation immédiate." },
  gen: {
    brand: "Générateur de prix",
    online: "En ligne",
    reading: "Lecture",
    calculating: "Calcul",
    placeholder: "Dites-nous ce que vous voulez créer…",
    ask: "Dites-nous ce que vous voulez créer",
    hello: "Décrivez-le avec vos mots — l’IA coche les options pour vous.",
    readingLine: "Je lis votre description",
    understood: "Compris : ",
    hintMore: "Dites-m’en un peu plus — ou cochez une option.",
    hintEmpty: "Écrivez ce que vous voulez créer — ou cochez une option.",
    options: "Options",
    opt: { website: "Site web", shop: "Boutique en ligne", booking: "Réservations", multilingual: "Multilingue", visuals: "Production visuelle", care: "Maintenance" },
    price: "Prix estimé du projet",
    month: " / mois",
    monthCare: "/ mois de maintenance",
    get: "Obtenir mon estimation",
    update: "Mettre à jour",
    send: "Envoyer ma demande",
    readingBtn: "Lecture…",
    calculatingBtn: "Calcul…",
    sending: "Envoi…",
    back: "← Retour",
    sent: "Envoyé",
    note: "Il s’agit d’une estimation instantanée par IA. Le prix final peut varier selon les besoins du projet.",
    noteForm: "Votre description, les options et l’estimation sont incluses.",
    noteSent: "Nous étudions votre projet et revenons vers vous rapidement.",
    name: "Nom",
    email: "E-mail",
    company: "Entreprise",
    message: "Message complémentaire",
    optional: " · facultatif",
    addName: "Indiquez votre nom.",
    addEmail: "Indiquez un e-mail valide.",
    failed: "Votre demande n’a pas pu être envoyée. Veuillez réessayer.",
    tooMany: "Trop de demandes. Réessayez plus tard.",
    thanks: "Merci",
    received: "PROJET REÇU.",
  },
  foot: { email: "E-mail", contact: "Contact" },
};

const es: Dict = {
  meta: { title: "codERA — Creamos experiencias digitales" },
  nav: { process: "Proceso", services: "Servicios", price: "Precio", cta: "Empezar un proyecto", home: "codERA — volver al inicio", language: "Idioma" },
  hero: { title: ["CREAMOS EXPERIENCIAS", "DIGITALES."], sub: "Desarrollo web · Producción visual · Mantenimiento web", cta: "Empezar un proyecto", cue: "Desliza para explorar" },
  steps: [
    { title: ["TU", "IDEA."], sub: ["Tú aportas la visión.", "Nosotros marcamos el rumbo."] },
    { title: ["DISEÑO."], sub: ["Del primer boceto", "a la interfaz final."] },
    { title: ["DESARRO-", "LLO."], sub: ["Código limpio y rápido", "que funciona en cualquier dispositivo."] },
    { title: ["LANZA-", "MIENTO."], sub: ["Probado, en línea", "y listo para crecer."] },
  ],
  more: { title: ["HACEMOS MÁS", "QUE PÁGINAS WEB."], sub: "Webs. Visuales. Experiencias digitales." },
  services: [
    { title: ["DESARROLLO", "WEB."], sub: ["Webs a medida que lucen", "excepcionales y funcionan de maravilla."] },
    { title: ["PRODUCCIÓN", "VISUAL."], sub: ["Visuales que hacen que las marcas", "sean imposibles de ignorar."] },
    { title: ["MANTENIMIENTO", "WEB."], sub: ["Mantenemos tu web actualizada,", "cuidada y funcionando sin problemas."] },
  ],
  build: { title: ["AHORA,", "CREEMOS LA TUYA."], sub: "Crea tu proyecto. Obtén un presupuesto al instante." },
  gen: {
    brand: "Generador de precios",
    online: "En línea",
    reading: "Leyendo",
    calculating: "Calculando",
    placeholder: "Cuéntanos qué quieres crear...",
    ask: "Cuéntanos qué quieres crear",
    hello: "Escríbelo con tus palabras: la IA marca las opciones por ti.",
    readingLine: "Leyendo tu descripción",
    understood: "Entendido: ",
    hintMore: "Cuéntame un poco más, o marca una opción.",
    hintEmpty: "Escribe qué quieres crear, o marca una opción.",
    options: "Opciones",
    opt: { website: "Sitio web", shop: "Tienda online", booking: "Reservas", multilingual: "Multilingüe", visuals: "Producción visual", care: "Mantenimiento" },
    price: "Precio estimado del proyecto",
    month: " / mes",
    monthCare: "/ mes de mantenimiento",
    get: "Obtener mi presupuesto",
    update: "Actualizar presupuesto",
    send: "Enviar solicitud",
    readingBtn: "Leyendo…",
    calculatingBtn: "Calculando…",
    sending: "Enviando…",
    back: "← Volver",
    sent: "Enviado",
    note: "Este es un presupuesto instantáneo de IA. El precio final puede variar según los requisitos del proyecto.",
    noteForm: "Tu descripción, las opciones y el presupuesto se incluyen.",
    noteSent: "Revisaremos tu proyecto y te responderemos pronto.",
    name: "Nombre",
    email: "Correo electrónico",
    company: "Empresa",
    message: "Mensaje adicional",
    optional: " · opcional",
    addName: "Escribe tu nombre.",
    addEmail: "Escribe un correo válido.",
    failed: "No hemos podido enviar tu solicitud. Inténtalo de nuevo.",
    tooMany: "Demasiadas solicitudes. Inténtalo más tarde.",
    thanks: "Gracias",
    received: "PROYECTO RECIBIDO.",
  },
  foot: { email: "Correo", contact: "Contacto" },
};

const de: Dict = {
  meta: { title: "codERA — Wir gestalten digitale Erlebnisse" },
  nav: { process: "Prozess", services: "Leistungen", price: "Preis", cta: "Projekt starten", home: "codERA — zurück zum Anfang", language: "Sprache" },
  hero: { title: ["WIR GESTALTEN DIGITALE", "ERLEBNISSE."], sub: "Webentwicklung · Visuelle Produktion · Website-Betreuung", cta: "Projekt starten", cue: "Scrollen zum Entdecken" },
  steps: [
    { title: ["IHRE", "IDEE."], sub: ["Sie bringen die Vision.", "Wir geben die Richtung."] },
    { title: ["DESIGN."], sub: ["Von der ersten Skizze", "bis zum fertigen Interface."] },
    { title: ["ENTWICK-", "LUNG."], sub: ["Sauberer, schneller Code,", "der auf jedem Gerät läuft."] },
    { title: ["START."], sub: ["Getestet, live", "und bereit zu wachsen."] },
  ],
  more: { title: ["WIR MACHEN MEHR", "ALS WEBSITES."], sub: "Websites. Visuals. Digitale Erlebnisse." },
  services: [
    { title: ["WEBENT-", "WICKLUNG."], sub: ["Individuelle Websites, die herausragend", "aussehen und bestens funktionieren."] },
    { title: ["VISUELLE", "PRODUKTION."], sub: ["Visuals, die Marken", "unübersehbar machen."] },
    { title: ["WEBSITE-", "BETREUUNG."], sub: ["Wir halten Ihre Website aktuell,", "gepflegt und reibungslos am Laufen."] },
  ],
  build: { title: ["JETZT BAUEN", "WIR IHRE."], sub: "Projekt erstellen. Sofort eine Schätzung erhalten." },
  gen: {
    brand: "Preisrechner",
    online: "Online",
    reading: "Lese",
    calculating: "Berechne",
    placeholder: "Sagen Sie uns, was Sie bauen möchten …",
    ask: "Sagen Sie uns, was Sie bauen möchten",
    hello: "In eigenen Worten — die KI wählt die passenden Optionen.",
    readingLine: "Ich lese Ihre Beschreibung",
    understood: "Verstanden: ",
    hintMore: "Erzählen Sie etwas mehr — oder wählen Sie eine Option.",
    hintEmpty: "Schreiben Sie, was Sie bauen möchten — oder wählen Sie eine Option.",
    options: "Optionen",
    opt: { website: "Website", shop: "Onlineshop", booking: "Buchungen", multilingual: "Mehrsprachig", visuals: "Visuelle Produktion", care: "Betreuung" },
    price: "Geschätzter Projektpreis",
    month: " / Monat",
    monthCare: "/ Monat Betreuung",
    get: "Schätzung erhalten",
    update: "Schätzung aktualisieren",
    send: "Projektanfrage senden",
    readingBtn: "Lese …",
    calculatingBtn: "Berechne …",
    sending: "Sende …",
    back: "← Zurück",
    sent: "Gesendet",
    note: "Dies ist eine sofortige KI-Schätzung. Der endgültige Preis kann je nach Projektanforderungen variieren.",
    noteForm: "Ihre Beschreibung, die Optionen und die Schätzung werden mitgesendet.",
    noteSent: "Wir prüfen Ihr Projekt und melden uns in Kürze.",
    name: "Name",
    email: "E-Mail",
    company: "Unternehmen",
    message: "Weitere Nachricht",
    optional: " · optional",
    addName: "Bitte Namen angeben.",
    addEmail: "Bitte eine gültige E-Mail angeben.",
    failed: "Ihre Anfrage konnte gerade nicht gesendet werden. Bitte erneut versuchen.",
    tooMany: "Zu viele Anfragen. Bitte später erneut versuchen.",
    thanks: "Danke",
    received: "PROJEKT ERHALTEN.",
  },
  foot: { email: "E-Mail", contact: "Kontakt" },
};

const hr: Dict = {
  meta: { title: "codERA — Stvaramo digitalna iskustva" },
  nav: { process: "Proces", services: "Usluge", price: "Cijena", cta: "Započni projekt", home: "codERA — natrag na početak", language: "Jezik" },
  hero: { title: ["STVARAMO DIGITALNA", "ISKUSTVA."], sub: "Web razvoj · Vizualna produkcija · Održavanje stranica", cta: "Započni projekt", cue: "Pomaknite se prema dolje" },
  steps: [
    { title: ["VAŠA", "IDEJA."], sub: ["Vi donosite viziju.", "Mi joj dajemo smjer."] },
    { title: ["DIZAJN."], sub: ["Od prve skice", "do konačnog sučelja."] },
    { title: ["RAZVOJ."], sub: ["Čist, brz kod", "koji radi na svakom uređaju."] },
    { title: ["LANSI-", "RANJE."], sub: ["Testirano, objavljeno", "i spremno za rast."] },
  ],
  more: { title: ["STVARAMO VIŠE", "OD WEB STRANICA."], sub: "Web stranice. Vizuali. Digitalna iskustva." },
  services: [
    { title: ["WEB", "RAZVOJ."], sub: ["Web stranice po mjeri koje izgledaju", "izvanredno i rade besprijekorno."] },
    { title: ["VIZUALNA", "PRODUKCIJA."], sub: ["Vizuali zbog kojih brendovi", "ne prolaze nezapaženo."] },
    { title: ["ODRŽAVANJE", "WEB STRANICE."], sub: ["Vašu web stranicu održavamo ažurnom,", "uređenom i besprijekorno funkcionalnom."] },
  ],
  build: { title: ["SADA", "IZGRADIMO VAŠU."], sub: "Kreirajte svoj projekt. Dobijte trenutnu procjenu." },
  gen: {
    brand: "Generator cijene",
    online: "Dostupno",
    reading: "Čitam",
    calculating: "Računam",
    placeholder: "Recite nam što želite izgraditi...",
    ask: "Recite nam što želite izgraditi",
    hello: "Napišite svojim riječima — AI sam označi opcije.",
    readingLine: "Čitam vaš opis",
    understood: "Razumijem: ",
    hintMore: "Recite nešto više — ili označite opciju.",
    hintEmpty: "Napišite što želite izgraditi — ili označite opciju.",
    options: "Opcije",
    opt: { website: "Web stranica", shop: "Web trgovina", booking: "Rezervacije", multilingual: "Višejezičnost", visuals: "Vizualna produkcija", care: "Održavanje" },
    price: "Procijenjena cijena projekta",
    month: " / mjesec",
    monthCare: "/ mjesečno održavanje",
    get: "Izračunaj procjenu",
    update: "Ažuriraj procjenu",
    send: "Pošalji upit",
    readingBtn: "Čitam…",
    calculatingBtn: "Računam…",
    sending: "Šaljem…",
    back: "← Natrag",
    sent: "Poslano",
    note: "Ovo je trenutna AI procjena. Konačna cijena može se razlikovati ovisno o zahtjevima projekta.",
    noteForm: "Vaš opis, odabrane opcije i procjena su uključeni.",
    noteSent: "Pregledat ćemo vaš projekt i uskoro vam se javiti.",
    name: "Ime",
    email: "E-pošta",
    company: "Tvrtka",
    message: "Dodatna poruka",
    optional: " · neobavezno",
    addName: "Upišite ime.",
    addEmail: "Upišite valjanu e-poštu.",
    failed: "Upit trenutno nije moguće poslati. Pokušajte ponovno.",
    tooMany: "Previše zahtjeva. Pokušajte ponovno kasnije.",
    thanks: "Hvala",
    received: "PROJEKT ZAPRIMLJEN.",
  },
  foot: { email: "E-pošta", contact: "Kontakt" },
};

export const DICT: Record<Lang, Dict> = { en, sl, fr, es, de, hr };

/* ------------------------------------------------------------------ */
/*  The chosen language: remembered in the browser, ?lang=xx to share    */
/* ------------------------------------------------------------------ */

const KEY = "codera-lang";
let lang: Lang = "en";
const listeners = new Set<() => void>();

function initial(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (isLang(q)) return q;
    const s = window.localStorage.getItem(KEY);
    if (isLang(s)) return s;
  } catch {
    /* storage can be blocked: English */
  }
  return "en";
}
if (typeof window !== "undefined") lang = initial();

export function setLang(l: Lang) {
  if (l === lang) return;
  lang = l;
  try {
    window.localStorage.setItem(KEY, l);
  } catch {
    /* not remembered, still switched */
  }
  listeners.forEach((f) => f());
}

const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
/** The language (English while rendering on the server and hydrating). */
export const useLang = () => useSyncExternalStore(subscribe, () => lang, () => "en" as Lang);
export const useT = () => DICT[useLang()];

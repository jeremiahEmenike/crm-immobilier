import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── CONFIG ──────────────────────────────────────────────────────────────
const WA = "https://wa.me/22892424665?text=Bonjour%20!%20Je%20voudrais%20une%20démo%20de%20CERBERUS%20AI.";

// ─── IMAGES ──────────────────────────────────────────────────────────────
const IMG = {
  // Real Estate
  villa1: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  villa2: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  villa3: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  villa4: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  interior1: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  interior2: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800&q=80",
  interior3: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  pool: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  keys: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  // Restaurant
  resto1: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  resto2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  resto3: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
  food1: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  food2: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  food3: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
  chef: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
  // Medical
  clinic1: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
  clinic2: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80",
  clinic3: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
  doctor1: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
  doctor2: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
  medical1: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
  // E-commerce
  store1: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  store2: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80",
  products1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
  products2: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80",
  fashion1: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
  delivery: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
  // Avatars (professional African portraits)
  ama: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
  nova: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
  drSante: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
  chefBot: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80",
  // General
  aerial: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  dashboard: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  handshake: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
  calendar: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80",
  agent: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
};

// ─── SECTOR DATA ─────────────────────────────────────────────────────────
const SECTORS = [
  {
    key: "immo", name: "Immobilier", agent: "Ama", color: "#0071e3", avatar: IMG.ama,
    headline: "Ama.", sub: "Vend pendant\nque vous vivez.",
    desc: "L'agent commercial IA qui qualifie, matche et planifie vos visites immobilières. Sur WhatsApp. 24h/24.",
    heroImg: IMG.villa2, sideImg: IMG.keys,
    features: ["Qualification budget + zone + critères", "Matching IA par embeddings vectoriels", "Planification automatique de visites", "Scoring multi-dimensionnel 0→20"],
    msgs: [
      { from: "user", text: "Bonjour, je cherche un appartement à Cocody" },
      { from: "ama", text: "Bonjour ! Je suis Ama 🏠\nQuel est votre budget maximum ?" },
      { from: "user", text: "45 millions FCFA, 3 chambres" },
      { from: "ama", text: "Parfait ! Voici 2 biens :\n\n🏠 Villa Cocody Riviera\n42M · 4ch · Score: 94%\n\n📅 Visite dispo mardi 10h ?" },
    ],
    cards: [
      { img: IMG.villa1, title: "Villa Cocody Riviera", price: "65M FCFA", tag: "94%" },
      { img: IMG.interior1, title: "Appart Standing Angré", price: "38M FCFA", tag: "87%" },
      { img: IMG.pool, title: "Villa Piscine Bingerville", price: "120M FCFA", tag: "91%" },
      { img: IMG.villa4, title: "Duplex Marcory Z4", price: "52M FCFA", tag: "85%" },
      { img: IMG.interior3, title: "Studio Meublé Plateau", price: "15M FCFA", tag: "82%" },
    ],
    testimonial: { quote: "Depuis qu'Ama gère nos leads, on a doublé nos visites. Les prospects arrivent qualifiés, scorés, résumés. Notre équipe ne fait plus que closer.", name: "Kofi Asante", role: "Directeur Commercial", company: "Prestige Immobilier — Abidjan" },
  },
  {
    key: "ecom", name: "E-commerce", agent: "Nova", color: "#30d158", avatar: IMG.nova,
    headline: "Nova.", sub: "Vend pendant\nque vous dormez.",
    desc: "L'agent e-commerce IA qui suit les commandes, recommande des produits et relance les paniers abandonnés. 24h/24.",
    heroImg: IMG.store1, sideImg: IMG.delivery,
    features: ["Suivi commande en temps réel", "Recommandations produits par IA", "Relance panier abandonné", "Upsell & cross-sell automatique"],
    msgs: [
      { from: "user", text: "Salut ! Ma commande #4521 est où ?" },
      { from: "ama", text: "Hey ! Je suis Nova 👋\n\n📦 Commande #4521\nStatut: En livraison\n🚚 Arrivée: Demain 14h" },
      { from: "user", text: "Top ! Vous avez des nouveautés ?" },
      { from: "ama", text: "🔥 Top 3 cette semaine :\n\n1. Sneakers Urban — 45 000 F\n2. Sac Cuir — 28 000 F\n\n-10% si tu commandes now !" },
    ],
    cards: [
      { img: IMG.fashion1, title: "Collection Été", price: "45 000 F", tag: "Tendance" },
      { img: IMG.products1, title: "Accessoires Premium", price: "28 000 F", tag: "Best-seller" },
      { img: IMG.store2, title: "Boutique Flagship", price: "15 000 F", tag: "Nouveau" },
      { img: IMG.products2, title: "Pack Découverte", price: "19 500 F", tag: "Promo" },
      { img: IMG.delivery, title: "Livraison Express", price: "Gratuite", tag: "24h" },
    ],
    testimonial: { quote: "Nova a doublé nos ventes en 3 mois. Les relances panier automatiques sont une machine à cash. On ne peut plus s'en passer.", name: "Afi Mensah", role: "Fondatrice", company: "AfriStyle Boutique — Lomé" },
  },
  {
    key: "med", name: "Médical", agent: "Dr. Santé", color: "#ff375f", avatar: IMG.drSante,
    headline: "Dr. Santé.", sub: "Soigne pendant\nque vous vivez.",
    desc: "L'assistant médical IA qui gère les RDV, pré-qualifie les patients et automatise les rappels. 24h/24.",
    heroImg: IMG.clinic1, sideImg: IMG.medical1,
    features: ["Prise de RDV intelligente", "Pré-consultation automatisée", "Rappels & confirmations", "Triage par niveau d'urgence"],
    msgs: [
      { from: "user", text: "Bonjour, j'ai besoin d'un RDV dentiste" },
      { from: "ama", text: "Bonjour ! 🏥 RDV dentaire noté.\n\nDepuis quand avez-vous des douleurs ?" },
      { from: "user", text: "Douleur depuis 2 jours, côté droit" },
      { from: "ama", text: "Créneaux disponibles :\n\n📅 Lun 14h — Dr. Konan\n📅 Mar 10h — Dr. Mensah\n\nJe vous réserve ?" },
    ],
    cards: [
      { img: IMG.clinic2, title: "Consultation Générale", price: "15 000 F", tag: "Dispo" },
      { img: IMG.medical1, title: "Bilan Complet", price: "45 000 F", tag: "48h" },
      { img: IMG.doctor1, title: "Spécialiste", price: "25 000 F", tag: "Expert" },
      { img: IMG.clinic3, title: "Urgence", price: "Variable", tag: "< 1h" },
      { img: IMG.calendar, title: "Suivi Régulier", price: "12 000 F", tag: "Mensuel" },
    ],
    testimonial: { quote: "Les patients prennent RDV à 23h, le dimanche, depuis leur canapé. On ne rate plus aucune demande. C'est magique.", name: "Dr. Emmanuel K.", role: "Dentiste", company: "Clinique Dentaire Premium — Accra" },
  },
  {
    key: "resto", name: "Restaurant", agent: "Chef Bot", color: "#ff9f0a", avatar: IMG.chefBot,
    headline: "Chef Bot.", sub: "Remplit vos tables\nautomatiquement.",
    desc: "Le maître d'hôtel IA qui gère les réservations, les commandes et les promotions sur WhatsApp. 24h/24.",
    heroImg: IMG.resto1, sideImg: IMG.food1,
    features: ["Réservation de tables en temps réel", "Menu dynamique & commandes", "Promotions personnalisées", "Collecte d'avis automatique"],
    msgs: [
      { from: "user", text: "Bonsoir ! Table pour 4 samedi soir ?" },
      { from: "ama", text: "Bonsoir ! 🍽️ Samedi :\n\n• 19h — Terrasse\n• 20h30 — Salle VIP ⭐\n• 21h — Terrasse\n\nVotre choix ?" },
      { from: "user", text: "20h30 VIP ! Et le menu ?" },
      { from: "ama", text: "✅ VIP 20h30 réservée !\n\n🔥 Menu du Chef :\n• Thiéboudienne — 8 500 F\n• Brochettes — 6 000 F\n\nPré-commander ?" },
    ],
    cards: [
      { img: IMG.food2, title: "Menu Signature", price: "12 500 F", tag: "Chef" },
      { img: IMG.resto2, title: "Terrasse VIP", price: "Réservation", tag: "⭐" },
      { img: IMG.food3, title: "Brunch Weekend", price: "8 000 F", tag: "Nouveau" },
      { img: IMG.chef, title: "Événement Privé", price: "Sur devis", tag: "Premium" },
      { img: IMG.resto3, title: "Bar & Cocktails", price: "5 000 F", tag: "Happy Hour" },
    ],
    testimonial: { quote: "Chef Bot remplit nos tables du lundi au dimanche. Les réservations WhatsApp ont explosé de 300%. Et les avis positifs aussi.", name: "Marie-Claire D.", role: "Gérante", company: "Le Palmier Doré — Lomé" },
  },
];

const PLANS = [
  { name: "Growth", price: "299", desc: "Lancez votre premier agent.", leads: "100 leads/mois", features: ["1 agent IA WhatsApp 24/7", "Conversation Builder", "100 leads / mois", "1 numéro WhatsApp", "Analytics basique", "Templates sectoriels"], popular: false },
  { name: "Scale", price: "799", desc: "Dominez votre marché.", leads: "800 leads/mois", features: ["5 agents personnalisables", "Builder complet + IA", "800 leads / mois", "10 numéros WhatsApp", "Analytics avancé", "Toutes intégrations"], popular: true },
  { name: "Enterprise", price: null, desc: "Sur mesure pour les leaders.", leads: "Illimité", features: ["Agents illimités", "API + Custom nodes", "Numéros illimités", "Support dédié + SLA", "Formation équipe", "Custom branding"], popular: false },
];

const FAQS = [
  { q: "Quels secteurs sont supportés ?", a: "Immobilier, E-commerce, Médical et Restaurant. Chaque secteur a ses propres templates, scoring et intégrations pré-configurés. D'autres secteurs arrivent bientôt." },
  { q: "Combien de temps pour être opérationnel ?", a: "Moins de 10 minutes. Créez votre compte, choisissez votre secteur, personnalisez votre agent, connectez WhatsApp — c'est live." },
  { q: "Est-ce que l'IA remplace mes employés ?", a: "Non. L'IA qualifie et prépare les leads. Vos équipes se concentrent sur ce qu'elles font de mieux : closer les deals et servir les clients." },
  { q: "Puis-je avoir plusieurs agents ?", a: "Oui ! Growth inclut 1 agent, Scale 5 agents, Enterprise illimité. Chaque agent peut avoir son propre secteur et flux conversationnel." },
  { q: "Comment fonctionne le Conversation Builder ?", a: "C'est un éditeur visuel drag & drop. Vous designez le flux de votre agent avec des noeuds (messages, questions, conditions, actions IA). Zéro code." },
  { q: "Quels pays supportez-vous ?", a: "Tous les pays avec WhatsApp Business API. Nos marchés principaux : Côte d'Ivoire, Togo, Nigeria, Ghana. L'IA parle français et anglais." },
];

// ─── CSS ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  .landing-root{font-family:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;color:#1d1d1f;background:#fff;overflow-x:hidden}
  ::selection{background:rgba(0,113,227,.12)}
  .fu{opacity:0;transform:translateY(36px);transition:opacity .85s cubic-bezier(.22,1,.36,1),transform .85s cubic-bezier(.22,1,.36,1)}
  .fu.v{opacity:1;transform:translateY(0)}
  .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes slideR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideL{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes notifSlide{from{opacity:0;transform:translateX(30px) scale(.95)}to{opacity:1;transform:translateX(0) scale(1)}}
  @keyframes notifExit{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}
  @keyframes ring{0%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-14deg)}30%{transform:rotate(8deg)}40%{transform:rotate(-8deg)}50%,100%{transform:rotate(0)}}
  .lp-label{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin-bottom:16px}
  .img-hover{transition:transform .6s cubic-bezier(.22,1,.36,1)}.img-hover:hover{transform:scale(1.03)}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d2d2d7;border-radius:3px}
`;

// ─── HOOKS ───────────────────────────────────────────────────────────────
function useInView() {
  const r = useRef(null);
  const [v, s] = useState(false);
  useEffect(() => {
    const e = r.current;
    if (!e) return;
    const o = new IntersectionObserver(([x]) => { if (x.isIntersecting) { s(true); o.unobserve(e); } }, { threshold: 0.1 });
    o.observe(e);
    return () => o.disconnect();
  }, []);
  return [r, v];
}

function F({ children, d = 0, style = {} }) {
  const [r, v] = useInView();
  return <div ref={r} className={`fu${v ? " v" : ""}${d ? ` d${d}` : ""}`} style={style}>{children}</div>;
}

// ─── NAV ─────────────────────────────────────────────────────────────────
function Nav({ onAuth }) {
  const [s, setS] = useState(false);
  useEffect(() => { const h = () => setS(window.scrollY > 40); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: s ? "rgba(255,255,255,.85)" : "transparent", backdropFilter: s ? "blur(20px) saturate(180%)" : "none", WebkitBackdropFilter: s ? "blur(20px) saturate(180%)" : "none", borderBottom: s ? "1px solid rgba(0,0,0,.06)" : "1px solid transparent", transition: "all .5s cubic-bezier(.25,.46,.45,.94)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1d1d1f,#3a3a3c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>C</div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.5px" }}>CERBERUS<span style={{ fontWeight: 300, color: "#86868b", marginLeft: 5 }}>AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[{ t: "Secteurs", h: "#secteurs" }, { t: "Produit", h: "#produit" }, { t: "Tarifs", h: "#tarifs" }, { t: "FAQ", h: "#faq" }].map(x => <a key={x.t} href={x.h} style={{ textDecoration: "none", color: "#6e6e73", fontSize: 14, fontWeight: 500, transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "#1d1d1f"} onMouseLeave={e => e.target.style.color = "#6e6e73"}>{x.t}</a>)}
          <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "10px 22px", borderRadius: 980, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "all .2s" }} onMouseEnter={e => e.target.style.background = "#0077ed"} onMouseLeave={e => e.target.style.background = "#0071e3"}>Démarrer</button>
        </div>
      </div>
    </nav>
  );
}

// ─── WHATSAPP PHONE ──────────────────────────────────────────────────────
function WhatsAppPhone({ msgs, agentName, color, avatar }) {
  const [step, setStep] = useState(0);
  const cRef = useRef(null);
  useEffect(() => {
    setStep(0);
    const delays = [900, 1600, 1400, 1800];
    let t, cancelled = false;
    const run = () => {
      let i = 0;
      const advance = () => {
        if (cancelled) return;
        if (i >= msgs.length) {
          t = setTimeout(() => { if (!cancelled) { setStep(0); t = setTimeout(run, 1200); } }, 3000);
          return;
        }
        t = setTimeout(() => { if (!cancelled) { setStep(i + 1); i++; advance(); } }, delays[i % delays.length]);
      };
      advance();
    };
    run();
    return () => { cancelled = true; clearTimeout(t); };
  }, [agentName]);
  useEffect(() => { if (cRef.current) cRef.current.scrollTop = cRef.current.scrollHeight; }, [step]);

  return (
    <div style={{ width: 290, borderRadius: 48, overflow: "hidden", border: "4px solid #8CBED6", background: "#8CBED6", boxShadow: "0 30px 80px rgba(0,0,0,.18), 0 0 0 1px rgba(255,255,255,.25) inset", animation: "float 7s ease-in-out infinite" }}>
      {/* iPhone Status Bar + Dynamic Island */}
      <div style={{ height: 52, background: "#000", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 22px 6px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>9:41</span>
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 110, height: 28, borderRadius: 20, background: "#1a1a1a", boxShadow: "0 0 0 1px rgba(255,255,255,.06) inset" }} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="4" width="2.5" height="6" rx="0.5" fill="#fff"/><rect x="3.5" y="2.5" width="2.5" height="7.5" rx="0.5" fill="#fff"/><rect x="7" y="1" width="2.5" height="9" rx="0.5" fill="#fff"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#fff"/></svg>
          <svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2C8.5 2 10.3 2.8 11.5 4.2L6.5 10 1.5 4.2C2.7 2.8 4.5 2 6.5 2Z" fill="#fff"/></svg>
          <div style={{ width: 20, height: 9, borderRadius: 2, border: "1px solid rgba(255,255,255,.4)", position: "relative", display: "flex", alignItems: "center", padding: 1 }}>
            <div style={{ width: "72%", height: "100%", borderRadius: 1, background: "#34C759" }} />
            <div style={{ position: "absolute", right: -3, top: 2.5, width: 2, height: 4, borderRadius: "0 1px 1px 0", background: "rgba(255,255,255,.3)" }} />
          </div>
        </div>
      </div>
      {/* WhatsApp Header */}
      <div style={{ background: "#075E54", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,.6)" }}>‹</div>
        <img src={avatar} alt="" style={{ width: 34, height: 34, borderRadius: 17, objectFit: "cover", border: "2px solid rgba(255,255,255,.15)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{agentName}</div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#25D366", animation: "pulse 2s infinite" }} />en ligne
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 10l-4 4-4-4" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round"/></svg>
      </div>
      {/* Chat */}
      <div ref={cRef} style={{ padding: "8px 8px", height: 320, overflowY: "auto", overflowX: "hidden", background: "#ECE5DD", display: "flex", flexDirection: "column", gap: 4, scrollbarWidth: "none" }}>
        {msgs.slice(0, step).map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "80%", animation: m.from === "user" ? "slideR .35s cubic-bezier(.22,1,.36,1)" : "slideL .35s cubic-bezier(.22,1,.36,1)" }}>
            <div style={{ background: m.from === "user" ? "#DCF8C6" : "#fff", padding: "6px 9px", borderRadius: 9, fontSize: 11.5, lineHeight: 1.4, color: "#1a1a1a", whiteSpace: "pre-line", boxShadow: "0 1px 1px rgba(0,0,0,.05)", borderTopRightRadius: m.from === "user" ? 3 : 9, borderTopLeftRadius: m.from === "ama" ? 3 : 9 }}>
              {m.text}
              <div style={{ fontSize: 9, color: "#999", textAlign: "right", marginTop: 2 }}>{`14:${String(i * 2).padStart(2, "0")}`}{m.from === "user" && " ✓✓"}</div>
            </div>
          </div>
        ))}
        {step > 0 && step < msgs.length && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ background: "#fff", padding: "8px 13px", borderRadius: 9, display: "flex", gap: 3, boxShadow: "0 1px 1px rgba(0,0,0,.05)" }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "#999", animation: `pulse 1s infinite ${j * .15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      {/* WhatsApp Input Bar */}
      <div style={{ background: "#f0f0f0", padding: "6px 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: "7px 12px", fontSize: 11, color: "#86868b" }}>Message...</div>
        <div style={{ width: 28, height: 28, borderRadius: 14, background: "#075E54", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      {/* iPhone Home Indicator */}
      <div style={{ height: 18, background: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 100, height: 4, borderRadius: 2, background: "#3a3a3c" }} />
      </div>
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────
function Hero({ onAuth }) {
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive(p => (p + 1) % SECTORS.length), 5000); return () => clearInterval(t); }, []);
  const sec = SECTORS[active];
  const gridImgs = [IMG.villa1, IMG.food1, IMG.clinic1, IMG.store1, IMG.interior1, IMG.resto1];

  return (
    <section style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#f5f5f7" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, opacity: .12, filter: "blur(1px)" }}>{gridImgs.map((s, i) => <div key={i} style={{ backgroundImage: `url(${s})`, backgroundSize: "cover", backgroundPosition: "center" }} />)}</div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(245,245,247,.85) 0%,rgba(255,255,255,.95) 60%,#fff 100%)" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "160px 24px 100px", position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px", maxWidth: 560 }}>
          <F><div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 980, padding: "7px 16px", marginBottom: 32, border: "1px solid #e8e8ed", boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759", animation: "pulse 2s infinite" }} /><span style={{ fontSize: 12, fontWeight: 500, color: "#6e6e73" }}>4 agents IA actifs · 24/7</span></div></F>
          <F d={1}>
            <h1 style={{ fontSize: "clamp(48px,6vw,76px)", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-.05em", marginBottom: 20, transition: "color .4s" }}>
              <span style={{ color: sec.color, transition: "color .4s" }}>{sec.headline}</span><br />
              <span style={{ color: "#86868b", whiteSpace: "pre-line" }}>{sec.sub}</span>
            </h1>
          </F>
          <F d={2}><p style={{ fontSize: 19, lineHeight: 1.55, color: "#6e6e73", marginBottom: 28, maxWidth: 440 }}>{sec.desc}</p></F>
          <F d={3}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 36 }}>
              {SECTORS.map((s, i) => (
                <button key={s.key} onClick={() => setActive(i)} style={{ padding: "8px 18px", borderRadius: 980, border: active === i ? "none" : "1px solid #e8e8ed", background: active === i ? s.color : "#fff", color: active === i ? "#fff" : "#6e6e73", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .3s", boxShadow: active === i ? `0 4px 16px ${s.color}30` : "none" }}>{s.name}</button>
              ))}
            </div>
          </F>
          <F d={4}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "16px 32px", borderRadius: 980, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,113,227,.2)" }}>Essayer gratuitement</button>
              <a href="#secteurs" style={{ color: "#0071e3", padding: "16px 20px", fontSize: 17, fontWeight: 600, textDecoration: "none" }}>Voir la démo →</a>
            </div>
          </F>
          <F d={5}>
            <div style={{ display: "flex", gap: 18 }}>
              {SECTORS.map((s, i) => (
                <div key={i} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setActive(i)}>
                  <div style={{ width: 66, height: 66, borderRadius: 33, overflow: "hidden", boxShadow: active === i ? `0 8px 24px ${s.color}30` : "0 4px 12px rgba(0,0,0,.06)", border: active === i ? `3px solid ${s.color}` : "3px solid #e8e8ed", margin: "0 auto 8px", transition: "all .4s" }}><img src={s.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active === i ? s.color : "#86868b", transition: "color .4s" }}>{s.agent}</div>
                </div>
              ))}
            </div>
          </F>
        </div>
        <F d={2}><WhatsAppPhone msgs={sec.msgs} agentName={sec.agent} color={sec.color} avatar={sec.avatar} /></F>
      </div>
      <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid #e8e8ed", background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
          {[{ n: "< 3s", l: "Temps de réponse" }, { n: "24/7", l: "Disponibilité" }, { n: "4", l: "Secteurs d'activité" }, { n: "3x", l: "Plus de conversions" }].map((s, i) => <div key={i} style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.04em" }}>{s.n}</div><div style={{ fontSize: 12, color: "#86868b", marginTop: 4, fontWeight: 500 }}>{s.l}</div></div>)}
        </div>
      </div>
    </section>
  );
}

// ─── SECTOR DEEP DIVE ────────────────────────────────────────────────────
function SectorDeep({ sector, reverse }) {
  return (
    <section style={{ padding: "120px 0", background: reverse ? "#f5f5f7" : "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header with large image */}
        <div style={{ borderRadius: 28, overflow: "hidden", height: 420, position: "relative", marginBottom: 64, boxShadow: "0 16px 50px rgba(0,0,0,.08)" }}>
          <img src={sector.heroImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,.6) 100%)" }} />
          <div style={{ position: "absolute", bottom: 36, left: 40 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#fff", background: `${sector.color}cc`, backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 6, marginBottom: 12 }}>{sector.name.toUpperCase()}</div>
            <h2 style={{ fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.04em", color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,.3)" }}>{sector.headline} <span style={{ fontWeight: 300, opacity: .7 }}>{sector.sub.replace("\n", " ")}</span></h2>
          </div>
        </div>

        {/* Content: features + phone */}
        <div style={{ display: "flex", gap: 64, alignItems: "center", flexWrap: "wrap", marginBottom: 80 }}>
          <div style={{ flex: "1 1 400px", order: reverse ? 2 : 1 }}>
            <F><p className="lp-label" style={{ color: sector.color }}>{sector.name}</p></F>
            <F d={1}><p style={{ fontSize: 19, lineHeight: 1.65, color: "#6e6e73", marginBottom: 32, maxWidth: 480 }}>{sector.desc}</p></F>
            <F d={2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
                {sector.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${sector.color}0a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sector.color }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </F>
            <F d={3}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 68, height: 68, borderRadius: 34, overflow: "hidden", boxShadow: `0 8px 28px ${sector.color}25`, border: `3px solid ${sector.color}`, flexShrink: 0 }}><img src={sector.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", color: "#1d1d1f" }}>{sector.agent}</div>
              </div>
            </F>
          </div>
          <F d={2} style={{ flex: "0 0 auto", order: reverse ? 1 : 2 }}>
            <WhatsAppPhone msgs={sector.msgs} agentName={sector.agent} color={sector.color} avatar={sector.avatar} />
          </F>
        </div>

        {/* Showcase cards */}
        <F d={3}>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", paddingBottom: 8 }}>
            {sector.cards.map((c, i) => (
              <div key={i} style={{ flex: "0 0 260px", borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,.06)", border: "1px solid #e8e8ed", transition: "transform .4s", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-6px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ height: 160, position: "relative", overflow: "hidden" }}>
                  <img src={c.img} alt="" className="img-hover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: sector.color }}>{c.tag}</div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: sector.color, marginTop: 4 }}>{c.price}</div>
                </div>
              </div>
            ))}
          </div>
        </F>
      </div>
    </section>
  );
}

// ─── PIPELINE ────────────────────────────────────────────────────────────
function Pipeline() {
  const stages = [
    { name: "Nouveau Message", pct: "100%", color: "#0071e3", icon: "💬", desc: "WhatsApp reçu → IA répond en < 3s" },
    { name: "Contacté", pct: "95%", color: "#5856d6", icon: "🤖", desc: "Agent IA engage la conversation" },
    { name: "Qualifié", pct: "72%", color: "#34c759", icon: "✅", desc: "Intent + budget + besoins collectés" },
    { name: "Proposé", pct: "65%", color: "#ff9500", icon: "🎯", desc: "Biens / Produits / Créneaux proposés" },
    { name: "Réservé", pct: "48%", color: "#ff3b30", icon: "📅", desc: "RDV / commande / réservation confirmé" },
    { name: "Converti", pct: "34%", color: "#C9A84C", icon: "🔑", desc: "Transaction conclue" },
  ];
  return (
    <section id="produit" style={{ padding: "140px 24px", background: "#f5f5f7" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>Pipeline automatisé</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.04em" }}>Du premier message<br /><span style={{ color: "#86868b" }}>à la conversion.</span></h2></F>
          <F d={2}><p style={{ fontSize: 18, color: "#6e6e73", maxWidth: 520, margin: "20px auto 0", lineHeight: 1.6 }}>Chaque lead progresse automatiquement. Votre agent gère chaque étape — quel que soit le secteur.</p></F>
        </div>
        <F d={3}><div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 800, margin: "0 auto" }}>
          {stages.map((s, i) => { const w = 100 - i * 11; return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: `0 0 ${w}%`, maxWidth: `${w}%`, background: `${s.color}08`, borderRadius: 14, padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, borderLeft: `4px solid ${s.color}`, transition: "all .3s", cursor: "default", marginBottom: i < stages.length - 1 ? 6 : 0, marginLeft: `${(100 - w) / 2}%` }} onMouseEnter={e => { e.currentTarget.style.background = s.color + "14"; e.currentTarget.style.transform = "scale(1.02)"; }} onMouseLeave={e => { e.currentTarget.style.background = s.color + "08"; e.currentTarget.style.transform = "scale(1)"; }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.02em" }}>{s.name}</div><div style={{ fontSize: 13, color: "#6e6e73", marginTop: 2 }}>{s.desc}</div></div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-.03em" }}>{s.pct}</div>
              </div>
            </div>
          ); })}
        </div></F>
        <F d={4}><div style={{ textAlign: "center", marginTop: 56 }}><p style={{ fontSize: 15, color: "#86868b", marginBottom: 6 }}>Résultat moyen chez nos clients</p><p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.03em" }}>34% de taux de conversion <span style={{ color: "#34c759" }}>↑</span></p></div></F>
      </div>
    </section>
  );
}

// ─── PRODUCT PILLARS ─────────────────────────────────────────────────────
function Product() {
  const products = [
    { tag: "QUALIFICATION", title: "Pose les bonnes questions.\nScore les bons leads.", desc: "Scoring multi-dimensionnel configurable par secteur. Classification automatique HOT → COLD.", features: ["Scoring adapté à chaque secteur", "Classification HOT / QUALIFIED / WARM / COLD", "Collecte progressive sur WhatsApp"], visual: IMG.villa2, side: IMG.keys },
    { tag: "MATCHING IA", title: "Comprend les intentions.\nPropose la meilleure option.", desc: "Matching sémantique par embeddings. Biens immobiliers, produits, créneaux médicaux ou tables de restaurant.", features: ["Embeddings vectoriels pgvector", "Compréhension contextuelle", "Propositions personnalisées + % de match"], visual: IMG.food2, side: IMG.interior1 },
    { tag: "BOOKING", title: "De la demande au RDV.\nZéro appel.", desc: "Visites immobilières, commandes e-commerce, RDV médicaux, réservations restaurant. Tout automatisé.", features: ["Créneaux automatiques multi-secteur", "Rappels H-24 et H-2", "Confirmation WhatsApp instantanée"], visual: IMG.clinic2, side: IMG.calendar },
    { tag: "SUIVI & RELANCE", title: "Aucun lead n'est oublié.\nJamais.", desc: "Post-visite, relance panier, rappel RDV, avis restaurant. Nurturing intelligent à long terme.", features: ["Relance intelligente par IA", "Feedback post-interaction", "Nurturing leads / clients froids"], visual: IMG.handshake, side: IMG.store2 },
  ];
  return (
    <section style={{ padding: "140px 0", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 100 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>Produit</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.04em" }}>Quatre piliers. <span style={{ color: "#86868b" }}>Tous secteurs.</span></h2></F>
        </div>
        {products.map((p, i) => (
          <F key={i}><div style={{ marginBottom: i < products.length - 1 ? 140 : 0 }}>
            <div style={{ borderRadius: 28, overflow: "hidden", height: 420, position: "relative", marginBottom: 48, boxShadow: "0 16px 50px rgba(0,0,0,.08)" }}>
              <img src={p.visual} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5) 100%)" }} />
              <div style={{ position: "absolute", bottom: 32, left: 36 }}>
                <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: "#fff", background: "rgba(0,113,227,.8)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 6, marginBottom: 12 }}>{p.tag}</div>
                <h3 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-.03em", color: "#fff", whiteSpace: "pre-line", textShadow: "0 2px 20px rgba(0,0,0,.3)" }}>{p.title}</h3>
              </div>
            </div>
            <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap", padding: "0 12px" }}>
              <div style={{ flex: "1 1 300px", borderRadius: 20, overflow: "hidden", height: 240, boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}><img src={p.side} alt="" className="img-hover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div style={{ flex: "1 1 400px" }}>
                <p style={{ fontSize: 17, lineHeight: 1.7, color: "#6e6e73", marginBottom: 28, maxWidth: 440 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {p.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0071e3" }} /></div>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div></F>
        ))}
      </div>
    </section>
  );
}

// ─── CRM DEMO ────────────────────────────────────────────────────────────
function CRMDemo() {
  const [tab, setTab] = useState("leads");
  const colors = { HOT: "#ff3b30", QUALIFIED: "#34c759", WARM: "#ff9500", COLD: "#86868b" };
  return (
    <section style={{ padding: "140px 24px", background: "#f5f5f7" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 48, alignItems: "center", marginBottom: 64, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <F><p className="lp-label" style={{ color: "#0071e3" }}>CRM Dashboard</p></F>
            <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.04em", marginBottom: 16 }}>Votre centre<br />de contrôle.</h2></F>
            <F d={2}><p style={{ fontSize: 17, color: "#6e6e73", lineHeight: 1.6 }}>Tous vos agents, leads et conversions. Un seul dashboard multi-secteur.</p></F>
          </div>
          <F d={3}><div style={{ flex: "0 0 320px", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.08)" }}><img src={IMG.dashboard} alt="" style={{ width: "100%", height: 220, objectFit: "cover" }} /></div></F>
        </div>
        <F d={3}>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
            {[["leads", "Leads"], ["agents", "Agents"], ["analytics", "Analytics"]].map(([k, v]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 24px", borderRadius: 980, border: "none", background: tab === k ? "#1d1d1f" : "transparent", color: tab === k ? "#fff" : "#86868b", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .3s" }}>{v}</button>)}
          </div>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.06)", border: "1px solid #e8e8ed" }}>
            <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e8e8ed" }}>
              <div style={{ display: "flex", gap: 6 }}>{["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}</div>
              <div style={{ flex: 1, textAlign: "center" }}><div style={{ display: "inline-flex", background: "#f5f5f7", borderRadius: 8, padding: "5px 16px", fontSize: 12, color: "#86868b" }}>🔒 app.cerberusai.com</div></div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                {[{ l: "Leads total", v: "184", c: "+32%", cc: "#0071e3" }, { l: "HOT", v: "23", c: "+8", cc: "#ff3b30" }, { l: "Conversions", v: "47", c: "+15", cc: "#34c759" }, { l: "Taux", v: "34%", c: "+8%", cc: "#C9A84C" }].map((k, i) => <div key={i} style={{ background: "#fafafa", borderRadius: 14, padding: "16px 14px", border: "1px solid #f0f0f0" }}><div style={{ fontSize: 11, color: "#86868b", marginBottom: 6 }}>{k.l}</div><div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em" }}>{k.v}</span><span style={{ fontSize: 11, fontWeight: 600, color: k.cc }}>{k.c}</span></div></div>)}
              </div>
              {tab === "leads" && <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr .8fr 1fr", padding: "10px 14px", background: "#fafafa", fontSize: 10.5, fontWeight: 600, color: "#86868b", letterSpacing: ".04em", borderBottom: "1px solid #f0f0f0" }}><span>NOM</span><span>SECTEUR</span><span>SCORE</span><span>STATUS</span><span>AGENT</span></div>
                {[{ n: "M. Diallo", s: "Immobilier", sc: 18, st: "HOT", a: "Ama" }, { n: "Mme Mensah", s: "E-commerce", sc: 15, st: "QUALIFIED", a: "Nova" }, { n: "Dr. Kouamé", s: "Médical", sc: 12, st: "QUALIFIED", a: "Dr. Santé" }, { n: "M. Adeyemi", s: "Restaurant", sc: 9, st: "WARM", a: "Chef Bot" }, { n: "Mme Koffi", s: "Immobilier", sc: 5, st: "COLD", a: "Ama" }].map((l, i) => <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr .8fr 1fr", padding: "12px 14px", borderTop: i > 0 ? "1px solid #f5f5f7" : "none", fontSize: 13, color: "#6e6e73", alignItems: "center" }}><span style={{ fontWeight: 600, color: "#1d1d1f" }}>{l.n}</span><span>{l.s}</span><span style={{ fontWeight: 700, color: colors[l.st] }}>{l.sc}/20</span><span><span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, background: colors[l.st] + "10", color: colors[l.st] }}>{l.st}</span></span><span style={{ fontSize: 12 }}>{l.a}</span></div>)}
              </div>}
              {tab === "agents" && <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {SECTORS.map((s, i) => <div key={i} style={{ borderRadius: 22, padding: "28px 16px", border: "1px solid #f0f0f0", textAlign: "center", background: "#fafafa", transition: "transform .3s, box-shadow .3s", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${s.color}15`; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden", margin: "0 auto 14px", border: `3px solid ${s.color}`, boxShadow: `0 8px 24px ${s.color}18` }}><img src={s.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.agent}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#e8fce8", borderRadius: 980, padding: "3px 10px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34c759" }} /><span style={{ fontSize: 10, color: "#34c759", fontWeight: 600 }}>Actif 24/7</span></div>
                </div>)}
              </div>}
              {tab === "analytics" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {SECTORS.map((s, i) => <div key={i} style={{ borderRadius: 14, padding: "18px 16px", border: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: s.color }} /><span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span></div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", background: s.color, borderRadius: 3, width: `${70 - i * 12}%`, transition: "width 1s" }} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#86868b" }}><span>{46 - i * 8} leads</span><span>{34 - i * 4}% conv.</span></div>
                </div>)}
              </div>}
            </div>
          </div>
        </F>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section style={{ padding: "120px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <F><p className="lp-label" style={{ color: "#86868b" }}>Témoignages</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 700, letterSpacing: "-.04em" }}>Ils ont déployé. <span style={{ color: "#86868b" }}>Ils dominent.</span></h2></F>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
          {SECTORS.map((s, i) => (
            <F key={i} d={i + 1}><div style={{ background: "#fafafa", borderRadius: 20, padding: "32px 28px", border: "1px solid #e8e8ed", transition: "transform .3s", height: "100%", display: "flex", flexDirection: "column" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ borderLeft: `3px solid ${s.color}`, paddingLeft: 16, marginBottom: 24, flex: 1 }}>
                <div style={{ fontSize: 36, color: "#e8e8ed", fontWeight: 300, marginBottom: 8 }}>"</div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "#6e6e73", fontStyle: "italic" }}>{s.testimonial.quote}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={s.avatar} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: "cover", border: "2px solid #e8e8ed" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.testimonial.name}</div>
                  <div style={{ fontSize: 12, color: "#86868b" }}>{s.testimonial.role} · {s.testimonial.company}</div>
                </div>
              </div>
            </div></F>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ─────────────────────────────────────────────────────────────
function Pricing({ onAuth }) {
  return (
    <section id="tarifs" style={{ padding: "140px 24px", background: "#f5f5f7" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>Tarifs</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 700, letterSpacing: "-.04em" }}>Un plan pour chaque ambition.</h2></F>
          <F d={2}><p style={{ fontSize: 17, color: "#6e6e73", marginTop: 12 }}>Pas de frais cachés. Pas d'engagement. Annulation en un clic.</p></F>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 18 }}>
          {PLANS.map((p, i) => (
            <F key={i} d={i + 1}><div style={{ background: "#fff", borderRadius: 24, padding: "44px 32px", border: p.popular ? "2px solid #0071e3" : "1px solid #e8e8ed", position: "relative", height: "100%", display: "flex", flexDirection: "column", transition: "transform .3s,box-shadow .3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,.07)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              {p.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#0071e3", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 18px", borderRadius: 980 }}>Le plus populaire</div>}
              <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 14, color: "#86868b", marginBottom: 20 }}>{p.desc}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                {p.price ? <><span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-.04em" }}>${p.price}</span><span style={{ fontSize: 15, color: "#86868b" }}>/mois</span></> : <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.04em" }}>Sur mesure</span>}
              </div>
              <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "#0071e3", background: "rgba(0,113,227,.06)", padding: "5px 12px", borderRadius: 8, marginBottom: 28 }}>{p.leads}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 22, borderTop: "1px solid #f0f0f0", marginBottom: 28 }}>
                {p.features.map((f, fi) => <div key={fi} style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: "#0071e3", fontSize: 13 }}>✓</span><span style={{ fontSize: 14, color: "#6e6e73" }}>{f}</span></div>)}
              </div>
              {p.price ? (
                <button onClick={onAuth} style={{ display: "block", width: "100%", padding: 16, borderRadius: 14, border: "none", background: p.popular ? "#0071e3" : "#f5f5f7", color: p.popular ? "#fff" : "#1d1d1f", fontSize: 16, fontWeight: 700, textAlign: "center", cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={e => e.target.style.opacity = ".85"} onMouseLeave={e => e.target.style.opacity = "1"}>Commencer</button>
              ) : (
                <a href={WA} target="_blank" rel="noopener" style={{ display: "block", width: "100%", padding: 16, borderRadius: 14, border: "none", background: "#f5f5f7", color: "#1d1d1f", fontSize: 16, fontWeight: 700, textAlign: "center", textDecoration: "none", cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={e => e.target.style.opacity = ".85"} onMouseLeave={e => e.target.style.opacity = "1"}>Nous contacter</a>
              )}
            </div></F>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ENTERPRISE ──────────────────────────────────────────────────────────
function Enterprise() {
  return (
    <section style={{ padding: "120px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 56, alignItems: "center", flexWrap: "wrap" }}>
        <F><div style={{ flex: "1 1 420px", borderRadius: 24, overflow: "hidden", height: 360, boxShadow: "0 16px 50px rgba(0,0,0,.08)" }}><img src={IMG.office} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div></F>
        <div style={{ flex: "1 1 400px" }}>
          <F><p className="lp-label" style={{ color: "#86868b" }}>Entreprise</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-.04em", marginBottom: 16 }}>Multi-branches.<br />Multi-secteurs.<br /><span style={{ color: "#86868b" }}>Un seul CERBERUS.</span></h2></F>
          <F d={2}><div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 28 }}>
            {[{ i: "🏢", t: "Multi-branches", d: "Chaque ville, ses agents et données isolés." }, { i: "🔒", t: "Isolation totale", d: "L'Agence A ne voit jamais les leads de B." }, { i: "📊", t: "Dashboard centralisé", d: "KPIs globaux, par branche et par secteur." }, { i: "⚙️", t: "API & Intégrations", d: "CRM, Calendar, Shopify, webhooks." }].map((f, i) => <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.i}</div>
              <div><div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{f.t}</div><div style={{ fontSize: 14, color: "#6e6e73" }}>{f.d}</div></div>
            </div>)}
          </div></F>
          <F d={3}><a href={WA} target="_blank" rel="noopener" style={{ display: "inline-flex", marginTop: 36, background: "#1d1d1f", color: "#fff", padding: "16px 32px", borderRadius: 980, fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all .2s" }} onMouseEnter={e => e.target.style.background = "#3a3a3c"} onMouseLeave={e => e.target.style.background = "#1d1d1f"}>Parler à l'équipe →</a></F>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" style={{ padding: "140px 24px", background: "#f5f5f7" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <F><p className="lp-label" style={{ color: "#86868b" }}>FAQ</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 700, letterSpacing: "-.04em" }}>Questions fréquentes.</h2></F>
        </div>
        {FAQS.map((f, i) => (
          <F key={i}><div onClick={() => setOpen(open === i ? null : i)} style={{ borderBottom: "1px solid #d2d2d7", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", gap: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>{f.q}</h3>
              <span style={{ fontSize: 22, color: "#86868b", flexShrink: 0, transition: "transform .3s", fontWeight: 300, transform: open === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
            </div>
            <div style={{ maxHeight: open === i ? 200 : 0, overflow: "hidden", transition: "max-height .4s cubic-bezier(.22,1,.36,1)" }}>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6e6e73", paddingBottom: 22 }}>{f.a}</p>
            </div>
          </div></F>
        ))}
      </div>
    </section>
  );
}

// ─── FINAL CTA ───────────────────────────────────────────────────────────
function FinalCTA({ onAuth }) {
  return (
    <section style={{ position: "relative", padding: "160px 24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}><img src={IMG.aerial} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.35)" }} /></div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,rgba(0,113,227,.1),transparent 60%)" }} />
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <F><h2 style={{ fontSize: "clamp(40px,5vw,64px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.04em", color: "#fff", marginBottom: 20 }}>Prêt à laisser l'IA<br />closer pour vous ?</h2></F>
        <F d={1}><p style={{ fontSize: 18, color: "rgba(255,255,255,.6)", marginBottom: 44, lineHeight: 1.6 }}>Choisissez votre secteur. Déployez votre agent. Premiers leads qualifiés dès demain.</p></F>
        <F d={2}><div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "18px 40px", borderRadius: 980, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,113,227,.3)" }}>Commencer maintenant</button>
          <a href={WA} target="_blank" rel="noopener" style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)", color: "#fff", padding: "18px 40px", borderRadius: 980, fontSize: 17, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,.2)" }}>Démo WhatsApp →</a>
        </div></F>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "56px 24px 36px", background: "#f5f5f7", borderTop: "1px solid #e8e8ed" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#1d1d1f,#3a3a3c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>C</div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>CERBERUS<span style={{ fontWeight: 300, color: "#86868b", marginLeft: 4 }}>AI</span></span>
          </div>
          <p style={{ fontSize: 13, color: "#86868b", maxWidth: 260, lineHeight: 1.6 }}>Plateforme multi-agent IA pour WhatsApp. Immobilier, E-commerce, Médical & Restaurant.</p>
        </div>
        {[{ t: "Produit", l: ["Fonctionnalités", "Secteurs", "Tarifs", "CRM", "Démo"] }, { t: "Entreprise", l: ["À propos", "Contact", "Partenaires", "Blog"] }, { t: "Légal", l: ["Confidentialité", "CGV", "Mentions légales"] }].map((c, i) => (
          <div key={i}><h4 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "#86868b", marginBottom: 14 }}>{c.t}</h4><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{c.l.map((l, li) => <a key={li} href="#" style={{ fontSize: 14, color: "#6e6e73", textDecoration: "none", transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "#1d1d1f"} onMouseLeave={e => e.target.style.color = "#6e6e73"}>{l}</a>)}</div></div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 20, borderTop: "1px solid #e8e8ed", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868b", flexWrap: "wrap", gap: 8 }}>
        <span>© 2026 CERBERUS AI SarlU</span>
        <span>Lomé · Abidjan · Lagos · Accra</span>
      </div>
    </footer>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────────────────
function AuthModal({ mode, onClose }) {
  const [tab, setTab] = useState(mode || "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!supabase) { setError("Configuration Supabase manquante."); return; }
    setError(""); setLoading(true);
    try {
      if (tab === "signup") {
        // 1. Sign up
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (authErr) throw authErr;
        // 2. Create tenant
        if (authData.user) {
          await supabase.from("tenants").insert({
            id: authData.user.id,
            name: name || email.split("@")[0],
            email: email,
            plan: "growth",
            onboarding_completed: false,
          }).select().single().catch(() => {});
        }
        // 3. Redirect to CRM (wizard will show)
        setSuccess("Compte créé ! Redirection...");
        setTimeout(() => { window.location.href = "/app"; }, 1200);
      } else {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
        window.location.href = "/app";
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : err.message || "Erreur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/app" } });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.4)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,.18)", position: "relative" }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, border: "none", background: "#f5f5f7", cursor: "pointer", fontSize: 16, color: "#86868b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#1d1d1f,#3a3a3c)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 12 }}>C</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.03em" }}>{tab === "signup" ? "Créer votre compte" : "Content de vous revoir"}</h2>
          <p style={{ fontSize: 14, color: "#86868b", marginTop: 6 }}>{tab === "signup" ? "Déployez votre agent IA en 10 minutes." : "Connectez-vous à votre espace."}</p>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e8e8ed", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15, fontWeight: 600, color: "#1d1d1f", marginBottom: 20, transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f5f5f7"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ flex: 1, height: 1, background: "#e8e8ed" }} /><span style={{ fontSize: 12, color: "#86868b" }}>ou</span><div style={{ flex: 1, height: 1, background: "#e8e8ed" }} /></div>

        {/* Form */}
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>NOM DE L'AGENCE</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Prestige Immobilier" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>EMAIL</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@agence.com" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>MOT DE PASSE</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder={tab === "signup" ? "6 caractères minimum" : "••••••••"} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} />
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff5f5", border: "1px solid #ffcdd2", fontSize: 13, color: "#d32f2f" }}>{error}</div>}
          {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#16a34a" }}>{success}</div>}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "#0071e3", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? .7 : 1, transition: "all .2s", marginTop: 4 }} onMouseEnter={e => { if (!loading) e.target.style.background = "#0077ed"; }} onMouseLeave={e => e.target.style.background = "#0071e3"}>
            {loading ? "Chargement..." : tab === "signup" ? "Créer mon compte →" : "Se connecter →"}
          </button>
        </form>

        {/* Switch tab */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#86868b", marginTop: 20 }}>
          {tab === "signup" ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <button onClick={() => { setTab(tab === "signup" ? "login" : "signup"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#0071e3", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {tab === "signup" ? "Se connecter" : "Créer un compte"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [authModal, setAuthModal] = useState(null); // null | "signup" | "login"
  const openSignup = () => setAuthModal("signup");

  return (
    <div className="landing-root">
      <style>{css}</style>
      <Nav onAuth={openSignup} />
      <Hero onAuth={openSignup} />
      <div id="secteurs">
        {SECTORS.map((s, i) => <SectorDeep key={s.key} sector={s} reverse={i % 2 === 1} />)}
      </div>
      <Pipeline />
      <Product />
      <CRMDemo />
      <Testimonials />
      <Pricing onAuth={openSignup} />
      <Enterprise />
      <FAQ />
      <FinalCTA onAuth={openSignup} />
      <Footer />
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
}

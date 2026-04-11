import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── CONFIG ─────────────────────────────────────────────────────────────
const WA = "https://wa.me/22892424665?text=Bonjour%20!%20Je%20voudrais%20une%20démo%20de%20CERBERUS%20AI.";

const IMG = {
  villa1: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  villa2: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  villa3: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  interior1: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  interior2: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c0?w=800&q=80",
  pool: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  keys: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  aerial: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  dashboard: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  ama: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
};

// ─── CSS (same as deployed) ─────────────────────────────────────────────
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
  .lp-label{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin-bottom:16px}
  .img-hover{transition:transform .6s cubic-bezier(.22,1,.36,1)}.img-hover:hover{transform:scale(1.03)}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d2d2d7;border-radius:3px}
`;

// ─── HOOKS (same as deployed) ───────────────────────────────────────────
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

// ─── NAV ────────────────────────────────────────────────────────────────
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
          {[{ t: "Produit", h: "#produit" }, { t: "Tarifs", h: "#tarifs" }, { t: "FAQ", h: "#faq" }].map(x => <a key={x.t} href={x.h} style={{ textDecoration: "none", color: "#6e6e73", fontSize: 14, fontWeight: 500, transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "#1d1d1f"} onMouseLeave={e => e.target.style.color = "#6e6e73"}>{x.t}</a>)}
          <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "10px 22px", borderRadius: 980, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "all .2s" }} onMouseEnter={e => e.target.style.background = "#0077ed"} onMouseLeave={e => e.target.style.background = "#0071e3"}>Démarrer</button>
        </div>
      </div>
    </nav>
  );
}

// ─── WHATSAPP PHONE (same mockup as deployed) ───────────────────────────
function WhatsAppPhone() {
  const msgs = [
    { from: "user", text: "Bonjour, je cherche un appartement à Cocody" },
    { from: "ama", text: "Bonjour ! Je suis Ama 🏠\nQuel est votre budget maximum ?" },
    { from: "user", text: "45 millions FCFA, 3 chambres" },
    { from: "ama", text: "Parfait ! Voici 2 biens :\n\n🏠 Villa Cocody Riviera\n42M · 4ch · Score: 94%\n\n📅 Visite dispo mardi 10h ?" },
  ];
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
        if (i >= msgs.length) { t = setTimeout(() => { if (!cancelled) { setStep(0); t = setTimeout(run, 1200); } }, 3000); return; }
        t = setTimeout(() => { if (!cancelled) { setStep(i + 1); i++; advance(); } }, delays[i % delays.length]);
      };
      advance();
    };
    run();
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  useEffect(() => { if (cRef.current) cRef.current.scrollTop = cRef.current.scrollHeight; }, [step]);

  return (
    <div style={{ width: 290, borderRadius: 48, overflow: "hidden", border: "4px solid #8CBED6", background: "#8CBED6", boxShadow: "0 30px 80px rgba(0,0,0,.18), 0 0 0 1px rgba(255,255,255,.25) inset", animation: "float 7s ease-in-out infinite" }}>
      <div style={{ height: 52, background: "#000", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 22px 6px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>9:41</span>
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 110, height: 28, borderRadius: 20, background: "#1a1a1a", boxShadow: "0 0 0 1px rgba(255,255,255,.06) inset" }} />
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="4" width="2.5" height="6" rx="0.5" fill="#fff"/><rect x="3.5" y="2.5" width="2.5" height="7.5" rx="0.5" fill="#fff"/><rect x="7" y="1" width="2.5" height="9" rx="0.5" fill="#fff"/><rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#fff"/></svg>
          <svg width="13" height="10" viewBox="0 0 13 10"><path d="M6.5 2C8.5 2 10.3 2.8 11.5 4.2L6.5 10 1.5 4.2C2.7 2.8 4.5 2 6.5 2Z" fill="#fff"/></svg>
          <div style={{ width: 20, height: 9, borderRadius: 2, border: "1px solid rgba(255,255,255,.4)", position: "relative", display: "flex", alignItems: "center", padding: 1 }}><div style={{ width: "72%", height: "100%", borderRadius: 1, background: "#34C759" }} /><div style={{ position: "absolute", right: -3, top: 2.5, width: 2, height: 4, borderRadius: "0 1px 1px 0", background: "rgba(255,255,255,.3)" }} /></div>
        </div>
      </div>
      <div style={{ background: "#075E54", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,.6)" }}>‹</div>
        <img src={IMG.ama} alt="" style={{ width: 34, height: 34, borderRadius: 17, objectFit: "cover", border: "2px solid rgba(255,255,255,.15)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Ama</div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#25D366", animation: "pulse 2s infinite" }} />en ligne
          </div>
        </div>
      </div>
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
      <div style={{ background: "#f0f0f0", padding: "6px 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: "7px 12px", fontSize: 11, color: "#86868b" }}>Message...</div>
        <div style={{ width: 28, height: 28, borderRadius: 14, background: "#075E54", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      <div style={{ height: 18, background: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}><div style={{ width: 100, height: 4, borderRadius: 2, background: "#3a3a3c" }} /></div>
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────
function Hero({ onAuth }) {
  const gridImgs = [IMG.villa1, IMG.villa2, IMG.interior1, IMG.villa3, IMG.interior2, IMG.pool];
  return (
    <section style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#f5f5f7" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, opacity: .12, filter: "blur(1px)" }}>{gridImgs.map((s, i) => <div key={i} style={{ backgroundImage: `url(${s})`, backgroundSize: "cover", backgroundPosition: "center" }} />)}</div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(245,245,247,.85) 0%,rgba(255,255,255,.95) 60%,#fff 100%)" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "160px 24px 100px", position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px", maxWidth: 560 }}>
          <F><div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 980, padding: "7px 16px", marginBottom: 32, border: "1px solid #e8e8ed", boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34C759", animation: "pulse 2s infinite" }} /><span style={{ fontSize: 12, fontWeight: 500, color: "#6e6e73" }}>Agent IA actif · 24/7 sur WhatsApp</span></div></F>
          <F d={1}>
            <h1 style={{ fontSize: "clamp(48px,6vw,76px)", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-.05em", marginBottom: 20 }}>
              <span style={{ color: "#0071e3" }}>Ama.</span><br />
              <span style={{ color: "#86868b" }}>Qualifie pendant{"\n"}que vous closez.</span>
            </h1>
          </F>
          <F d={2}><p style={{ fontSize: 19, lineHeight: 1.55, color: "#6e6e73", marginBottom: 28, maxWidth: 440 }}>Votre agent IA immobilier sur WhatsApp. Elle qualifie les prospects, matche les biens et planifie les visites — 24h/24, sans intervention humaine.</p></F>
          <F d={3}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "16px 32px", borderRadius: 980, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,113,227,.2)" }}>Commencer gratuitement</button>
              <a href={WA} target="_blank" rel="noopener" style={{ color: "#0071e3", padding: "16px 20px", fontSize: 17, fontWeight: 600, textDecoration: "none" }}>Démo WhatsApp →</a>
            </div>
          </F>
          <F d={4}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 66, height: 66, borderRadius: 33, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,113,227,.15)", border: "3px solid #0071e3" }}><img src={IMG.ama} alt="Ama" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>Ama</div><div style={{ fontSize: 12, color: "#86868b" }}>Votre conseillère IA immobilière</div></div>
            </div>
          </F>
        </div>
        <F d={2}><WhatsAppPhone /></F>
      </div>
      <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid #e8e8ed", background: "rgba(255,255,255,.9)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
          {[{ n: "< 3s", l: "Temps de réponse" }, { n: "24/7", l: "Disponibilité" }, { n: "7", l: "Modules inclus" }, { n: "3x", l: "Plus de conversions" }].map((s, i) => <div key={i} style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.04em" }}>{s.n}</div><div style={{ fontSize: 12, color: "#86868b", marginTop: 4, fontWeight: 500 }}>{s.l}</div></div>)}
        </div>
      </div>
    </section>
  );
}

// ─── STAGNATION (BEFORE/AFTER) ──────────────────────────────────────────
function Stagnation({ onAuth }) {
  return (
    <section style={{ padding: "140px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>La question qui compte</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.04em" }}>Où en sera votre agence <span style={{ color: "#86868b" }}>dans 6 mois ?</span></h2></F>
          <F d={2}><p style={{ fontSize: 17, color: "#6e6e73", marginTop: 16 }}>Deux chemins. Un seul choix.</p></F>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(380px,1fr))", gap: 20 }}>
          <F d={1}><div style={{ background: "#f5f5f7", borderRadius: 24, padding: "44px 32px", border: "1px solid #e8e8ed", height: "100%" }}>
            <p className="lp-label" style={{ color: "#86868b" }}>Sans Cerberus</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-.03em", marginBottom: 28 }}>Même routine.<br /><span style={{ color: "#86868b" }}>Même résultat.</span></h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                "50+ messages WhatsApp non lus chaque soir",
                "Des prospects qui contactent vos concurrents",
                "Votre équipe épuisée par les tâches répétitives",
                "Chiffre d'affaires qui stagne malgré le travail",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#aeaeb2", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 15, lineHeight: 1.55, color: "#6e6e73" }}>{t}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#aeaeb2", marginTop: 32, fontStyle: "italic" }}>L'opportunité qui expire, silencieusement.</p>
          </div></F>

          <F d={2}><div style={{ background: "#fff", borderRadius: 24, padding: "44px 32px", border: "2px solid #0071e3", height: "100%", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 32, background: "#0071e3", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 18px", borderRadius: 980 }}>Recommandé</div>
            <p className="lp-label" style={{ color: "#0071e3" }}>Avec Cerberus</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-.03em", marginBottom: 28 }}>Plus de volume.<br /><span style={{ color: "#86868b" }}>Moins d'effort.</span></h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                "Chaque prospect reçoit une réponse en < 3 secondes",
                "Les leads arrivent qualifiés, scorés, résumés",
                "Votre équipe ne traite que les dossiers prêts à signer",
                "Gérez 10x plus de volume sans recruter",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#0071e3", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 15, lineHeight: 1.55, color: "#6e6e73" }}>{t}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#aeaeb2", marginTop: 32, fontStyle: "italic" }}>Le résultat sécurisé. Chaque jour.</p>
          </div></F>
        </div>

        <F d={3}><div style={{ textAlign: "center", marginTop: 56 }}>
          <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "16px 36px", borderRadius: 980, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,113,227,.2)" }}>Choisir la croissance →</button>
        </div></F>
      </div>
    </section>
  );
}

// ─── PIPELINE ───────────────────────────────────────────────────────────
function Pipeline() {
  const steps = [
    { icon: "💬", name: "Message reçu", desc: "WhatsApp → Ama répond en < 3 secondes", pct: "100%" },
    { icon: "🎯", name: "Qualification", desc: "Budget, zone, type de bien, délai — collecté automatiquement", pct: "95%" },
    { icon: "🏠", name: "Matching", desc: "IA sémantique → biens correspondants envoyés instantanément", pct: "80%" },
    { icon: "📅", name: "Visite réservée", desc: "Proposition de créneaux → rendez-vous confirmé", pct: "60%" },
    { icon: "🔄", name: "Suivi automatique", desc: "Relances H+2 à J+30 pour les leads non convertis", pct: "40%" },
    { icon: "✅", name: "Closing", desc: "Votre équipe reçoit un dossier complet prêt à signer", pct: "25%" },
  ];

  return (
    <section id="produit" style={{ padding: "140px 0", background: "#f5f5f7" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>Produit</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(36px,4.5vw,56px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.04em" }}>Du message WhatsApp <span style={{ color: "#86868b" }}>au closing.</span></h2></F>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <F key={i} d={i}><div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#fff", border: "1px solid #e8e8ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>{s.icon}</div>
                {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: "#e8e8ed", marginTop: 8 }} />}
              </div>
              <div style={{ paddingBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{s.name}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0071e3", background: "rgba(0,113,227,.06)", padding: "3px 10px", borderRadius: 8 }}>{s.pct}</span>
                </div>
                <p style={{ fontSize: 15, color: "#6e6e73", lineHeight: 1.55 }}>{s.desc}</p>
              </div>
            </div></F>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── MODULES ────────────────────────────────────────────────────────────
function Modules() {
  const modules = [
    { icon: "🎯", name: "Qualification", desc: "Questions automatiques, segmentation, identification des prospects sérieux." },
    { icon: "🏠", name: "Property Matching", desc: "Matching IA sémantique. Les bons biens aux bons prospects." },
    { icon: "📅", name: "Visit Booking", desc: "Proposition de créneaux, réservation automatique, coordination." },
    { icon: "🔄", name: "Follow-up", desc: "Relances automatiques H+2 à J+30. Aucun lead oublié." },
    { icon: "📋", name: "CRM Agence", desc: "Biens, leads, conversations. Tout synchronisé en temps réel." },
    { icon: "📊", name: "Analytics", desc: "Pipelines, conversions, ROI. Votre performance, visible." },
    { icon: "✨", name: "Personnalisation", desc: "Questions, ton, process — adaptés à votre agence." },
  ];
  return (
    <section style={{ padding: "140px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <F><p className="lp-label" style={{ color: "#0071e3" }}>7 modules</p></F>
          <F d={1}><h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 700, letterSpacing: "-.04em" }}>Tout pour closer plus. <span style={{ color: "#86868b" }}>Rien de superflu.</span></h2></F>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {modules.map((m, i) => (
            <F key={i} d={i + 1}><div style={{ background: "#fafafa", borderRadius: 20, padding: "28px 24px", border: "1px solid #e8e8ed", transition: "transform .3s, box-shadow .3s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.04)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{m.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: "#6e6e73", lineHeight: 1.6 }}>{m.desc}</p>
            </div></F>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ────────────────────────────────────────────────────────────
const PLANS = [
  { name: "Starter", price: "50", desc: "Du lead au booking.", modules: ["Lead Qualification", "Property Matching", "Visit Booking"], popular: false },
  { name: "Pro", price: "150", desc: "Convertissez plus.", modules: ["Tout Starter +", "Follow-up Automation", "Agency CRM", "Personalization Studio"], popular: true },
  { name: "Business", price: "200", desc: "Performance complète.", modules: ["Tout Pro +", "Analytics avancé", "AI Coach & Insights"], popular: false },
];

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
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-.04em" }}>${p.price}</span>
                <span style={{ fontSize: 15, color: "#86868b" }}>/mois</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 22, borderTop: "1px solid #f0f0f0", marginBottom: 28 }}>
                {p.modules.map((m, mi) => <div key={mi} style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: "#0071e3", fontSize: 13 }}>✓</span><span style={{ fontSize: 14, color: "#6e6e73", fontWeight: mi === 0 && i > 0 ? 600 : 400 }}>{m}</span></div>)}
              </div>
              <button onClick={onAuth} style={{ display: "block", width: "100%", padding: 16, borderRadius: 14, border: "none", background: p.popular ? "#0071e3" : "#f5f5f7", color: p.popular ? "#fff" : "#1d1d1f", fontSize: 16, fontWeight: 700, textAlign: "center", cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={e => e.target.style.opacity = ".85"} onMouseLeave={e => e.target.style.opacity = "1"}>Commencer</button>
            </div></F>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "Combien de temps pour être opérationnel ?", a: "Moins de 10 minutes. Créez votre compte, configurez votre agent, connectez WhatsApp — c'est live." },
  { q: "Est-ce que l'IA remplace mes employés ?", a: "Non. L'IA qualifie et prépare les leads. Vos équipes se concentrent sur ce qu'elles font de mieux : closer les deals." },
  { q: "Ça marche avec mon numéro WhatsApp existant ?", a: "Oui. Connectez votre numéro WhatsApp Business via Meta. Aucun changement de numéro." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Données isolées par agence (multi-tenant), hébergement Supabase, chiffrement, conformité RGPD." },
  { q: "Je peux essayer gratuitement ?", a: "Oui. Commencez sans carte bancaire. Vous ne payez que quand vous passez en production." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Mobile Money (Wave, Orange Money), cartes bancaires et virements via KKiaPay." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" style={{ padding: "140px 24px", background: "#fff" }}>
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

// ─── FINAL CTA ──────────────────────────────────────────────────────────
function FinalCTA({ onAuth }) {
  return (
    <section style={{ position: "relative", padding: "160px 24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}><img src={IMG.aerial} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.35)" }} /></div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,rgba(0,113,227,.1),transparent 60%)" }} />
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <F><h2 style={{ fontSize: "clamp(40px,5vw,64px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-.04em", color: "#fff", marginBottom: 20 }}>Prêt à laisser l'IA<br />closer pour vous ?</h2></F>
        <F d={1}><p style={{ fontSize: 18, color: "rgba(255,255,255,.6)", marginBottom: 44, lineHeight: 1.6 }}>Pendant que vous lisez ces mots, un prospect est en train d'écrire à votre concurrent.</p></F>
        <F d={2}><div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onAuth} style={{ background: "#0071e3", color: "#fff", padding: "18px 40px", borderRadius: 980, fontSize: 17, fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,113,227,.3)" }}>Commencer maintenant</button>
          <a href={WA} target="_blank" rel="noopener" style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(10px)", color: "#fff", padding: "18px 40px", borderRadius: 980, fontSize: 17, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,.2)" }}>Démo WhatsApp →</a>
        </div></F>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ padding: "56px 24px 36px", background: "#f5f5f7", borderTop: "1px solid #e8e8ed" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#1d1d1f,#3a3a3c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>C</div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>CERBERUS<span style={{ fontWeight: 300, color: "#86868b", marginLeft: 4 }}>AI</span></span>
          </div>
          <p style={{ fontSize: 13, color: "#86868b", maxWidth: 260, lineHeight: 1.6 }}>Agent IA WhatsApp pour les agences immobilières. Qualification, matching et booking automatisés.</p>
        </div>
        {[{ t: "Produit", l: ["Fonctionnalités", "Modules", "Tarifs", "CRM", "Démo"] }, { t: "Entreprise", l: ["À propos", "Contact", "Partenaires"] }, { t: "Légal", l: ["Confidentialité", "CGV", "Mentions légales"] }].map((c, i) => (
          <div key={i}><h4 style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "#86868b", marginBottom: 14 }}>{c.t}</h4><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{c.l.map((l, li) => <a key={li} href="#" style={{ fontSize: 14, color: "#6e6e73", textDecoration: "none", transition: "color .2s" }} onMouseEnter={e => e.target.style.color = "#1d1d1f"} onMouseLeave={e => e.target.style.color = "#6e6e73"}>{l}</a>)}</div></div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 20, borderTop: "1px solid #e8e8ed", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#86868b", flexWrap: "wrap", gap: 8 }}>
        <span>© 2026 CERBERUS AI LLC</span>
        <span>Lomé · Abidjan · Lagos · Accra</span>
      </div>
    </footer>
  );
}

// ─── AUTH MODAL (same as deployed) ──────────────────────────────────────
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
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (authErr) throw authErr;
        if (authData.user) {
          await supabase.from("tenants").insert({ id: authData.user.id, name: name || email.split("@")[0], email, onboarding_completed: false }).select().single().catch(() => {});
        }
        setSuccess("Compte créé ! Redirection...");
        setTimeout(() => { window.location.href = "/app"; }, 1200);
      } else {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
        window.location.href = "/app";
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : err.message || "Erreur. Réessayez.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/app" } });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.4)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 420, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,.18)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, border: "none", background: "#f5f5f7", cursor: "pointer", fontSize: 16, color: "#86868b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#1d1d1f,#3a3a3c)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 12 }}>C</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.03em" }}>{tab === "signup" ? "Créer votre compte" : "Content de vous revoir"}</h2>
          <p style={{ fontSize: 14, color: "#86868b", marginTop: 6 }}>{tab === "signup" ? "Déployez Ama en 5 minutes." : "Connectez-vous à votre espace."}</p>
        </div>
        <button onClick={handleGoogle} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e8e8ed", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15, fontWeight: 600, color: "#1d1d1f", marginBottom: 20, transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f5f5f7"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuer avec Google
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ flex: 1, height: 1, background: "#e8e8ed" }} /><span style={{ fontSize: 12, color: "#86868b" }}>ou</span><div style={{ flex: 1, height: 1, background: "#e8e8ed" }} /></div>
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && <div><label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>NOM DE L'AGENCE</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Prestige Immobilier" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} /></div>}
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>EMAIL</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@agence.com" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", marginBottom: 6, display: "block" }}>MOT DE PASSE</label><input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder={tab === "signup" ? "6 caractères minimum" : "••••••••"} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 15, outline: "none", transition: "border .2s" }} onFocus={e => e.target.style.borderColor = "#0071e3"} onBlur={e => e.target.style.borderColor = "#e8e8ed"} /></div>
          {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff5f5", border: "1px solid #ffcdd2", fontSize: 13, color: "#d32f2f" }}>{error}</div>}
          {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#16a34a" }}>{success}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: "#0071e3", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? .7 : 1, transition: "all .2s", marginTop: 4 }} onMouseEnter={e => { if (!loading) e.target.style.background = "#0077ed"; }} onMouseLeave={e => e.target.style.background = "#0071e3"}>
            {loading ? "Chargement..." : tab === "signup" ? "Créer mon compte →" : "Se connecter →"}
          </button>
        </form>
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

// ─── LANDING PAGE ───────────────────────────────────────────────────────
export default function LandingPage() {
  const [authModal, setAuthModal] = useState(null);
  const openSignup = () => setAuthModal("signup");

  return (
    <div className="landing-root">
      <style>{css}</style>
      <Nav onAuth={openSignup} />
      <Hero onAuth={openSignup} />
      <Stagnation onAuth={openSignup} />
      <Pipeline />
      <Modules />
      <Pricing onAuth={openSignup} />
      <FAQ />
      <FinalCTA onAuth={openSignup} />
      <Footer />
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
}

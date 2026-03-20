import { useState } from "react";

const G = {
  bg: "#06060a", surface: "#0f0f16", surface2: "#15151f",
  border: "#1a1a2e", accent: "#a78bfa", accent2: "#7c3aed",
  text: "#e8e8f0", muted: "#4a4a6a", radius: 14,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-thumb{background:#1a1a2e;border-radius:4px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
`;

function cleanText(t) {
  return t.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

async function askGroq(messages, system, maxTokens = 4000, websiteUrl = null) {
  const body = { messages, max_tokens: maxTokens };
  if (system) body.system = system;
  if (websiteUrl) body.websiteUrl = websiteUrl;
  const res = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text || "";
  if (!text) throw new Error("Empty response");
  return cleanText(text);
}

function parseBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
}

function renderContent(text) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        const numbered = t.match(/^(\d+[\.\)])\s+(.+)/);
        const bulleted = t.match(/^[-•]\s+(.+)/);
        if (numbered) return (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <span style={{ flexShrink: 0, fontWeight: 700, color: G.accent, fontFamily: "Syne, sans-serif" }}>{numbered[1]}</span>
            <span>{parseBold(numbered[2])}</span>
          </div>
        );
        if (bulleted) return (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <span style={{ flexShrink: 0, color: G.accent }}>-</span>
            <span>{parseBold(bulleted[1])}</span>
          </div>
        );
        if (t === "") return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ marginBottom: 4, lineHeight: 1.8 }}>{parseBold(line)}</p>;
      })}
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${G.border}`, borderTopColor: G.accent, animation: "spin 0.8s linear infinite" }} />;
}

function Btn({ label, onClick, solid, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "8px 16px" : "11px 22px", borderRadius: 10,
      border: `1px solid ${G.accent}`,
      background: solid ? G.accent : "transparent",
      color: solid ? "#000" : G.accent,
      fontFamily: "Syne, sans-serif", fontWeight: 700,
      fontSize: small ? "0.72rem" : "0.8rem",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      whiteSpace: "nowrap", transition: "opacity 0.15s",
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}>
      {label}
    </button>
  );
}

function ModeToggle({ mode, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 50, padding: 4, gap: 4 }}>
      {[{ id: "brief", label: "Quick Brief" }, { id: "audit", label: "Deep Audit" }].map(m => (
        <button key={m.id} onClick={() => onChange(m.id)} style={{
          padding: "8px 20px", borderRadius: 50, border: "none",
          background: mode === m.id ? G.accent : "transparent",
          color: mode === m.id ? "#000" : G.muted,
          fontFamily: "Syne, sans-serif", fontWeight: mode === m.id ? 700 : 500,
          fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s",
        }}>{m.label}</button>
      ))}
    </div>
  );
}

const baseInput = {
  width: "100%", background: G.surface2, border: `1px solid ${G.border}`,
  borderRadius: G.radius, padding: "11px 14px", color: G.text,
  fontFamily: "DM Sans, sans-serif", fontSize: "0.88rem", outline: "none",
};

function TInput({ label, value, onChange, placeholder, hint }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: G.muted, marginBottom: 5, fontFamily: "Syne, sans-serif" }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...baseInput, borderColor: f ? G.accent : G.border, transition: "border-color 0.2s" }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} />
      {hint && <div style={{ fontSize: "0.67rem", color: G.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function TArea({ label, value, onChange, placeholder, rows = 3, hint }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: G.muted, marginBottom: 5, fontFamily: "Syne, sans-serif" }}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...baseInput, resize: "vertical", lineHeight: 1.6, borderColor: f ? G.accent : G.border, transition: "border-color 0.2s" }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} />
      {hint && <div style={{ fontSize: "0.67rem", color: G.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIEF MODE
// ─────────────────────────────────────────────────────────────────────────────

const BRIEF_SECTIONS = [
  { key: "OVERVIEW",     label: "Company Overview",       icon: "◈" },
  { key: "POSITIONING",  label: "Market Positioning",     icon: "◐" },
  { key: "COMPETITORS",  label: "Competitors & Gaps",     icon: "⊕" },
  { key: "SOCIAL",       label: "Social & Content",       icon: "◎" },
  { key: "TRENDS",       label: "Trend Signals",          icon: "◆" },
  { key: "INTELLIGENCE", label: "Strategic Intelligence", icon: "▶" },
];

function buildBriefPrompt1(t) {
  return `You are a senior research analyst at a top-tier strategy firm. You produce sharp, specific, factual intelligence briefs.

RULES:
- Only state facts grounded in the website content or user-provided details. If inferring, say "appears to" or "likely".
- No filler. Every sentence must contain a specific, useful insight.
- Never use em dashes. Commas, colons, or hyphens only.
- Be direct and analytical. Write like a Bloomberg analyst, not a consultant.
- When listing items, put each on its own line starting with a number and period.

TARGET:
- Company/Project: ${t.name}
- Website: ${t.website || "Not provided"}
- Industry/Niche: ${t.niche || "Not specified"}
- Additional context: ${t.context || "None"}

CRITICAL: Begin with ===REPORT_START=== and end with ===PART1_END===. Nothing before or after.

===REPORT_START===

##OVERVIEW##
[What this company actually does, who they serve, what stage they are at, what their core value proposition is. Base on website content. 4-6 sentences. Include specific claims, stats, or credentials visible on the site.]

##POSITIONING##
[How they position themselves. What narrative they own or try to own. What makes their messaging distinctive or generic. What positioning gap they are missing. 4-6 sentences.]

##COMPETITORS##
[3-5 direct competitors. For each: what they do well, what they fail at, and the specific gap the target could exploit. Real companies only.]

===PART1_END===`;
}

function buildBriefPrompt2(t) {
  return `You are a senior research analyst at a top-tier strategy firm. You produce sharp, specific, factual intelligence briefs.

RULES:
- Only state facts grounded in the website content or user-provided details. If inferring, say "appears to" or "likely".
- No filler. Every sentence must contain a specific, useful insight.
- Never use em dashes. Commas, colons, or hyphens only.
- Be direct and analytical.
- When listing items, put each on its own line starting with a number and period.

TARGET:
- Company/Project: ${t.name}
- Website: ${t.website || "Not provided"}
- Industry/Niche: ${t.niche || "Not specified"}
- Additional context: ${t.context || "None"}

CRITICAL: Begin with ===PART2_START=== and end with ===REPORT_END===. Nothing before or after.

===PART2_START===

##SOCIAL##
[Their apparent social media and content strategy based on what is visible. What platforms they use, what content angles they push, what is working or missing. 4-6 sentences.]

##TRENDS##
[3-5 specific trend signals relevant to this company's niche right now. Name the trend, explain the signal, explain why it matters for this company specifically.]

##INTELLIGENCE##
[3-5 sharp strategic observations a founder or investor would find valuable. What is this company doing right that competitors overlook? What is the biggest risk to their model? What is the highest-leverage move they are not making?]

===REPORT_END===`;
}

function parseBriefReport(raw1, raw2) {
  const s1 = raw1.search(/={3}REPORT_START={3}/);
  const e1 = raw1.search(/={3}PART1_END={3}/);
  const body1 = (s1 !== -1 && e1 !== -1) ? raw1.slice(s1 + 18, e1).trim() : raw1;
  const s2 = raw2.search(/={3}PART2_START={3}/);
  const e2 = raw2.search(/={3}REPORT_END={3}/);
  const body2 = (s2 !== -1 && e2 !== -1) ? raw2.slice(s2 + 14, e2).trim() : raw2;
  return parseSections(body1 + "\n\n" + body2, BRIEF_SECTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEEP AUDIT MODE
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_SECTIONS = [
  { key: "REALITY_CHECK",     label: "Core Reality Check",         icon: "◈" },
  { key: "BUSINESS_MODEL",    label: "Business Model Depth",       icon: "◐" },
  { key: "TOKEN_DESIGN",      label: "Token Design Signals",       icon: "⬡" },
  { key: "ONCHAIN",           label: "On-Chain Intelligence",      icon: "⊕" },
  { key: "POSITIONING",       label: "Positioning Precision",      icon: "◎" },
  { key: "COMPETITOR_BLINDS", label: "Competitor Blind Spots",     icon: "◆" },
  { key: "AUDIENCE_FIT",      label: "Audience-Product Alignment", icon: "▣" },
  { key: "MESSAGING_GAP",     label: "Messaging vs Reality",       icon: "◉" },
  { key: "FRICTION",          label: "Product Friction Signals",   icon: "▽" },
  { key: "RED_FLAGS",         label: "Red Flag Patterns",          icon: "⚑" },
  { key: "SECOND_ORDER",      label: "Second-Order Insights",      icon: "▲" },
  { key: "NOT_SAID",          label: "What's Not Being Said",      icon: "◌" },
  { key: "INSIGHT_SUMMARY",   label: "Insight Summary",            icon: "▶" },
];

function buildAuditPrompt1(t) {
  return `You are an elite intelligence analyst known for uncovering non-obvious insights about companies and Web3 projects.
Your job is deep analysis: patterns, inconsistencies, and hidden signals.
Do NOT give strategies or recommendations. Only analyze.
Be skeptical, precise, and insight-driven. Avoid surface-level observations.
Never use em dashes. Use commas, colons, or hyphens only.
When listing items, put each on its own line starting with a number and period.
Only state facts grounded in provided data. If inferring, say "appears to" or "likely".

TARGET:
- Name: ${t.name}
- Website: ${t.website || "Not provided"}
- Twitter/X: ${t.twitter || "Not provided"}
- Industry/Niche: ${t.niche || "Not specified"}
- Description: ${t.description || "Not provided"}
- Whitepaper/Docs: ${t.whitepaper || "Not provided"}
- On-Chain Data: ${t.onchain || "Not provided - infer likely patterns from token design and incentive model"}
- Contract Address: ${t.contract || "Not provided"}

CRITICAL: Begin with ===REPORT_START=== and end with ===PART1_END===. Nothing before or after.

===REPORT_START===

##REALITY_CHECK##
[What the project claims vs what it actually appears to be. Narrative vs product mismatch. Be specific about the gap between marketing language and observable reality.]

##BUSINESS_MODEL##
[Sustainability vs hype dependency. Hidden dependencies on token price, liquidity, or user growth. Where does real value flow and who captures it?]

##TOKEN_DESIGN##
[Real vs forced utility. Signs of circular value or weak demand drivers. Is the token necessary or cosmetic? What happens to token price if growth slows?]

##ONCHAIN##
[Wallet concentration signals. Distribution fairness. Transaction behavior - organic vs repetitive patterns. Liquidity signals - stable, thin, or manipulated. Signs of wash trading, farming, or inorganic behavior. If no raw data is provided, infer likely patterns based on token design and incentive model.]

##POSITIONING##
[Clear, crowded, or confused positioning. How precisely is this project positioned vs actual alternatives in the market?]

===PART1_END===`;
}

function buildAuditPrompt2(t) {
  return `You are an elite intelligence analyst known for uncovering non-obvious insights about companies and Web3 projects.
Your job is deep analysis: patterns, inconsistencies, and hidden signals.
Do NOT give strategies or recommendations. Only analyze.
Be skeptical, precise, and insight-driven. Avoid surface-level observations.
Never use em dashes. Use commas, colons, or hyphens only.
When listing items, put each on its own line starting with a number and period.

TARGET:
- Name: ${t.name}
- Website: ${t.website || "Not provided"}
- Industry/Niche: ${t.niche || "Not specified"}
- Description: ${t.description || "Not provided"}
- On-Chain Data: ${t.onchain || "Not provided - infer from model"}
- Contract Address: ${t.contract || "Not provided"}

CRITICAL: Begin with ===PART2_START=== and end with ===REPORT_END===. Nothing before or after.

===PART2_START===

##COMPETITOR_BLINDS##
[Overlap vs differentiation gaps. What competitors are doing that this project ignores. Where the real competitive threat comes from that the project is not acknowledging.]

##AUDIENCE_FIT##
[Does the product actually fit the audience it claims to serve? Where is the alignment strong and where is it strained? Who is the real user vs the stated user?]

##MESSAGING_GAP##
[Buzzwords vs actual substance. Which specific claims are unsupported? What is overstated? What language is being used to obscure weak points?]

##FRICTION##
[Where users are likely to struggle or drop off. Onboarding complexity, token mechanics confusion, product gaps that create abandonment. Be specific.]

##RED_FLAGS##
[Weak differentiation disguised as innovation. Over-reliance on trends. Specific patterns that signal risk - not speculation, but observable signals.]

##SECOND_ORDER##
[What must go right for this to succeed? The single most likely failure point. Where is the system fragile in ways that are not obvious?]

##NOT_SAID##
[What is conspicuously absent from the public narrative? Missing transparency, avoided topics, questions the project does not answer publicly.]

##INSIGHT_SUMMARY##
[The 5 most non-obvious, high-signal insights from this entire analysis. Each should be something a surface-level read would miss. Number each one.]

===REPORT_END===`;
}

function parseAuditReport(raw1, raw2) {
  const s1 = raw1.search(/={3}REPORT_START={3}/);
  const e1 = raw1.search(/={3}PART1_END={3}/);
  const body1 = (s1 !== -1 && e1 !== -1) ? raw1.slice(s1 + 18, e1).trim() : raw1;
  const s2 = raw2.search(/={3}PART2_START={3}/);
  const e2 = raw2.search(/={3}REPORT_END={3}/);
  const body2 = (s2 !== -1 && e2 !== -1) ? raw2.slice(s2 + 14, e2).trim() : raw2;
  return parseSections(body1 + "\n\n" + body2, AUDIT_SECTIONS);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseSections(body, sections) {
  const result = {};
  sections.forEach((sec, i) => {
    const tag = `##${sec.key}##`;
    const nextTag = sections[i + 1] ? `##${sections[i + 1].key}##` : null;
    const from = body.indexOf(tag);
    if (from === -1) return;
    const start = from + tag.length;
    const end = nextTag ? body.indexOf(nextTag) : body.length;
    result[sec.key] = body.slice(start, end === -1 ? undefined : end).trim();
  });
  return Object.keys(result).length > 2 ? result : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT VIEW (shared)
// ─────────────────────────────────────────────────────────────────────────────

function ReportView({ report, target, sections, mode, onReset }) {
  const [active, setActive] = useState(sections[0].key);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const t = `${mode === "audit" ? "DEEP AUDIT" : "RESEARCH BRIEF"}: ${target.name}\n\n` +
      sections.filter(s => report[s.key]).map(s => `${s.label.toUpperCase()}\n${"-".repeat(32)}\n${report[s.key]}`).join("\n\n");
    navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const print = () => {
    const w = window.open("", "_blank");
    const title = mode === "audit" ? "Deep Audit Report" : "Research Brief";
    const subtitle = mode === "audit" ? "Intelligence & Audit Agent" : "Research & Insight Agent";
    w.document.write(`<html><head><title>${target.name} - ${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;max-width:740px;margin:0 auto;color:#111;padding:48px 32px}
      .brand-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;padding-bottom:20px;border-bottom:3px solid #a78bfa}
      .brand-name{font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;letter-spacing:-0.02em;color:#06060a}
      .brand-name span{color:#7c3aed}
      .brand-tag{font-family:'Syne',sans-serif;font-size:0.68rem;color:#888;text-transform:uppercase;letter-spacing:0.1em}
      .report-title{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:6px;color:#06060a}
      .meta{color:#777;font-size:0.82rem;margin-bottom:36px;padding-bottom:16px;border-bottom:1px solid #eee}
      h2{font-family:'Syne',sans-serif;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.12em;background:#a78bfa;color:#000;padding:5px 12px;display:inline-block;margin:32px 0 12px;font-weight:700}
      p{line-height:1.9;color:#333;white-space:pre-wrap;font-size:0.91rem}
      .footer{margin-top:56px;padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center}
      .footer-brand{font-family:'Syne',sans-serif;font-weight:700;font-size:0.75rem;color:#333}
      .footer-brand span{color:#7c3aed}
      .footer-note{font-size:0.7rem;color:#aaa}
    </style></head><body>
    <div class="brand-header">
      <div>
        <div class="brand-name">Fredrick Strategy <span>Lab</span></div>
        <div class="brand-tag">${subtitle}</div>
      </div>
      <div class="brand-tag">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
    </div>
    <div class="report-title">${title}</div>
    <p class="meta">Subject: <strong>${target.name}</strong>${target.website ? ` &nbsp; ${target.website}` : ""}${target.niche ? ` &nbsp; ${target.niche}` : ""}</p>
    ${sections.filter(s => report[s.key]).map(s => `<h2>${s.label}</h2><p>${report[s.key]}</p>`).join("")}
    <div class="footer">
      <div class="footer-brand">Fredrick Strategy <span>Lab</span></div>
      <div class="footer-note">Prepared by ResearchAI - ${subtitle}</div>
    </div>
    </body></html>`);
    w.document.close(); w.print();
  };

  const activeSec = sections.find(s => s.key === active);
  const sensitiveKeys = ["ONCHAIN", "RED_FLAGS", "NOT_SAID", "INTELLIGENCE", "SECOND_ORDER"];

  return (
    <div style={{ animation: "fadeUp 0.35s ease", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: G.accent, marginBottom: 4, fontFamily: "Syne, sans-serif" }}>
            {mode === "audit" ? "Deep Audit Complete" : "Research Brief Ready"}
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "Syne, sans-serif" }}>{target.name}</div>
          {target.website && <div style={{ fontSize: "0.75rem", color: G.muted, marginTop: 2 }}>{target.website}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn label={copied ? "Copied" : "Copy All"} onClick={copy} solid small />
          <Btn label="Export PDF" onClick={print} small />
          <Btn label="New Research" onClick={onReset} small />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, minHeight: 520 }}>
        <div style={{ width: 210, flexShrink: 0, background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {sections.map(sec => (
            <button key={sec.key} onClick={() => setActive(sec.key)} style={{
              width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 9, border: "none", cursor: "pointer",
              background: active === sec.key ? `${G.accent}18` : "transparent",
              borderLeft: `2px solid ${active === sec.key ? G.accent : "transparent"}`,
              color: active === sec.key ? G.accent : report[sec.key] ? G.muted : "#2a2a3a",
              fontFamily: "Syne, sans-serif", fontSize: "0.73rem",
              fontWeight: active === sec.key ? 700 : 400,
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ opacity: 0.7 }}>{sec.icon}</span>{sec.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "22px", overflowY: "auto" }}>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: G.accent, marginBottom: 14, display: "flex", alignItems: "center", gap: 6, fontFamily: "Syne, sans-serif" }}>
            <span>{activeSec?.icon}</span>{activeSec?.label}
          </div>
          {sensitiveKeys.includes(active) && (
            <div style={{ background: `${G.accent}10`, border: `1px solid ${G.accent}28`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: "0.7rem", color: G.muted, lineHeight: 1.5 }}>
              <span style={{ color: G.accent }}>Intelligence inference</span> - Based on available data and signals. Verify before acting or sharing.
            </div>
          )}
          <div key={active} style={{ fontSize: "0.88rem", lineHeight: 1.85, color: "#ccc", animation: "fadeIn 0.2s ease", fontFamily: "DM Sans, sans-serif" }}>
            {renderContent(report[active] || "No content for this section.")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function ResearchAI() {
  const [mode, setMode] = useState("brief");
  const [step, setStep] = useState("form");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // Brief fields
  const [brief, setBrief] = useState({ name: "", website: "", niche: "", context: "" });
  const setB = k => v => setBrief(p => ({ ...p, [k]: v }));

  // Audit fields
  const [audit, setAudit] = useState({ name: "", website: "", twitter: "", niche: "", description: "", whitepaper: "", onchain: "", contract: "" });
  const setA = k => v => setAudit(p => ({ ...p, [k]: v }));

  const resetAll = () => {
    setStep("form"); setReport(null); setError("");
    setBrief({ name: "", website: "", niche: "", context: "" });
    setAudit({ name: "", website: "", twitter: "", niche: "", description: "", whitepaper: "", onchain: "", contract: "" });
  };

  const submitBrief = async () => {
    if (!brief.name.trim()) { setError("Company name is required."); return; }
    setError(""); setStep("loading");
    try {
      const [r1, r2] = await Promise.all([
        askGroq([{ role: "user", content: buildBriefPrompt1(brief) }], null, 4000, brief.website || null),
        askGroq([{ role: "user", content: buildBriefPrompt2(brief) }], null, 4000, brief.website || null),
      ]);
      const parsed = parseBriefReport(r1, r2);
      if (!parsed) throw new Error("AI did not return a valid format. Please try again.");
      setReport(parsed); setStep("report");
    } catch (err) { setError(`Research failed: ${err.message}`); setStep("form"); }
  };

  const submitAudit = async () => {
    if (!audit.name.trim()) { setError("Project name is required."); return; }
    setError(""); setStep("loading");
    try {
      const [r1, r2] = await Promise.all([
        askGroq([{ role: "user", content: buildAuditPrompt1(audit) }], null, 4000, audit.website || null),
        askGroq([{ role: "user", content: buildAuditPrompt2(audit) }], null, 4000, audit.website || null),
      ]);
      const parsed = parseAuditReport(r1, r2);
      if (!parsed) throw new Error("AI did not return a valid format. Please try again.");
      setReport(parsed); setStep("report");
    } catch (err) { setError(`Audit failed: ${err.message}`); setStep("form"); }
  };

  const loadingMessages = {
    brief: [brief.website ? "Reading website..." : "Processing inputs...", "Mapping competitors...", "Scanning trend signals...", "Writing intelligence brief..."],
    audit: [audit.website ? "Reading website..." : "Processing inputs...", "Analyzing token design...", "Scanning on-chain signals...", "Writing deep audit..."],
  };

  if (step === "loading") return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Spinner /></div>
        {loadingMessages[mode].map((t, i) => (
          <div key={i} style={{ fontSize: "0.73rem", color: G.muted, fontFamily: "DM Sans, sans-serif", marginTop: 10, animation: `fadeUp 0.4s ease ${i * 0.18}s both` }}>{t}</div>
        ))}
      </div>
    </div>
  );

  if (step === "report" && report) return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: "DM Sans, sans-serif", padding: "22px 18px 40px" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.025em", fontFamily: "Syne, sans-serif" }}>
            Research<span style={{ color: G.accent }}>AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.68rem", color: G.muted }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent, animation: "pulse 2s infinite" }} />
            {mode === "audit" ? "Deep Audit" : "Quick Brief"}
          </div>
        </div>
        <ReportView
          report={report}
          target={mode === "brief" ? brief : audit}
          sections={mode === "brief" ? BRIEF_SECTIONS : AUDIT_SECTIONS}
          mode={mode}
          onReset={resetAll}
        />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: "DM Sans, sans-serif", padding: "22px 18px 40px" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.03em", fontFamily: "Syne, sans-serif", marginBottom: 6 }}>
            Research<span style={{ color: G.accent }}>AI</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: G.muted }}>Research & Insight Agent - Fredrick Strategy Lab</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <ModeToggle mode={mode} onChange={m => { setMode(m); setError(""); }} />
          <div style={{ fontSize: "0.72rem", color: G.muted }}>
            {mode === "brief" ? "6 sections - positioning, competitors, trends" : "13 sections - deep intelligence, on-chain signals, red flags"}
          </div>
        </div>

        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "24px", animation: "fadeUp 0.5s ease 0.1s both" }}>

          {mode === "brief" ? (
            <>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: G.accent, marginBottom: 20, fontFamily: "Syne, sans-serif" }}>Research Target</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <TInput label="Company / Project Name *" value={brief.name} onChange={setB("name")} placeholder="e.g. Bond Finance" />
                <TInput label="Website" value={brief.website} onChange={setB("website")} placeholder="https://example.com" hint="Lets the AI read the actual site" />
              </div>
              <TInput label="Industry / Niche" value={brief.niche} onChange={setB("niche")} placeholder="e.g. Web3 marketing agency, DeFi protocol, SaaS fintech" />
              <TArea label="Additional Context" value={brief.context} onChange={setB("context")} rows={3}
                placeholder="Anything you know about them: clients, team, recent moves, what you want to find out."
                hint="Optional. More context = sharper brief." />
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: G.accent, marginBottom: 20, fontFamily: "Syne, sans-serif" }}>Audit Target</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <TInput label="Project Name *" value={audit.name} onChange={setA("name")} placeholder="e.g. Credlume" />
                <TInput label="Website" value={audit.website} onChange={setA("website")} placeholder="https://example.com" hint="AI will read live site content" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <TInput label="Twitter / X" value={audit.twitter} onChange={setA("twitter")} placeholder="@handle" />
                <TInput label="Industry / Niche" value={audit.niche} onChange={setA("niche")} placeholder="e.g. Web3, DeFi, SaaS" />
              </div>
              <TArea label="Project Description" value={audit.description} onChange={setA("description")} rows={3}
                placeholder="What does it do? Token model, target users, key claims." />
              <TArea label="Whitepaper / Docs Summary" value={audit.whitepaper} onChange={setA("whitepaper")} rows={3}
                placeholder="Paste key sections from the whitepaper or docs. Tokenomics, utility, governance model." hint="Optional but greatly improves token design analysis." />
              <TArea label="On-Chain Data" value={audit.onchain} onChange={setA("onchain")} rows={3}
                placeholder="Paste raw data from Dune, Etherscan, Nansen, etc. Token holder distribution, transaction counts, wallet activity."
                hint="Optional. If blank, AI infers patterns from token design." />
              <TInput label="Contract Address" value={audit.contract} onChange={setA("contract")} placeholder="0x... (optional - used to reference on-chain analysis)" />
            </>
          )}
        </div>

        {error && <div style={{ background: "#ff4d4d10", border: "1px solid #ff4d4d33", borderRadius: 10, padding: "12px 16px", margin: "14px 0", fontSize: "0.82rem", color: "#ff8888" }}>{error}</div>}

        <button onClick={mode === "brief" ? submitBrief : submitAudit}
          style={{ width: "100%", marginTop: 14, padding: "14px", borderRadius: G.radius, background: G.accent, border: "none", color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "0.92rem", cursor: "pointer", transition: "opacity 0.2s", animation: "fadeUp 0.5s ease 0.2s both" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          {mode === "brief" ? "Generate Research Brief" : "Run Deep Audit"}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.68rem", color: G.muted, marginTop: 10 }}>
          {mode === "brief" ? "6 sections - reads live website - 15-25 seconds" : "13 sections - on-chain intelligence - 20-35 seconds"}
        </p>
      </div>
    </div>
  );
}

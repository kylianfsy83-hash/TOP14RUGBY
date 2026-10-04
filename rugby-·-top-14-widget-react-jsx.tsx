import React, { useState, useEffect } from "react";

/* ================= Données Top 14 · saison 2026-27 (après J5, 3-4 oct. 2026) ================= */

const TEAMS = {
  Toulouse:      { name: "Toulouse",        color: "#11131a", accent: "#e0313a", rank: 1,  pts: 19, j: 5, diff: "+62" },
  Pau:           { name: "Pau",             color: "#0a7d4f", accent: "#0a7d4f", rank: 2,  pts: 18, j: 5, diff: "+49" },
  Bayonne:       { name: "Bayonne",         color: "#1f5fa8", accent: "#1f5fa8", rank: 3,  pts: 17, j: 5, diff: "-13" },
  Bordeaux:      { name: "Bordeaux-Bègles", color: "#0d3b66", accent: "#3aa6b9", rank: 4,  pts: 15, j: 5, diff: "+63" },
  Lyon:          { name: "Lyon",            color: "#b5121b", accent: "#b5121b", rank: 5,  pts: 14, j: 5, diff: "+3"  },
  LaRochelle:    { name: "La Rochelle",     color: "#0e3a5c", accent: "#f5c542", rank: 6,  pts: 13, j: 5, diff: "-3"  },
  Clermont:      { name: "Clermont",        color: "#f3c000", accent: "#f3c000", rank: 7,  pts: 10, j: 5, diff: "-28" },
  Racing92:      { name: "Racing 92",       color: "#87ceeb", accent: "#0b4ea2", rank: 8,  pts: 10, j: 5, diff: "-39" },
  StadeFrancais: { name: "Stade Français",  color: "#0a2f7a", accent: "#0a2f7a", rank: 9,  pts: 10, j: 5, diff: "-19" },
  Montpellier:   { name: "Montpellier",     color: "#0a5fa8", accent: "#f58220", rank: 10, pts: 9,  j: 4, diff: "+21" },
  Perpignan:     { name: "Perpignan",       color: "#b5121b", accent: "#f5d000", rank: 11, pts: 9,  j: 5, diff: "-42" },
  Castres:       { name: "Castres",         color: "#0a2f5a", accent: "#8ac2e8", rank: 12, pts: 9,  j: 5, diff: "-18" },
  Toulon:        { name: "Toulon",          color: "#0b0b3a", accent: "#e0313a", rank: 13, pts: 8,  j: 4, diff: "+14" },
  Vannes:        { name: "Vannes",          color: "#1c6e5a", accent: "#f5f0e1", rank: 14, pts: 1,  j: 5, diff: "-50" }
};

const J5 = [
  { day: "Sam 3 oct", time: "14:30", home: "Bordeaux",      hs: 51, away: "Lyon",         as: 28 },
  { day: "Sam 3 oct", time: "16:35", home: "Bayonne",       hs: 35, away: "StadeFrancais", as: 32 },
  { day: "Sam 3 oct", time: "16:35", home: "LaRochelle",    hs: 38, away: "Clermont",     as: 13 },
  { day: "Sam 3 oct", time: "16:35", home: "Racing92",      hs: 55, away: "Perpignan",    as: 25 },
  { day: "Sam 3 oct", time: "16:35", home: "Vannes",        hs: 40, away: "Pau",          as: 43 },
  { day: "Sam 3 oct", time: "21:00", home: "Castres",       hs: 7,  away: "Toulouse",     as: 8  },
  { day: "Dim 4 oct", time: "21:05", home: "Montpellier",   hs: null, away: "Toulon",     as: null,
    kickoff: "2026-10-04T21:05:00+02:00" }
];

const J6 = [
  { day: "Sam 10 oct", time: "14:30", home: "StadeFrancais", away: "Montpellier" },
  { day: "Sam 10 oct", time: "16:35", home: "Lyon",          away: "LaRochelle" },
  { day: "Sam 10 oct", time: "16:35", home: "Pau",           away: "Castres" },
  { day: "Sam 10 oct", time: "16:35", home: "Perpignan",     away: "Vannes" },
  { day: "Sam 10 oct", time: "16:35", home: "Toulon",        away: "Racing92" },
  { day: "Sam 10 oct", time: "21:00", home: "Clermont",      away: "Bordeaux" },
  { day: "Dim 11 oct", time: "21:05", home: "Toulouse",      away: "Bayonne",
    kickoff: "2026-10-11T21:05:00+02:00" }
];

/* ================= Utilitaires ================= */

const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
function storeGet(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
function storeSet(k, v) { try { if (store) { if (v === null) store.removeItem(k); else store.setItem(k, v); } } catch (e) {} }

const TEAM_KEYS = Object.keys(TEAMS).sort((a, b) => TEAMS[a].rank - TEAMS[b].rank);

function teamGradient(key) {
  const t = TEAMS[key];
  return `linear-gradient(135deg, ${t.accent}, ${t.color})`;
}

function isFavMatch(m, fav) {
  return fav && (m.home === fav || m.away === fav);
}

function matchStatus(m, now) {
  if (m.hs !== null && m.as !== null) return { cls: "st-done", label: "Terminé" };
  const ko = m.kickoff ? new Date(m.kickoff).getTime() : null;
  if (!ko) return { cls: "st-soon", label: "À venir" };
  if (now >= ko && now < ko + 2 * 3600e3) return { cls: "st-live", label: "● En cours" };
  if (now >= ko + 2 * 3600e3) return { cls: "st-done", label: "Terminé" };
  return { cls: "st-soon", label: "À venir" };
}

/* ================= Sous-composants ================= */

function TeamDot({ teamKey }) {
  return <span className="dot" style={{ background: teamGradient(teamKey) }} />;
}

function MatchRow({ m, fav, now }) {
  const st = matchStatus(m, now);
  const played = m.hs !== null && m.as !== null;
  const hW = played && m.hs > m.as;
  const aW = played && m.as > m.hs;

  const line = (key, isWinner, isLoser) => (
    <div className="t">
      <TeamDot teamKey={key} />
      <span className={isWinner ? "winner" : isLoser ? "loser" : ""}>{TEAMS[key].name}</span>
    </div>
  );

  return (
    <div className={"match" + (isFavMatch(m, fav) ? " fav-match" : "")}>
      <div className="when">
        {m.day}<br />
        <span className={st.cls}>{st.label}</span><br />
        {m.time}
      </div>
      <div className="teams">
        {line(m.home, hW, aW)}
        {line(m.away, aW, hW)}
      </div>
      <div className="sc">
        {played ? `${m.hs} – ${m.as}` : <span className="pending">{st.label}</span>}
      </div>
    </div>
  );
}

function Standings({ fav }) {
  return (
    <div>
      <div className="standings">
        {TEAM_KEYS.map((k) => {
          const t = TEAMS[k];
          const zone = t.rank <= 6 ? "top" : t.rank === 13 ? "access" : t.rank === 14 ? "rele" : "mid";
          return (
            <div key={k} className={"st-row" + (fav === k ? " fav-team-row" : "")}>
              <span className="pos">{t.rank}</span>
              <span className="barrier"><span className={"zone " + zone}></span></span>
              <TeamDot teamKey={k} />
              <span className="nm">
                {t.name}
                {t.j < 5 ? <span className="jj">(1 match en moins)</span> : ""}
              </span>
              <span className="diff">{t.diff}</span>
              <span className="pts">{t.pts}</span>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: "#30d158" }}></i> Phases finales</span>
        <span><i style={{ background: "#ff9f0a" }}></i> Barrage maintien</span>
        <span><i style={{ background: "#ff453a" }}></i> Relégation</span>
      </div>
    </div>
  );
}

function Hero({ now }) {
  const next =
    J5.find((m) => matchStatus(m, now).label !== "Terminé") ||
    J6.find((m) => matchStatus(m, now).label !== "Terminé");
  if (!next) return null;

  const h = TEAMS[next.home];
  const a = TEAMS[next.away];
  const played = next.hs !== null && next.as !== null;
  const ko = next.kickoff ? new Date(next.kickoff).getTime() : null;
  const live = ko && now >= ko && now < ko + 2 * 3600e3;
  const pending = ko && now < ko;

  let ms = ko ? ko - now : 0;
  const hh = Math.max(0, Math.floor(ms / 3600e3)); ms -= hh * 3600e3;
  const mm = Math.max(0, Math.floor(ms / 60e3));   ms -= mm * 60e3;
  const ss = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, "0");

  const teamBlock = (t) => (
    <div className="team">
      <div className="color-dot" style={{ background: teamGradient(t === h ? next.home : next.away) }}></div>
      <div className="name">{t.name}</div>
      <div className="rank">{t.rank}ᵉ · {t.pts} pts</div>
    </div>
  );

  return (
    <div className="hero">
      <div className="label"><span>Prochain match</span><span className="jn">Top 14</span></div>
      <div className="vs">
        {teamBlock(h)}
        <div className="mid">
          {played ? (
            <>
              <div className="kick">{next.day} · {next.time}</div>
              <div className="score">{next.hs} – {next.as}</div>
            </>
          ) : (
            <>
              <div className="kick">{next.day.replace(/ \d/, "\u00A0")} · {next.time}</div>
              <div className="score">vs</div>
            </>
          )}
        </div>
        {teamBlock(a)}
      </div>
      {live && <div className="status-msg">● Match en cours</div>}
      {pending && (
        <div className="countdown">
          {[["h", hh], ["min", mm], ["sec", ss]].map(([u, v]) => (
            <div className="cell" key={u}>
              <div className="v">{pad(v)}</div>
              <div className="u">{u}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Styles ================= */

const CSS = `
  .widget {
    width: 400px; max-width: 100%;
    background: rgba(28, 28, 30, 0.78);
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    overflow: hidden;
    color: #f2f2f7;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    margin: 24px auto;
  }
  .head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .ball { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: linear-gradient(135deg, #2f7d4f, #1e5a38); box-shadow: inset 0 1px 0 rgba(255,255,255,0.25); }
  .head .titles { flex: 1; min-width: 0; }
  .head h1 { font-size: 17px; font-weight: 700; letter-spacing: 0.2px; display: flex; align-items: center; gap: 8px; margin: 0; }
  .head h1 .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #ff453a; box-shadow: 0 0 8px #ff453a; animation: r14pulse 1.6s infinite; }
  .head .sub { font-size: 12px; color: rgba(235,235,245,0.6); margin-top: 2px; }
  .fav-btn { background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.14); color: #f2f2f7; font-size: 13px; font-family: inherit; padding: 7px 12px; border-radius: 10px; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .fav-btn:hover { background: rgba(255,255,255,0.16); }
  .hero { padding: 16px 20px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .hero .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64d2ff; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .hero .label .jn { color: rgba(235,235,245,0.55); font-weight: 600; letter-spacing: 0.4px; }
  .hero .vs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
  .hero .team { text-align: center; }
  .hero .team .color-dot { width: 14px; height: 14px; border-radius: 5px; margin: 0 auto 6px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.35); }
  .hero .team .name { font-size: 14px; font-weight: 700; line-height: 1.25; }
  .hero .team .rank { font-size: 11px; color: rgba(235,235,245,0.55); margin-top: 2px; }
  .hero .mid { text-align: center; min-width: 86px; }
  .hero .mid .kick { font-size: 12px; font-weight: 700; color: #ffd60a; letter-spacing: 0.4px; }
  .hero .mid .score { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
  .countdown { margin-top: 12px; display: flex; justify-content: center; gap: 8px; }
  .countdown .cell { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 0; width: 64px; text-align: center; }
  .countdown .cell .v { font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; color: #fff; }
  .countdown .cell .u { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(235,235,245,0.55); }
  .status-msg { margin-top: 10px; text-align: center; font-size: 13px; font-weight: 700; color: #30d158; }
  .tabs { display: flex; padding: 12px 14px 0; gap: 6px; }
  .tab { flex: 1; background: transparent; border: none; font-family: inherit; font-size: 13px; font-weight: 600; color: rgba(235,235,245,0.55); padding: 8px 4px; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
  .tab:hover { color: #f2f2f7; background: rgba(255,255,255,0.06); }
  .tab.active { color: #fff; background: rgba(100,210,255,0.18); }
  .matches { padding: 12px 14px 6px; }
  .match { display: grid; grid-template-columns: 52px 1fr auto; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 12px; margin-bottom: 4px; }
  .match:hover { background: rgba(255,255,255,0.05); }
  .match.fav-match { background: rgba(48,209,88,0.10); box-shadow: inset 0 0 0 1px rgba(48,209,88,0.35); }
  .match .when { font-size: 11px; font-weight: 700; color: rgba(235,235,245,0.6); line-height: 1.35; }
  .match .when .st-done { color: rgba(235,235,245,0.45); }
  .match .when .st-live { color: #ff453a; }
  .match .when .st-soon { color: #ffd60a; }
  .match .teams { font-size: 13.5px; font-weight: 600; line-height: 1.4; }
  .match .teams .t { display: flex; align-items: center; gap: 7px; }
  .match .teams .dot, .st-row .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.3); }
  .match .teams .winner { font-weight: 800; color: #fff; }
  .match .teams .loser { color: rgba(235,235,245,0.6); }
  .match .sc { text-align: right; font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums; color: #fff; white-space: nowrap; }
  .match .sc .pending { font-size: 11px; font-weight: 700; color: rgba(235,235,245,0.4); }
  .standings { padding: 12px 14px 8px; }
  .st-row { display: grid; grid-template-columns: 26px 12px 1fr auto auto; align-items: center; gap: 8px; padding: 6.5px 10px; border-radius: 10px; font-size: 13px; }
  .st-row:hover { background: rgba(255,255,255,0.05); }
  .st-row .pos { font-weight: 800; font-variant-numeric: tabular-nums; font-size: 12px; color: rgba(235,235,245,0.6); }
  .st-row .barrier { display: flex; }
  .st-row .zone { width: 3.5px; height: 20px; border-radius: 2px; }
  .st-row .zone.top { background: #30d158; }
  .st-row .zone.mid { background: rgba(255,255,255,0.18); }
  .st-row .zone.rele { background: #ff453a; }
  .st-row .zone.access { background: #ff9f0a; }
  .st-row .nm { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .st-row .nm .jj { font-size: 10.5px; color: rgba(235,235,245,0.45); font-weight: 500; margin-left: 5px; }
  .st-row .diff { font-size: 11.5px; color: rgba(235,235,245,0.5); font-variant-numeric: tabular-nums; min-width: 38px; text-align: right; }
  .st-row .pts { font-weight: 800; font-variant-numeric: tabular-nums; min-width: 26px; text-align: right; }
  .st-row.fav-team-row { background: rgba(48,209,88,0.10); }
  .legend { display: flex; gap: 12px; flex-wrap: wrap; padding: 4px 24px 16px; font-size: 10.5px; color: rgba(235,235,245,0.45); }
  .legend span { display: flex; align-items: center; gap: 5px; }
  .legend i { width: 3.5px; height: 11px; border-radius: 2px; display: inline-block; }
  .foot { padding: 10px 20px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: rgba(235,235,245,0.45); }
  @keyframes r14pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
`;

/* ================= Composant principal ================= */

export default function App() {
  const [fav, setFav] = useState(() => storeGet("rugbyFav") || null);
  const [tab, setTab] = useState("j5");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next =
    J5.find((m) => matchStatus(m, now).label !== "Terminé") ||
    J6.find((m) => matchStatus(m, now).label !== "Terminé");
  const live = next && next.kickoff &&
    now >= new Date(next.kickoff).getTime() &&
    now < new Date(next.kickoff).getTime() + 2 * 3600e3;

  const chooseFav = () => {
    const msg =
      "Ton équipe favorite ?\n\n" +
      TEAM_KEYS.map((k) => TEAMS[k].rank + " — " + TEAMS[k].name).join("\n") +
      "\n\nEntre le numéro (1-14), ou laisse vide pour retirer :";
    let input;
    try { input = window.prompt(msg, fav ? String(TEAMS[fav].rank) : ""); } catch (e) { return; }
    if (input === null) return;
    const n = parseInt(input.trim(), 10);
    if (!n || n < 1 || n > 14) { setFav(null); storeSet("rugbyFav", null); }
    else { const k = TEAM_KEYS[n - 1]; setFav(k); storeSet("rugbyFav", k); }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        background:
          "radial-gradient(1200px 700px at 15% 10%, #1b3a5c 0%, transparent 55%), radial-gradient(1000px 800px at 85% 90%, #12352a 0%, transparent 55%), linear-gradient(160deg, #0d1117 0%, #101820 100%)",
      }}
    >
      <style>{CSS}</style>

      <div className="widget">
        <div className="head">
          <div className="ball">🏉</div>
          <div className="titles">
            <h1>
              TOP 14
              {live && <span className="live-dot"></span>}
            </h1>
            <div className="sub">Saison 2026-27 · Journée 5</div>
          </div>
          <button className="fav-btn" onClick={chooseFav} title="Choisir mon équipe">
            ★ {fav ? TEAMS[fav].name : "Équipe"}
          </button>
        </div>

        <Hero now={now} />

        <div className="tabs">
          {[
            ["j5", "Résultats · J5"],
            ["j6", "J6 · À venir"],
            ["classement", "Classement"]
          ].map(([key, label]) => (
            <button
              key={key}
              className={"tab" + (tab === key ? " active" : "")}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "j5" && (
          <div className="matches">
            {J5.map((m, i) => <MatchRow key={i} m={m} fav={fav} now={now} />)}
          </div>
        )}
        {tab === "j6" && (
          <div className="matches">
            {J6.map((m, i) => <MatchRow key={i} m={m} fav={fav} now={now} />)}
          </div>
        )}
        {tab === "classement" && <Standings fav={fav} />}

        <div className="foot">
          <span>
            Mis à jour le{" "}
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span>Données : LNR · après J5</span>
        </div>
      </div>
    </div>
  );
}
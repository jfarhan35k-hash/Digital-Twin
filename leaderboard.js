/* TwinForge leaderboard persistence layer.
   Uses localStorage with schema validation, stable IDs, safe writes and cross-tab refresh. */
(() => {
  "use strict";
  const KEY = "twinforgeLeaderboard";
  const VERSION = 1;
  const MAX_ROWS = 500;

  function normalize(row) {
    if (!row || typeof row !== "object") return null;
    const name = String(row.name || "").trim().slice(0, 24);
    const domain = String(row.domain || "Unknown").slice(0, 40);
    const score = Number(row.score);
    if (!name || !Number.isFinite(score) || score < 0) return null;
    return {
      id: String(row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
      name, domain, score: Math.round(score),
      date: String(row.date || new Date(row.createdAt || Date.now()).toLocaleDateString("en-IN")),
      createdAt: Number(row.createdAt) || Date.now()
    };
  }

  function readEnvelope() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { version: VERSION, entries: [] };
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.entries) ? parsed.entries : [];
      return { version: VERSION, entries: source.map(normalize).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,MAX_ROWS) };
    } catch (error) {
      console.warn("TwinForge leaderboard could not be read:", error);
      return { version: VERSION, entries: [], error: "read" };
    }
  }

  function write(entries) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: VERSION, entries: entries.slice(0,MAX_ROWS) }));
      return { ok: true };
    } catch (error) {
      console.error("TwinForge leaderboard could not be saved:", error);
      return { ok: false, reason: error && error.name === "QuotaExceededError" ? "quota" : "storage" };
    }
  }

  window.TwinForgeLeaderboard = {
    key: KEY,
    getAll() { return readEnvelope().entries; },
    add(input) {
      const row = normalize(input);
      if (!row) return { ok: false, reason: "invalid" };
      const entries = readEnvelope().entries;
      entries.push(row);
      entries.sort((a,b)=>b.score-a.score || a.createdAt-b.createdAt);
      const result = write(entries);
      return result.ok ? { ...result, entry: row, entries: entries.slice(0,MAX_ROWS) } : result;
    },
    clear() {
      try { localStorage.removeItem(KEY); return { ok: true }; }
      catch (error) { return { ok: false, reason: "storage" }; }
    },
    exportCSV() {
      const entries = this.getAll();
      if (!entries.length) return { ok: false, reason: "empty" };
      const rows = [["Rank","Player","Domain","Score","Date"], ...entries.map((r,i)=>[i+1,r.name,r.domain,r.score,r.date])];
      const csv = "\uFEFF" + rows.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(",")).join("\r\n");
      const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "twinforge-leaderboard.csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
      return { ok: true };
    }
  };

  window.addEventListener("storage", event => {
    if (event.key === KEY) window.dispatchEvent(new CustomEvent("twinforge:leaderboard-updated"));
  });
})();

const Trades = (() => {
  let otherRosterId = null;
  const selectedMine = new Set();
  const selectedTheirs = new Set();

  function remainingWeeks() {
    const playoffStart = AppState.league.settings && AppState.league.settings.playoff_week_start;
    const end = playoffStart ? playoffStart - 1 : 17;
    return Math.max(1, end - AppState.week + 1);
  }

  function restOfSeasonValue(playerId) {
    return AppState.projectedPoints(playerId) * remainingWeeks();
  }

  function rosterPlayerList(roster) {
    return (roster.players || []).map((id) => {
      const info = AppState.playerInfo(id);
      return { player_id: id, name: AppState.playerName(id), position: info.position, value: restOfSeasonValue(id) };
    }).sort((a, b) => b.value - a.value);
  }

  function otherRosters() {
    return AppState.rosters.filter((r) => r.roster_id !== AppState.myRoster.roster_id);
  }

  function pickerHtml(players, selectedSet, side) {
    if (!players.length) return `<div class="empty-state">No players</div>`;
    return `<div class="player-picker" data-side="${side}">
      ${players
        .map(
          (p) => `<div class="player-row ${selectedSet.has(p.player_id) ? "selected" : ""}" data-player="${p.player_id}" data-side="${side}">
            <span><span class="pos-badge">${p.position}</span>${p.name}</span>
            <span>${p.value.toFixed(1)}</span>
          </div>`
        )
        .join("")}
    </div>`;
  }

  function verdict(myValue, theirValue) {
    if (myValue === 0 && theirValue === 0) return null;
    const diff = theirValue - myValue;
    const base = Math.max(myValue, theirValue, 1);
    const pct = (diff / base) * 100;
    if (Math.abs(pct) < 8) return { label: "Fairly Balanced", cls: "neutral" };
    if (pct > 0) return { label: `Favors You (+${diff.toFixed(1)} pts rest-of-season)`, cls: "good" };
    return { label: `Favors Them (${diff.toFixed(1)} pts rest-of-season)`, cls: "bad" };
  }

  function render() {
    const el = document.getElementById("panel-trades");
    if (!AppState.myRoster) {
      el.innerHTML = `<div class="empty-state">Load a league first.</div>`;
      return;
    }

    const others = otherRosters();
    if (otherRosterId === null && others.length) otherRosterId = others[0].roster_id;
    const otherRoster = others.find((r) => r.roster_id === otherRosterId) || others[0];

    const mine = rosterPlayerList(AppState.myRoster);
    const theirs = otherRoster ? rosterPlayerList(otherRoster) : [];

    const myValue = [...selectedMine].reduce((s, id) => s + restOfSeasonValue(id), 0);
    const theirValue = [...selectedTheirs].reduce((s, id) => s + restOfSeasonValue(id), 0);
    const result = verdict(myValue, theirValue);

    el.innerHTML = `
      <div class="card">
        <h2>Trade Analyzer</h2>
        <p style="color:var(--text-dim); font-size:0.85rem;">
          Value = projected points/game &times; ${remainingWeeks()} remaining regular-season weeks. Click players on each side to build the proposed trade.
          ${AppState.usingFallbackProjections ? "Live projections weren't available, so this uses trailing averages." : ""}
        </p>
        <label style="font-size:0.85rem; color:var(--text-dim);">Trading with:
          <select id="trade-partner-select">
            ${others.map((r) => `<option value="${r.roster_id}" ${r.roster_id === (otherRoster && otherRoster.roster_id) ? "selected" : ""}>${AppState.ownerNameForRoster(r)}</option>`).join("")}
          </select>
        </label>

        <div class="trade-columns" style="margin-top:1rem;">
          <div>
            <div class="section-label">You Give</div>
            ${pickerHtml(mine, selectedMine, "mine")}
            <div style="margin-top:0.5rem; font-weight:700;">Total value: ${myValue.toFixed(1)}</div>
          </div>
          <div class="vs">VS</div>
          <div>
            <div class="section-label">You Get</div>
            ${pickerHtml(theirs, selectedTheirs, "theirs")}
            <div style="margin-top:0.5rem; font-weight:700;">Total value: ${theirValue.toFixed(1)}</div>
          </div>
        </div>

        ${
          result
            ? `<div class="verdict-banner pill ${result.cls}">${result.label}</div>`
            : `<div class="empty-state">Select at least one player on each side to evaluate the trade.</div>`
        }
      </div>
    `;

    document.getElementById("trade-partner-select").addEventListener("change", (e) => {
      otherRosterId = Number(e.target.value);
      selectedTheirs.clear();
      render();
    });

    el.querySelectorAll(".player-row").forEach((row) => {
      row.addEventListener("click", () => {
        const side = row.dataset.side;
        const playerId = row.dataset.player;
        const set = side === "mine" ? selectedMine : selectedTheirs;
        if (set.has(playerId)) set.delete(playerId);
        else set.add(playerId);
        render();
      });
    });
  }

  return { render };
})();

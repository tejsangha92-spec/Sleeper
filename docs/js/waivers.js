const Waivers = (() => {
  const RELEVANT_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

  function freeAgents() {
    const rostered = AppState.rosteredPlayerIds();
    const all = AppState.allPlayers || {};
    const agents = [];
    for (const id in all) {
      const p = all[id];
      if (rostered.has(id)) continue;
      if (!RELEVANT_POSITIONS.includes(p.position)) continue;
      if (p.active === false) continue;
      agents.push({ player_id: id, name: AppState.playerName(id), position: p.position, team: p.team, proj: AppState.projectedPoints(id) });
    }
    return agents.sort((a, b) => b.proj - a.proj);
  }

  function benchWeaknesses() {
    const roster = AppState.myRoster;
    const starters = new Set(roster.starters || []);
    const bench = (roster.players || [])
      .filter((id) => !starters.has(id))
      .map((id) => {
        const info = AppState.playerInfo(id);
        return { player_id: id, name: AppState.playerName(id), position: info.position, proj: AppState.projectedPoints(id) };
      })
      .filter((p) => RELEVANT_POSITIONS.includes(p.position))
      .sort((a, b) => a.proj - b.proj);
    return bench;
  }

  function render() {
    const el = document.getElementById("panel-waivers");
    if (!AppState.myRoster) {
      el.innerHTML = `<div class="empty-state">Load a league first.</div>`;
      return;
    }

    const agents = freeAgents();
    const bench = benchWeaknesses();

    const topOverall = agents.slice(0, 15);
    const byPosition = {};
    for (const pos of RELEVANT_POSITIONS) {
      byPosition[pos] = agents.filter((a) => a.position === pos).slice(0, 5);
    }

    const suggestions = [];
    for (const weak of bench.slice(0, 5)) {
      const eligiblePickups = agents.filter((a) => a.position === weak.position && a.proj > weak.proj + 1);
      if (eligiblePickups.length) {
        suggestions.push({ drop: weak, add: eligiblePickups[0] });
      }
    }

    el.innerHTML = `
      <div class="card">
        <h2>Waiver Wire Assistant &mdash; Week ${AppState.week}</h2>
        <p style="color:var(--text-dim); font-size:0.85rem;">
          Free agents in your league ranked by projected points.
          ${AppState.usingFallbackProjections ? "Live projections weren't available, so this uses trailing averages." : ""}
        </p>

        <div class="section-label">Suggested Add / Drop</div>
        ${
          suggestions.length
            ? `<table>
                <thead><tr><th>Drop</th><th>Add</th><th>Proj. Gain</th></tr></thead>
                <tbody>
                  ${suggestions
                    .map(
                      (s) => `<tr>
                        <td><span class="pos-badge">${s.drop.position}</span>${s.drop.name} (${s.drop.proj.toFixed(1)})</td>
                        <td><span class="pos-badge">${s.add.position}</span>${s.add.name} (${s.add.proj.toFixed(1)})</td>
                        <td><span class="pill good">+${(s.add.proj - s.drop.proj).toFixed(1)}</span></td>
                      </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
            : `<div class="empty-state">No clear upgrades found on the waiver wire right now.</div>`
        }

        <div class="section-label">Top Available (All Positions)</div>
        <table>
          <thead><tr><th>Player</th><th>Team</th><th>Proj.</th></tr></thead>
          <tbody>
            ${topOverall
              .map(
                (a) => `<tr>
                  <td><span class="pos-badge">${a.position}</span>${a.name}</td>
                  <td>${a.team || "FA"}</td>
                  <td>${a.proj.toFixed(1)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="grid-2">
        ${Object.keys(byPosition)
          .map(
            (pos) => `<div class="card">
              <h3>Top ${pos} Available</h3>
              <table>
                <tbody>
                  ${byPosition[pos]
                    .map((a) => `<tr><td>${a.name} <span style="color:var(--text-dim)">(${a.team || "FA"})</span></td><td>${a.proj.toFixed(1)}</td></tr>`)
                    .join("") || '<tr><td class="empty-state">None available</td></tr>'}
                </tbody>
              </table>
            </div>`
          )
          .join("")}
      </div>
    `;
  }

  return { render };
})();

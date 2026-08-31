const Dashboard = (() => {
  function render() {
    const el = document.getElementById("panel-dashboard");
    if (!AppState.league) {
      el.innerHTML = `<div class="empty-state">Load your username and pick a league to see your dashboard.</div>`;
      return;
    }
    if (!AppState.myRoster) {
      el.innerHTML = `<div class="empty-state">Couldn't find a roster for you in this league.</div>`;
      return;
    }

    const league = AppState.league;
    const roster = AppState.myRoster;
    const starters = roster.starters || [];
    const bench = (roster.players || []).filter((p) => !starters.includes(p));

    const standings = [...AppState.rosters].sort((a, b) => {
      const aw = (a.settings && a.settings.wins) || 0;
      const bw = (b.settings && b.settings.wins) || 0;
      if (bw !== aw) return bw - aw;
      const afp = (a.settings && a.settings.fpts) || 0;
      const bfp = (b.settings && b.settings.fpts) || 0;
      return bfp - afp;
    });

    const rosterRow = (playerId, isStarter) => {
      const p = AppState.playerInfo(playerId);
      return `<tr>
        <td><span class="pos-badge">${p.position || "-"}</span>${AppState.playerName(playerId)}${p.team ? ` <span style="color:var(--text-dim)">(${p.team})</span>` : ""}</td>
        <td>${isStarter ? '<span class="pill good">Starting</span>' : '<span class="pill neutral">Bench</span>'}</td>
      </tr>`;
    };

    el.innerHTML = `
      <div class="card">
        <h2>${league.name}</h2>
        <div style="color:var(--text-dim); font-size:0.85rem;">
          Season ${league.season} &middot; ${league.total_rosters} teams &middot; Week ${AppState.week}
          ${AppState.usingFallbackProjections ? '<span class="pill warn" style="margin-left:0.5rem;">Using trailing-average estimates (live projections unavailable)</span>' : ""}
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>Your Roster</h3>
          <table>
            <tbody>
              ${starters.map((p) => rosterRow(p, true)).join("")}
              ${bench.map((p) => rosterRow(p, false)).join("")}
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3>Standings</h3>
          <table>
            <thead><tr><th>Team</th><th>W-L</th><th>PF</th></tr></thead>
            <tbody>
              ${standings
                .map((r) => {
                  const s = r.settings || {};
                  const isMe = r.roster_id === roster.roster_id;
                  return `<tr ${isMe ? 'style="font-weight:700;color:var(--accent);"' : ""}>
                    <td>${AppState.ownerNameForRoster(r)}${isMe ? " (you)" : ""}</td>
                    <td>${s.wins || 0}-${s.losses || 0}${s.ties ? `-${s.ties}` : ""}</td>
                    <td>${(s.fpts || 0) + "." + (s.fpts_decimal || 0)}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return { render };
})();

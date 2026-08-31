const Optimizer = (() => {
  function computeOptimalLineup() {
    const roster = AppState.myRoster;
    const slots = Scoring.startingSlots(AppState.league.roster_positions);
    const players = (roster.players || []).map((id) => {
      const info = AppState.playerInfo(id);
      return {
        player_id: id,
        position: info.position,
        proj: AppState.projectedPoints(id),
      };
    });

    const orderedSlots = slots
      .map((slot, idx) => ({ slot, idx, eligible: Scoring.slotEligiblePositions(slot) }))
      .sort((a, b) => a.eligible.length - b.eligible.length);

    const used = new Set();
    const assignment = [];
    for (const s of orderedSlots) {
      const candidates = players
        .filter((p) => !used.has(p.player_id) && s.eligible.includes(p.position))
        .sort((a, b) => b.proj - a.proj);
      const pick = candidates[0] || null;
      if (pick) used.add(pick.player_id);
      assignment.push({ slot: s.slot, idx: s.idx, player: pick });
    }
    assignment.sort((a, b) => a.idx - b.idx);
    return assignment;
  }

  function render() {
    const el = document.getElementById("panel-optimizer");
    if (!AppState.myRoster) {
      el.innerHTML = `<div class="empty-state">Load a league first.</div>`;
      return;
    }

    const optimal = computeOptimalLineup();
    const currentStarters = AppState.myRoster.starters || [];

    const rows = optimal
      .map((slot, i) => {
        const currentId = currentStarters[i];
        const currentName = currentId && currentId !== "0" ? AppState.playerName(currentId) : "(empty)";
        const currentProj = currentId ? AppState.projectedPoints(currentId) : 0;
        const optName = slot.player ? AppState.playerName(slot.player.player_id) : "(no eligible player)";
        const optProj = slot.player ? slot.player.proj : 0;
        const changed = currentId !== (slot.player ? slot.player.player_id : undefined);
        return `<tr class="${changed ? "changed" : ""}">
          <td><span class="pos-badge">${slot.slot}</span></td>
          <td>${currentName} <span style="color:var(--text-dim)">(${currentProj.toFixed(1)} pts)</span></td>
          <td>${optName} <span style="color:var(--text-dim)">(${optProj.toFixed(1)} pts)</span></td>
          <td>${changed ? '<span class="pill good">Swap in</span>' : '<span class="pill neutral">Keep</span>'}</td>
        </tr>`;
      })
      .join("");

    const currentTotal = currentStarters.reduce((sum, id) => sum + (id ? AppState.projectedPoints(id) : 0), 0);
    const optimalTotal = optimal.reduce((sum, s) => sum + (s.player ? s.player.proj : 0), 0);
    const delta = optimalTotal - currentTotal;

    el.innerHTML = `
      <div class="card">
        <h2>Lineup Optimizer &mdash; Week ${AppState.week}</h2>
        <p style="color:var(--text-dim); font-size:0.85rem;">
          Recommended starters ranked by projected points, respecting your league's roster slots (FLEX/SUPERFLEX included).
          ${AppState.usingFallbackProjections ? "Live projections weren't available, so this uses each player's trailing average from recent weeks." : ""}
        </p>
        <table>
          <thead><tr><th>Slot</th><th>Current</th><th>Recommended</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="verdict-banner ${delta > 0.5 ? "pill good" : "pill neutral"}" style="margin-top:1rem;">
          ${delta > 0.5
            ? `Setting the recommended lineup gains you an estimated +${delta.toFixed(1)} points this week.`
            : "Your current lineup is already at (or near) the optimal projected total."}
        </div>
      </div>
    `;
  }

  return { render, computeOptimalLineup };
})();

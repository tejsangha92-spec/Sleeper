(() => {
  const F = window.__FIXTURES__;

  function jsonResponse(data) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
  }

  window.fetch = (url) => {
    if (url.includes("/leagues/nfl/")) return jsonResponse(F.leagues);
    if (url.includes("/user/")) return jsonResponse(F.user);
    if (url.includes("/league/100/rosters")) return jsonResponse(F.rosters);
    if (url.includes("/league/100/users")) return jsonResponse(F.leagueUsers);
    if (url.includes("/league/100")) return jsonResponse(F.league);
    if (url.includes("/state/nfl")) return jsonResponse(F.nflState);
    if (url.includes("/players/nfl")) return jsonResponse(F.allPlayers);
    if (url.includes("/projections/")) return jsonResponse(F.projections);
    if (url.includes("/stats/")) return jsonResponse({});
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
})();

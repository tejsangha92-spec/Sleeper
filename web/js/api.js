const SleeperApi = (() => {
  const BASE = "https://api.sleeper.app/v1";
  const PROJECTIONS_BASE = "https://api.sleeper.app/projections/nfl";
  const PLAYERS_CACHE_KEY = "sleeper_players_cache_v1";
  const PLAYERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status}): ${url}`);
    return res.json();
  }

  function getUser(username) {
    return getJSON(`${BASE}/user/${encodeURIComponent(username)}`);
  }

  function getUserLeagues(userId, season) {
    return getJSON(`${BASE}/user/${userId}/leagues/nfl/${season}`);
  }

  function getLeague(leagueId) {
    return getJSON(`${BASE}/league/${leagueId}`);
  }

  function getLeagueRosters(leagueId) {
    return getJSON(`${BASE}/league/${leagueId}/rosters`);
  }

  function getLeagueUsers(leagueId) {
    return getJSON(`${BASE}/league/${leagueId}/users`);
  }

  function getMatchups(leagueId, week) {
    return getJSON(`${BASE}/league/${leagueId}/matchups/${week}`);
  }

  function getTransactions(leagueId, week) {
    return getJSON(`${BASE}/league/${leagueId}/transactions/${week}`);
  }

  function getNflState() {
    return getJSON(`${BASE}/state/nfl`);
  }

  function getWeekStats(season, week) {
    return getJSON(`${BASE}/stats/nfl/regular/${season}/${week}`);
  }

  async function getWeekProjections(season, week) {
    try {
      return await getJSON(`${PROJECTIONS_BASE}/regular/${season}/${week}`);
    } catch (e) {
      console.warn("Projections endpoint unavailable, will fall back to trailing averages", e);
      return null;
    }
  }

  async function getAllPlayers() {
    const cachedRaw = localStorage.getItem(PLAYERS_CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (Date.now() - cached.ts < PLAYERS_CACHE_TTL_MS) {
          return cached.data;
        }
      } catch (e) {
        // fall through to refetch
      }
    }
    const data = await getJSON(`${BASE}/players/nfl`);
    try {
      localStorage.setItem(PLAYERS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
      // localStorage quota exceeded on some browsers for ~5MB payloads; app still works uncached
      console.warn("Could not cache player list locally", e);
    }
    return data;
  }

  return {
    getUser,
    getUserLeagues,
    getLeague,
    getLeagueRosters,
    getLeagueUsers,
    getMatchups,
    getTransactions,
    getNflState,
    getWeekStats,
    getWeekProjections,
    getAllPlayers,
  };
})();

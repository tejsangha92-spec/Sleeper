const AppState = {
  username: null,
  userId: null,
  season: null,
  week: null,
  leagues: [],
  leagueId: null,
  league: null,
  rosters: [],
  leagueUsers: [],
  myRoster: null,
  allPlayers: null,
  projections: null, // player_id -> raw stat line for the selected week, or null if unavailable
  usingFallbackProjections: false,

  reset() {
    this.leagueId = null;
    this.league = null;
    this.rosters = [];
    this.leagueUsers = [];
    this.myRoster = null;
    this.projections = null;
    this.usingFallbackProjections = false;
  },

  rosteredPlayerIds() {
    const ids = new Set();
    for (const r of this.rosters) {
      (r.players || []).forEach((p) => ids.add(p));
    }
    return ids;
  },

  ownerNameForRoster(roster) {
    const u = this.leagueUsers.find((u) => u.user_id === roster.owner_id);
    if (!u) return "Unknown";
    return (u.metadata && u.metadata.team_name) || u.display_name || u.username || "Unknown";
  },

  playerInfo(playerId) {
    if (this.allPlayers && this.allPlayers[playerId]) return this.allPlayers[playerId];
    // Defense entries are keyed by team abbreviation and may be absent from the dict
    return { player_id: playerId, full_name: playerId, position: "DEF", team: playerId };
  },

  playerName(playerId) {
    const p = this.playerInfo(playerId);
    if (p.full_name) return p.full_name;
    if (p.first_name || p.last_name) return `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return playerId;
  },

  projectedPoints(playerId) {
    if (!this.projections) return 0;
    const line = this.projections[playerId];
    if (!line) return 0;
    return Scoring.computePoints(line, this.league.scoring_settings);
  },

  async loadUser(username) {
    const user = await SleeperApi.getUser(username);
    if (!user || !user.user_id) throw new Error(`No Sleeper user found for "${username}"`);
    this.username = username;
    this.userId = user.user_id;
    const nflState = await SleeperApi.getNflState();
    this.season = nflState.season;
    this.week = nflState.display_week || nflState.week || 1;
    this.leagues = await SleeperApi.getUserLeagues(this.userId, this.season);
    if (!this.leagues.length) {
      // try previous season as a fallback (e.g. offseason with no leagues created yet)
      const prevSeason = String(Number(this.season) - 1);
      const prevLeagues = await SleeperApi.getUserLeagues(this.userId, prevSeason);
      if (prevLeagues.length) {
        this.season = prevSeason;
        this.leagues = prevLeagues;
      }
    }
    return this.leagues;
  },

  async loadLeague(leagueId, week) {
    this.reset();
    this.leagueId = leagueId;
    this.week = week || this.week;
    const [league, rosters, leagueUsers, allPlayers] = await Promise.all([
      SleeperApi.getLeague(leagueId),
      SleeperApi.getLeagueRosters(leagueId),
      SleeperApi.getLeagueUsers(leagueId),
      this.allPlayers ? Promise.resolve(this.allPlayers) : SleeperApi.getAllPlayers(),
    ]);
    this.league = league;
    this.rosters = rosters;
    this.leagueUsers = leagueUsers;
    this.allPlayers = allPlayers;
    this.myRoster = rosters.find((r) => r.owner_id === this.userId) || null;

    await this.loadProjectionsForWeek(this.week);
    return this.league;
  },

  async loadProjectionsForWeek(week) {
    this.week = week;
    const live = await SleeperApi.getWeekProjections(this.season, week);
    if (live && Object.keys(live).length) {
      this.projections = live;
      this.usingFallbackProjections = false;
      return;
    }
    // Fallback: average of the last few completed weeks' actual stats as a stand-in projection
    this.usingFallbackProjections = true;
    const trailingWeeks = [];
    for (let w = week - 1; w >= Math.max(1, week - 4); w--) trailingWeeks.push(w);
    if (!trailingWeeks.length) {
      this.projections = {};
      return;
    }
    const weekStats = await Promise.all(
      trailingWeeks.map((w) => SleeperApi.getWeekStats(this.season, w).catch(() => ({})))
    );
    const sums = {};
    const counts = {};
    for (const stats of weekStats) {
      for (const playerId in stats) {
        sums[playerId] = sums[playerId] || {};
        counts[playerId] = (counts[playerId] || 0) + 1;
        const line = stats[playerId];
        for (const key in line) {
          if (typeof line[key] === "number") {
            sums[playerId][key] = (sums[playerId][key] || 0) + line[key];
          }
        }
      }
    }
    const averaged = {};
    for (const playerId in sums) {
      const n = counts[playerId] || 1;
      const avgLine = {};
      for (const key in sums[playerId]) avgLine[key] = sums[playerId][key] / n;
      averaged[playerId] = avgLine;
    }
    this.projections = averaged;
  },
};

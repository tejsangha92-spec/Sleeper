(() => {
  const usernameInput = document.getElementById("username-input");
  const loadUserBtn = document.getElementById("load-user-btn");
  const leagueSelect = document.getElementById("league-select");
  const weekSelect = document.getElementById("week-select");
  const statusLine = document.getElementById("status-line");
  const tabButtons = document.querySelectorAll("nav.tabs button");
  const panels = {
    dashboard: document.getElementById("panel-dashboard"),
    optimizer: document.getElementById("panel-optimizer"),
    waivers: document.getElementById("panel-waivers"),
    trades: document.getElementById("panel-trades"),
  };

  const LAST_USER_KEY = "sleeper_aid_last_username";
  const LAST_LEAGUE_KEY = "sleeper_aid_last_league";

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.style.color = isError ? "var(--bad)" : "var(--text-dim)";
  }

  function renderAll() {
    Dashboard.render();
    Optimizer.render();
    Waivers.render();
    Trades.render();
  }

  function populateWeekSelect() {
    weekSelect.innerHTML = "";
    for (let w = 1; w <= 18; w++) {
      const opt = document.createElement("option");
      opt.value = w;
      opt.textContent = `Week ${w}`;
      if (w === Number(AppState.week)) opt.selected = true;
      weekSelect.appendChild(opt);
    }
    weekSelect.disabled = false;
  }

  async function handleLoadUser() {
    const username = usernameInput.value.trim();
    if (!username) return;
    setStatus(`Loading Sleeper user "${username}"...`);
    loadUserBtn.disabled = true;
    try {
      const leagues = await AppState.loadUser(username);
      localStorage.setItem(LAST_USER_KEY, username);
      if (!leagues.length) {
        setStatus(`No leagues found for "${username}" in season ${AppState.season}.`, true);
        leagueSelect.innerHTML = `<option>No leagues found</option>`;
        leagueSelect.disabled = true;
        return;
      }
      leagueSelect.innerHTML = leagues
        .map((l) => `<option value="${l.league_id}">${l.name} (${l.season})</option>`)
        .join("");
      leagueSelect.disabled = false;

      const lastLeague = localStorage.getItem(LAST_LEAGUE_KEY);
      const toSelect = leagues.find((l) => l.league_id === lastLeague) || leagues[0];
      leagueSelect.value = toSelect.league_id;

      await handleLoadLeague(toSelect.league_id);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Failed to load user.", true);
    } finally {
      loadUserBtn.disabled = false;
    }
  }

  async function handleLoadLeague(leagueId) {
    setStatus("Loading league data...");
    try {
      await AppState.loadLeague(leagueId, AppState.week);
      localStorage.setItem(LAST_LEAGUE_KEY, leagueId);
      populateWeekSelect();
      renderAll();
      setStatus(`Loaded "${AppState.league.name}" — Week ${AppState.week}.`);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Failed to load league.", true);
    }
  }

  async function handleWeekChange() {
    const week = Number(weekSelect.value);
    setStatus(`Loading Week ${week} projections...`);
    try {
      await AppState.loadProjectionsForWeek(week);
      renderAll();
      setStatus(`Showing Week ${week}.`);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Failed to load week.", true);
    }
  }

  function switchTab(tabName) {
    tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
    Object.entries(panels).forEach(([name, el]) => el.classList.toggle("active", name === tabName));
  }

  loadUserBtn.addEventListener("click", handleLoadUser);
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoadUser();
  });
  leagueSelect.addEventListener("change", (e) => handleLoadLeague(e.target.value));
  weekSelect.addEventListener("change", handleWeekChange);
  tabButtons.forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

  const savedUsername = localStorage.getItem(LAST_USER_KEY);
  if (savedUsername) usernameInput.value = savedUsername;
})();

const Scoring = (() => {
  function computePoints(statLine, scoringSettings) {
    if (!statLine || !scoringSettings) return 0;
    let total = 0;
    for (const key in scoringSettings) {
      const weight = scoringSettings[key];
      const value = statLine[key];
      if (typeof weight === "number" && typeof value === "number") {
        total += weight * value;
      }
    }
    return Math.round(total * 100) / 100;
  }

  const FLEX_MAP = {
    FLEX: ["RB", "WR", "TE"],
    SUPER_FLEX: ["QB", "RB", "WR", "TE"],
    WRRB_FLEX: ["RB", "WR"],
    WRTE_FLEX: ["WR", "TE"],
    REC_FLEX: ["WR", "TE"],
    IDP_FLEX: ["DL", "LB", "DB"],
  };

  function slotEligiblePositions(slot) {
    return FLEX_MAP[slot] || [slot];
  }

  function startingSlots(rosterPositions) {
    return (rosterPositions || []).filter((s) => s !== "BN" && s !== "IR" && s !== "TAXI");
  }

  return { computePoints, slotEligiblePositions, startingSlots, FLEX_MAP };
})();

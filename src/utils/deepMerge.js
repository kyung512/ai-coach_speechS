export const deepMerge = (db = {}, local = {}) => {
  db = db || {};
  local = local || {};
  return {
    ...db, // from supabase
    ...local,

    // Merge basic fields first (these are essential, such as name, email, gender)
    name:        local.name        ?? db.name   ?? null,
    age:         local.age         ?? db.age    ?? null,
    gender:      local.gender      ?? db.gender ?? null,

    history:     local.history     ?? db.history     ?? [],
    goals:       local.goals       ?? db.goals       ?? [],
    moodHistory: local.moodHistory ?? db.moodHistory ?? [],

    updatedAt:   local.updatedAt   ?? db.updatedAt ?? Date.now(),
    dirty:       local.dirty       ?? db.dirty     ?? false,
  };
};

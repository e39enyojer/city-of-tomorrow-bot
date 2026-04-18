// src/utils/database.js — pure JS JSON database (no native deps, works on Railway)
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE  = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { boosters: {}, gunLicenses: {}, handicap: {}, warnings: {} }; }
}
function save(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

module.exports = {
  addBooster(userId, username, robloxId, addedBy) {
    const db = load(); db.boosters[userId] = { username, robloxId, addedBy, at: Date.now() }; save(db);
  },
  removeBooster(userId)  { const db = load(); delete db.boosters[userId]; save(db); },
  isBooster(userId)      { return !!load().boosters[userId]; },
  getAllBoosters()        { const db = load(); return Object.entries(db.boosters).map(([id,v]) => ({ user_id: id, ...v })); },

  grantLicense(robloxId, robloxName, discordId, grantedBy, cardUrl = '') {
    const db = load(); db.gunLicenses[robloxId] = { roblox_name: robloxName, discordId, grantedBy, cardUrl, at: Date.now() }; save(db);
  },
  revokeLicense(robloxId)  { const db = load(); delete db.gunLicenses[robloxId]; save(db); },
  hasLicense(robloxId)     { return !!load().gunLicenses[robloxId]; },
  getAllLicenses()          { const db = load(); return Object.entries(db.gunLicenses).map(([id,v]) => ({ roblox_id: Number(id), ...v })); },

  addWarning(discordId, reason, modId, modName) {
    const db = load();
    if (!db.warnings[discordId]) db.warnings[discordId] = [];
    db.warnings[discordId].push({ reason, modId, modName, at: Date.now() });
    save(db);
  },
  getWarnings(discordId) { return load().warnings[discordId] || []; },
  clearWarnings(discordId) { const db = load(); delete db.warnings[discordId]; save(db); },
};

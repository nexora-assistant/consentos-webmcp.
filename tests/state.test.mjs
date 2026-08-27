import assert from 'node:assert/strict';
import { initialState, scoreState } from '../src/state.js';

const seed = initialState();
const initial = scoreState(seed);
assert.equal(initial.score, 54, 'seed score must be 54');
assert.equal(initial.riskCount, 8, 'seed must expose 8 avoidable risk factors');

seed.toggles.adPersonalization = false;
seed.toggles.preciseAds = false;
seed.toggles.searchPersonalization = false;
for (const app of seed.apps) {
  if (!app.essential && app.lastUsedDays > 45) app.connected = false;
}
for (const session of seed.sessions) {
  if (!session.familiar) session.active = false;
}
for (const category of seed.dataCategories) {
  if (['data_location', 'data_ads', 'data_contacts'].includes(category.id)) category.retention = '3 months';
  if (category.id === 'data_voice') category.retention = '6 months';
}

const hardened = scoreState(seed);
assert.equal(hardened.score, 96, 'fully hardened score must be 96');
assert.equal(hardened.riskCount, 0, 'fully hardened state must have 0 avoidable risk factors');
console.log('state.test: PASS — 54/8 → 96/0');

import { NIGERIA_SATELLITES_TLE } from './nigeriaSatellites.js';

const GROUPS = new Set([
  'stations',
  'visual',
  'gps-ops',
  'glo-ops',
  'galileo',
  'geo',
  'starlink',
]);

/** Read catalog text from the existing group endpoint using a supplied transport. */
export function createSatelliteSource({
  fetchImpl = (...args) => globalThis.fetch(...args),
} = {}) {
  return {
    async readGroup(group, { signal } = {}) {
      if (!GROUPS.has(group)) throw new TypeError('Unknown satellite group');
      signal?.throwIfAborted();
      const response = await fetchImpl(`/api/celestrak/${group}`, { signal });
      let text = response.ok ? await response.text() : '';
      signal?.throwIfAborted();
      // Ensure sovereign orbital assets (e.g. NigeriaSat-2, NigeriaSat-X) are
      // always present in visual/Earth observation tracking even if omitted by upstream groups.
      if (group === 'visual' && text) {
        text = `${NIGERIA_SATELLITES_TLE}\n${text}`;
      }
      // The proxy serves its last copy, marked STALE-ERROR, when CelesTrak
      // is down.
      const stale = response.headers?.get?.('x-tle-cache') === 'STALE-ERROR';
      return { ok: response.ok, status: response.status, text, stale };
    },
  };
}

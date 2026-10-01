import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { createRequire } from 'node:module';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-cal-')); process.env.HW_FAST_TESTS = '1';
const CAL = await import('../lib/calendar.mjs'); const core = createRequire(import.meta.url)('../../core.js');
const res = (status, body, headers = {}) => ({ ok: status < 400, status, headers: { get: k => headers[k.toLowerCase()] || null }, text: async () => body });
const day = (n, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d; };
const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

test('ics: time zones, weekly series with an exception and a moved instance, all-day, cancelled, free', () => {
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:a', 'DTSTART;TZID=America/New_York:20261005T090000', 'DTEND;TZID=America/New_York:20261005T091500', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=8', 'EXDATE;TZID=America/New_York:20261007T090000', 'SUMMARY:Standup', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:a', 'RECURRENCE-ID;TZID=America/New_York:20261008T090000', 'DTSTART;TZID=America/New_York:20261008T100000', 'DTEND;TZID=America/New_York:20261008T101500', 'SUMMARY:Standup', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:b', 'DTSTART:20261006T170000Z', 'DURATION:PT1H30M', 'SUMMARY:Investor call\\, round 2 with a long', '  title', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:c', 'DTSTART;VALUE=DATE:20261009', 'DTEND;VALUE=DATE:20261010', 'SUMMARY:Holiday', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:e', 'DTSTART:20261006T120000Z', 'DTEND:20261006T130000Z', 'STATUS:CANCELLED', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:f', 'DTSTART:20261006T200000Z', 'DTEND:20261006T210000Z', 'TRANSP:TRANSPARENT', 'SUMMARY:Focus (free)', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const b = core.parseICS(ics, { from: Date.UTC(2026, 9, 5), to: Date.UTC(2026, 9, 31) });
  const su = b.filter(x => x.title === 'Standup').map(x => new Date(x.start).toISOString());
  assert.equal(su[0], '2026-10-05T13:00:00.000Z', 'New York 9:00 in daylight time is 13:00 UTC');
  assert.ok(!su.includes('2026-10-07T13:00:00.000Z'), 'EXDATE skipped');
  assert.ok(su.includes('2026-10-08T14:00:00.000Z') && !su.includes('2026-10-08T13:00:00.000Z'), 'the moved Thursday replaces the series one');
  assert.equal(su.length, 7, 'COUNT=8 counts the skipped day (RFC 5545), so 6 left in the series plus the moved one');
  assert.ok(su.includes('2026-11-02T14:00:00.000Z') || su.every(x => x < '2026-10-31'), 'within the window');
  assert.ok(b.find(x => /Investor call, round 2 with a long title/.test(x.title)) && b.find(x => x.title.startsWith('Investor')).end - b.find(x => x.title.startsWith('Investor')).start === 90 * 6e4, 'folded line, escaped comma, DURATION');
  assert.ok(!b.some(x => /Holiday|Focus/.test(x.title)) && !b.some(x => x.start === Date.UTC(2026, 9, 6, 12)), 'all-day, free and cancelled events don’t block');
  assert.equal(core.busyAt(b, Date.UTC(2026, 9, 6, 12, 50)).title, 'Standup'); assert.equal(core.busyAt(b, Date.UTC(2026, 9, 6, 14, 0)), null);
  /* DST: the same 9:00 New York standup is 14:00 UTC in November */
  const w = core.parseICS(['BEGIN:VEVENT', 'DTSTART;TZID=America/New_York:20261030T090000', 'DTEND;TZID=America/New_York:20261030T093000', 'RRULE:FREQ=DAILY;INTERVAL=3', 'SUMMARY:x', 'END:VEVENT'].join('\n'), { from: Date.UTC(2026, 9, 29), to: Date.UTC(2026, 10, 6) });
  assert.deepEqual(w.map(x => new Date(x.start).toISOString().slice(5, 16)), ['10-30T13:00', '11-02T14:00', '11-05T14:00']);
});

test('calendar link: only public https feeds, redirects re-checked, link stays on the server', async () => {
  await assert.rejects(CAL.setLink('http://example.com/cal.ics'), /https/);
  await assert.rejects(CAL.setLink('https://127.0.0.1/cal.ics'), /private/);
  await assert.rejects(CAL.setLink('https://localhost/cal.ics'), /private/);
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', `DTSTART:${stamp(day(1, 9))}`, `DTEND:${stamp(day(1, 10))}`, 'SUMMARY:Dentist', 'END:VEVENT', 'END:VCALENDAR'].join('\n');
  let hops = [];
  globalThis.fetch = async (u, o) => { hops.push(String(u)); assert.equal(o.redirect, 'manual'); if (String(u).includes('old')) return res(302, '', { location: 'https://calendar.example.com/new.ics' }); return res(200, ics); };
  const r = await CAL.setLink('webcal://calendar.example.com/old.ics');
  assert.equal(r.connected, true); assert.equal(r.events, 1); assert.deepEqual(hops, ['https://calendar.example.com/old.ics', 'https://calendar.example.com/new.ics']);
  const b = await CAL.busy(); assert.equal(b.busy[0].title, 'Dentist'); assert.ok(!('url' in b), 'the secret link is never sent back');
  globalThis.fetch = async u => String(u).includes('evil') ? res(302, '', { location: 'https://127.0.0.1/x' }) : res(200, 'nope');
  await assert.rejects(CAL.setLink('https://evil.example.com/a.ics'), /private/);
  await assert.rejects(CAL.setLink('https://calendar.example.com/notics'), /isn’t an iCal/);
  assert.equal((await CAL.setLink('')).connected, false); assert.equal(CAL.connected(), false);
});

test('hook vote: public link, one vote per person (changeable), no voter list leaks', async () => {
  const VO = await import('../lib/votes.mjs');
  assert.throws(() => VO.createVote({ options: ['only one'] }), /at least two/);
  assert.throws(() => VO.createVote({ options: ['Same line', 'same line'] }), /same/);
  const v = VO.createVote({ options: ['I raised prices 40%.', 'Pricing is a product decision.', '', 'Charge more.'], author: 'Sam' });
  assert.equal(v.options.length, 3); assert.equal(v.author, 'Sam'); assert.equal(v.total, 0);
  const a = 'voter-aaaaaaaaaaaa', b = 'voter-bbbbbbbbbbbb';
  VO.castVote(v.id, { choice: 0, voter: a }); VO.castVote(v.id, { choice: 0, voter: b }); const r = VO.castVote(v.id, { choice: 2, voter: a });
  assert.deepEqual(r.counts, [1, 0, 1]); assert.equal(r.total, 2); assert.equal(r.mine, 2); assert.ok(!('voters' in r));
  assert.deepEqual(VO.castVote(v.id, { choice: 2, voter: a }).counts, [1, 0, 1], 'same vote twice counts once');
  assert.throws(() => VO.castVote(v.id, { choice: 9, voter: a }), /Pick one/); assert.throws(() => VO.castVote(v.id, { choice: 0, voter: 'x' }), /voter/);
  assert.throws(() => VO.getVote('nope-nope-nope'), e => e.status === 404); assert.equal(VO.mineFor(v.id, b), 0);
});

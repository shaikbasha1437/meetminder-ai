'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const parse = load('js/meet/parse.js');

describe('parse', () => {
  it('parses plain speaker lines', () => {
    const r = parse.parse('[00:12] Ava Chen: Hello there\nJordan Lee: Hi Ava', { format: 'txt' });
    assert.equal(r.turns.length, 2);
    assert.equal(r.turns[0].speaker, 'Ava Chen');
    assert.equal(r.turns[0].t, 12);
  });
  it('parses VTT', () => {
    const vtt = 'WEBVTT\n\n1\n00:00:05.000 --> 00:00:08.000\nAva Chen: Welcome everyone\n\n2\n00:00:09.000 --> 00:00:12.000\nJordan Lee: Thanks Ava\n';
    const r = parse.parse(vtt, { format: 'vtt' });
    assert.equal(r.turns.length, 2);
    assert.equal(r.turns[0].t, 5);
    assert.match(r.turns[0].text, /Welcome/);
  });
  it('parses SRT', () => {
    const srt = '1\n00:00:03,000 --> 00:00:06,000\nSam Ortiz: Morning all\n\n2\n00:00:07,000 --> 00:00:10,000\nRiley Kim: Auth is at eighty percent\n';
    const r = parse.parse(srt, { filename: 'a.srt' });
    assert.equal(r.format, 'srt');
    assert.equal(r.turns[1].speaker, 'Riley Kim');
  });
  it('parses JSON turns', () => {
    const r = parse.parse(JSON.stringify({ transcript: [{ t: 1, speaker: 'A', text: 'Hi' }] }), { format: 'json' });
    assert.equal(r.turns[0].text, 'Hi');
  });
  it('fmtTime', () => {
    assert.equal(parse.fmtTime(65), '1:05');
    assert.equal(parse.fmtTime(3661), '1:01:01');
  });
  it('renameSpeaker', () => {
    const turns = parse.renameSpeaker([{ t: 0, speaker: 'A', text: 'x' }], 'A', 'Ava');
    assert.equal(turns[0].speaker, 'Ava');
  });
});

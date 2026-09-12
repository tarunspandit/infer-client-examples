import test from 'node:test';
import assert from 'node:assert/strict';
import { main, outputText, ENDPOINT, DEFAULT_MODEL } from './responses.mjs';

const fixture = { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'A regression breaks previously working behavior.' }] }] };
function harness(transport, extra = {}) {
  const logs = [], errors = [];
  return { logs, errors, options: { args: ['Explain', 'regression'], env: { INFER_API_KEY: 'test-only-not-a-key' }, transport, log: x => logs.push(x), error: x => errors.push(x), ...extra } };
}
test('one bounded request uses exact endpoint, model and auth', async () => {
  let calls = 0;
  const h = harness(async (url, options) => {
    calls += 1;
    assert.equal(url, ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer test-only-not-a-key');
    assert.deepEqual(JSON.parse(options.body), { model: DEFAULT_MODEL, input: 'Explain regression', max_output_tokens: 1024, stream: false });
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => fixture };
  });
  assert.equal(await main(h.options), 0);
  assert.equal(calls, 1);
  assert.deepEqual(h.logs, ['A regression breaks previously working behavior.']);
});
test('Sol selector can be chosen explicitly', async () => {
  const h = harness(async (_, options) => {
    assert.equal(JSON.parse(options.body).model, 'infer/gpt-5.6-sol:low-cost');
    return { ok: true, json: async () => fixture };
  }, { env: { INFER_API_KEY: 'test-only', INFER_MODEL: 'infer/gpt-5.6-sol:low-cost' } });
  assert.equal(await main(h.options), 0);
});
for (const extra of [{ env: {} }, { args: [] }]) {
  test(`missing ${extra.env ? 'key' : 'prompt'} makes no request`, async () => {
    const h = harness(() => { throw Error('must not call transport'); }, extra);
    assert.equal(await main(h.options), 2);
  });
}
for (const [name, transport] of [
  ['HTTP failure', async () => ({ ok: false, status: 402 })],
  ['timeout', async () => { throw Error('test-only-not-a-key'); }],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw Error('bad JSON'); } })],
  ['incomplete response', async () => ({ ok: true, json: async () => ({ ...fixture, status: 'incomplete' }) })],
]) {
  test(`${name} does not retry or expose secrets`, async () => {
    let calls = 0;
    const h = harness(async (...args) => { calls += 1; return transport(...args); });
    assert.equal(await main(h.options), 1);
    assert.equal(calls, 1);
    assert.equal(h.errors.join(' ').includes('test-only-not-a-key'), false);
  });
}
test('text extraction ignores reasoning and malformed content', () => {
  assert.equal(outputText({ output: [{ type: 'reasoning', content: [{ type: 'output_text', text: 'ignore' }] }, null, { type: 'message', content: null }, ...fixture.output] }), 'A regression breaks previously working behavior.');
  assert.equal(outputText(null), '');
});

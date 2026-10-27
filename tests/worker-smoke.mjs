import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../gemini-worker.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const origin = 'https://terierddelhi.github.io';
let limited = false;
let lastRateKey = '';
let fetchCalls = [];
const env = {
  SITE_ORIGIN: origin,
  GEMINI_API_KEY: 'test-only',
  CHAT_RATE_LIMITER: { limit: async ({ key }) => { lastRateKey = key; return { success: !limited }; } }
};
const req = (body, extra = {}) => new Request('https://worker.test/chat', {
  method: extra.method || 'POST',
  headers: { Origin: extra.origin || origin, 'CF-Connecting-IP': '203.0.113.5', ...(extra.headers || {}) },
  body: extra.stream ? extra.stream : body,
  ...(extra.stream ? { duplex: 'half' } : {})
});
let response = await worker.fetch(req('x', { origin: 'https://attacker.test' }), env);
assert.equal(response.status, 403, 'rejects wrong Origin');
response = await worker.fetch(new Request('https://worker.test/chat', { headers: { Origin: origin } }), env);
assert.equal(response.status, 405, 'rejects GET');
limited = true;
response = await worker.fetch(req('{}'), env);
assert.equal(response.status, 429, 'enforces rate-limit binding');
assert.equal(lastRateKey, '203.0.113.5', 'keys the limiter by Cloudflare client IP');
limited = false;
const oversizedStream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(100001)); controller.close(); } });
const streamedRequest = req(undefined, { stream: oversizedStream });
assert.equal(streamedRequest.headers.get('content-length'), null, 'streamed request omits Content-Length');
response = await worker.fetch(streamedRequest, env);
assert.equal(response.status, 413, 'enforces request byte cap without Content-Length');
response = await worker.fetch(req('null', { headers: { 'Content-Type': 'application/json' } }), env);
assert.equal(response.status, 400, 'rejects non-object JSON');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const target = String(url); fetchCalls.push(target);
  if (target.endsWith('/publications-archieve/data.json')) return new Response(JSON.stringify([{ id: 'r1', title: 'Sample', url: 'https://terierddelhi.github.io/publications-archieve/sample.pdf' }]), { headers: { 'Content-Type': 'application/json' } });
  if (target.endsWith('/sample.pdf')) return new Response('%PDF-1.4\nSample document', { headers: { 'Content-Type': 'application/pdf' } });
  if (target.includes('generativelanguage.googleapis.com/v1beta/models/')) return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Mock grounded answer [1].' }] } }] }), { headers: { 'Content-Type': 'application/json' } });
  throw new Error('Unexpected outbound fetch: ' + target);
};
try {
  response = await worker.fetch(req(JSON.stringify({ question: 'Summarize', documentIds: ['r1'], history: [] })), env);
  assert.equal(response.status, 200, 'completes mock PDF-to-Gemini chat request');
  const payload = await response.json();
  assert.equal(payload.answer, 'Mock grounded answer [1].');
  assert.equal(payload.sources.length, 1);
  assert.equal(fetchCalls.length, 3, 'only metadata, PDF, and Gemini were fetched');

  fetchCalls = [];
  globalThis.fetch = async (url) => {
    const target = String(url); fetchCalls.push(target);
    if (target.endsWith('/publications-archieve/data.json')) return new Response(JSON.stringify([{ id: 'large', title: 'Large', url: 'https://terierddelhi.github.io/publications-archieve/large.pdf' }]), { headers: { 'Content-Type': 'application/json' } });
    if (target.endsWith('/large.pdf')) {
      const oversizedPdf = new ReadableStream({ start(controller) {
        for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(10 * 1024 * 1024));
        controller.enqueue(new Uint8Array(1)); controller.close();
      } });
      return new Response(oversizedPdf, { headers: { 'Content-Type': 'application/pdf' } });
    }
    throw new Error('Oversized PDF should be rejected before Gemini: ' + target);
  };
  response = await worker.fetch(req(JSON.stringify({ question: 'Summarize', documentIds: ['large'], history: [] })), env);
  assert.equal(response.status, 413, 'enforces PDF cap while streaming when Content-Length is absent');
  assert.equal(fetchCalls.length, 2, 'oversized PDF is rejected before upload or Gemini generation');
} finally { globalThis.fetch = realFetch; }
console.log('Worker smoke checks passed: origin/method validation, rate limiting, request and PDF streaming caps without Content-Length, JSON shape, and mocked end-to-end chat.');

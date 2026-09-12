import { pathToFileURL } from 'node:url';

export const ENDPOINT = 'https://infer.flow7.org/v1/responses';
export const DEFAULT_MODEL = 'infer/gpt-6-astra:low-cost';

export function outputText(response) {
  return (Array.isArray(response?.output) ? response.output : [])
    .filter(item => item?.type === 'message')
    .flatMap(item => Array.isArray(item.content) ? item.content : [])
    .filter(block => block?.type === 'output_text' && typeof block.text === 'string')
    .map(block => block.text).join('\n');
}

export async function main({
  args = process.argv.slice(2), env = process.env, transport = globalThis.fetch,
  log = console.log, error = console.error,
} = {}) {
  const key = (env.INFER_API_KEY || '').trim();
  const prompt = args.join(' ').trim();
  if (!key || !prompt) {
    error('Set INFER_API_KEY, then run: node responses.mjs "Your short prompt"');
    return 2;
  }
  let response;
  try {
    response = await transport(ENDPOINT, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model: env.INFER_MODEL || DEFAULT_MODEL, input: prompt, max_output_tokens: 1024, stream: false }),
    });
  } catch {
    error('Request failed or timed out. Check Infer usage before retrying; the service may have received it.');
    return 1;
  }
  if (!response.ok) {
    error(`Infer returned HTTP ${response.status}. Check your key, wallet credit, and current model availability.`);
    return 1;
  }
  let body;
  try { body = await response.json(); }
  catch {
    error('Infer returned an unreadable response. Check usage before retrying.');
    return 1;
  }
  const text = outputText(body);
  if (body?.status !== 'completed' || !text) {
    error('Response did not complete with text. Review status and usage in Infer before retrying.');
    return 1;
  }
  log(text);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}

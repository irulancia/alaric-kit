// Infrastructure for the design system test: a dependency-free static server for the project,
// a headless Chrome/Edge found on this machine, and a small Chrome DevTools Protocol client.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
};
const BROWSER_START_ATTEMPTS = 40;
const BROWSER_START_WAIT_MS = 250;
const DEBUG_PORT_BASE = 9300;
const DEBUG_PORT_SPAN = 500;
const PROFILE_CLEANUP_WAIT_MS = 3000;
const PROFILE_CLEANUP_RETRIES = 10;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// Serves `root` on a free local port. Files outside root are never served.
function startStaticServer(root) {
  const server = http.createServer((req, res) => {
    const requested = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, requested);
    if (!file.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}

function browserCandidates() {
  if (process.env.CHROME_PATH) return [process.env.CHROME_PATH];
  if (process.platform === 'win32') {
    const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    return roots.flatMap((r) => [`${r}/Google/Chrome/Application/chrome.exe`, `${r}/Microsoft/Edge/Application/msedge.exe`]);
  }
  if (process.platform === 'darwin') {
    return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
  }
  return ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge'].map((name) => {
    const found = spawnSync('which', [name], { encoding: 'utf8' });
    return found.status === 0 ? found.stdout.trim() : '';
  });
}

function findBrowser() {
  const found = browserCandidates().find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Edge found. Install one, or set CHROME_PATH to its executable.');
  return found;
}

async function connectToPage(port) {
  for (let i = 0; i < BROWSER_START_ATTEMPTS; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* the browser is still starting */ }
    await sleep(BROWSER_START_WAIT_MS);
  }
  throw new Error('The browser did not open its debugging port.');
}

function collectConsole(message, sink) {
  if (message.method === 'Runtime.exceptionThrown') {
    const d = message.params.exceptionDetails;
    sink.push(`EXCEPTION ${(d.exception?.description || d.text).slice(0, 200)}`);
  }
  if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
    sink.push(`${message.params.type.toUpperCase()} ${message.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 200)}`);
  }
  if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
    const e = message.params.entry;
    sink.push(`LOG ${e.level} ${e.text.slice(0, 120)} ${(e.url || '').slice(0, 80)}`);
  }
}

// Opens a headless browser and returns the CDP helpers the test steps use.
async function launchBrowser() {
  const port = DEBUG_PORT_BASE + Math.floor(Math.random() * DEBUG_PORT_SPAN);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-test-'));
  const proc = spawn(findBrowser(), ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, '--window-size=1440,900', '--hide-scrollbars', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  const ws = new WebSocket(await connectToPage(port));
  await new Promise((resolve) => { ws.onopen = resolve; });
  const pending = {};
  const consoleMessages = [];
  let nextId = 0;
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) pending[d.id](d); else collectConsole(d, consoleMessages);
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    nextId += 1;
    pending[nextId] = resolve;
    ws.send(JSON.stringify({ id: nextId, method, params }));
  });
  // Windows keeps the profile locked until the browser has fully exited, so wait, then retry the removal.
  const close = async () => {
    ws.close();
    const exited = new Promise((resolve) => { proc.once('exit', resolve); });
    proc.kill();
    await Promise.race([exited, sleep(PROFILE_CLEANUP_WAIT_MS)]);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: PROFILE_CLEANUP_RETRIES, retryDelay: BROWSER_START_WAIT_MS });
    } catch (e) {
      console.warn(`Could not remove the temporary browser profile ${profile}: ${e.message}`);
    }
  };
  return { send, close, consoleMessages };
}

module.exports = { startStaticServer, launchBrowser, sleep };

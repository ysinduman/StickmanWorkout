/**
 * StickmanWorkout Android build watcher.
 * Every 5 minutes, tries to build and install the app.
 * If a Gradle/React Native build is already running, it logs
 * "build already running" and does not start another one.
 */
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(ROOT, 'build-watch.log');
const PID_PATH = path.join(__dirname, 'build-watch.pid');
const INTERVAL_MS = 5 * 60 * 1000;
const PREFERRED_PORT = '8082';
const OUTPUT_TAIL = 16000;

let busy = false;
let child = null;

function stamp() {
  return new Date().toISOString();
}

function log(message) {
  const line = `[${stamp()}] ${message}`;
  fs.appendFileSync(LOG_PATH, `${line}\n`, 'utf8');
  console.log(line);
}

function isBuildRunning() {
  const script = [
    "$hit = Get-CimInstance Win32_Process | Where-Object {",
    '  $c = $_.CommandLine',
    '  if (-not $c) { return $false }',
    "  return ($c -match 'gradlew(\\.bat)?' -or $c -match 'GradleWrapperMain' -or $c -match 'installDebug' -or $c -match 'run-android')",
    '}',
    "if ($hit) { 'YES' } else { 'NO' }",
  ].join('; ');

  const out = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', script],
    { encoding: 'utf8', timeout: 40000, windowsHide: true },
  );
  return out.includes('YES');
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: Number(port), host: '127.0.0.1' });
    let settled = false;
    const finish = (used) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(used);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    setTimeout(() => finish(false), 1500);
  });
}

function tail(text) {
  if (text.length <= OUTPUT_TAIL) {
    return text;
  }
  return text.slice(text.length - OUTPUT_TAIL);
}

function runBuild(useNoPackager) {
  const args = [
    path.join('node_modules', 'react-native', 'cli.js'),
    'run-android',
    '--port',
    PREFERRED_PORT,
  ];
  if (useNoPackager) {
    args.push('--no-packager');
  }

  log(
    `starting build: node ${args.join(' ')} (8081 busy -> prefer port ${PREFERRED_PORT})`,
  );

  return new Promise((resolve) => {
    const chunks = [];
    child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, CI: 'true' },
      windowsHide: true,
    });

    const capture = (buf) => {
      const text = buf.toString('utf8');
      chunks.push(text);
      process.stdout.write(text);
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('error', (err) => {
      chunks.push(`\nspawn error: ${err.stack || err.message}\n`);
      child = null;
      resolve({ code: 1, output: chunks.join('') });
    });
    child.on('close', (code) => {
      child = null;
      resolve({ code: code == null ? 1 : code, output: chunks.join('') });
    });
  });
}

async function tick() {
  if (busy || child) {
    log('build already running');
    return;
  }

  let running = false;
  try {
    running = isBuildRunning();
  } catch (err) {
    log(
      `build detection failed; skipped to avoid a parallel Gradle build: ${err.message}`,
    );
    return;
  }

  if (running) {
    log('build already running');
    return;
  }

  busy = true;
  try {
    const metroBusy = await portInUse(PREFERRED_PORT);
    const result = await runBuild(metroBusy);
    const failed =
      result.code !== 0 ||
      /BUILD FAILED/.test(result.output) ||
      /Use port \d+ instead/.test(result.output);
    const body = tail(result.output).trim();
    if (failed) {
      log(`STATUS: failure exit_code=${result.code}`);
      if (body) {
        log(body);
      }
    } else {
      log(`STATUS: success exit_code=${result.code}`);
      if (body) {
        log(body);
      }
    }
  } catch (err) {
    log(`STATUS: failure exit_code=1`);
    log(err.stack || err.message);
  } finally {
    busy = false;
  }
}

fs.writeFileSync(PID_PATH, String(process.pid), 'utf8');
log(`watcher started pid=${process.pid} interval=5m log=${LOG_PATH}`);
tick();
setInterval(tick, INTERVAL_MS);

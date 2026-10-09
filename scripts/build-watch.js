/**
 * StickmanWorkout Android build watcher.
 * Every 5 minutes, tries to build and install the app.
 * If a Gradle/React Native build is already running, it logs
 * "build already running" and does not start another one.
 */
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(ROOT, 'build-watch.log');
const PID_PATH = path.join(__dirname, 'build-watch.pid');
const INTERVAL_MS = 5 * 60 * 1000;
const PREFERRED_PORT = '8082';
const OUTPUT_TAIL = 16000;
// The Cursor sandbox sets GRADLE_USER_HOME under Temp\cursor-sandbox-cache.
// That prefix pushes Hermes prefab paths past Windows' 260-character limit
// and ninja fails with "Filename longer than 260 characters".
const GRADLE_USER_HOME = path.join(os.homedir(), '.gradle');

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
  const detector = path.join(__dirname, 'detect-android-build.ps1');
  const out = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-File', detector],
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
    `starting build: node ${args.join(' ')} (8081 busy -> prefer port ${PREFERRED_PORT}; GRADLE_USER_HOME=${GRADLE_USER_HOME})`,
  );

  return new Promise((resolve) => {
    const chunks = [];
    child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, CI: 'true', GRADLE_USER_HOME },
      windowsHide: true,
    });

    let settleTimer = null;
    const capture = (buf) => {
      const text = buf.toString('utf8');
      chunks.push(text);
      process.stdout.write(text);
      const output = chunks.join('');
      if (
        !settleTimer &&
        /BUILD SUCCESSFUL/.test(output) &&
        /Starting: Intent/.test(output)
      ) {
        settleTimer = setTimeout(() => {
          if (child) {
            log('build process stayed open after install; stopping it');
            child.kill();
          }
        }, 15000);
      }
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('error', (err) => {
      if (settleTimer) clearTimeout(settleTimer);
      chunks.push(`\nspawn error: ${err.stack || err.message}\n`);
      child = null;
      resolve({ code: 1, output: chunks.join('') });
    });
    child.on('close', (code) => {
      if (settleTimer) clearTimeout(settleTimer);
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

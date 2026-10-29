const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let passCount = 0;
let failCount = 0;

function check(label, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${label} - ${details}`);
    failCount++;
  }
}

console.log('--- GOOGLE PLAY STORE RELEASE READINESS AUDIT ---');

// 1. Android Manifest
const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  check('Manifest: Camera hardware optional', manifest.includes('android:name="android.hardware.camera" android:required="false"'));
  check('Manifest: Camera autofocus optional', manifest.includes('android:name="android.hardware.camera.autofocus" android:required="false"'));
  check('Manifest: Main Activity exported', manifest.includes('android:exported="true"'));
  check('Manifest: Launcher intent filter', manifest.includes('android.intent.category.LAUNCHER'));
  check('Manifest: Camera permission present', manifest.includes('android.permission.CAMERA'));
  check('Manifest: Vibrate permission present', manifest.includes('android.permission.VIBRATE'));
  check('Manifest: AllowBackup is disabled', manifest.includes('android:allowBackup="false"'));
} else {
  check('Manifest file exists', false, 'AndroidManifest.xml not found');
}

// 2. Android App Gradle
const appGradlePath = path.join(rootDir, 'android/app/build.gradle');
const rootGradlePath = path.join(rootDir, 'android/build.gradle');
if (fs.existsSync(appGradlePath) && fs.existsSync(rootGradlePath)) {
  const rootGradle = fs.readFileSync(rootGradlePath, 'utf8');
  const appGradle = fs.readFileSync(appGradlePath, 'utf8');
  
  const targetSdkMatch = rootGradle.match(/targetSdkVersion\s*=\s*(\d+)/);
  const targetSdk = targetSdkMatch ? parseInt(targetSdkMatch[1], 10) : 0;
  check('Gradle: Target SDK >= 34 (Google Play API requirement)', targetSdk >= 34, `Found targetSdk ${targetSdk}`);

  check('Gradle: VersionName is SemVer (1.0.0)', appGradle.includes('versionName "1.0.0"'));
  check('Gradle: ApplicationId is com.stickmanworkout', appGradle.includes('applicationId "com.stickmanworkout"'));
} else {
  check('Gradle files exist', false, 'build.gradle not found');
}

// 3. ProGuard Keep Rules
const proguardPath = path.join(rootDir, 'android/app/proguard-rules.pro');
if (fs.existsSync(proguardPath)) {
  const proguard = fs.readFileSync(proguardPath, 'utf8');
  check('ProGuard: VectorIcons keep rule', proguard.includes('-keep class com.oblador.vectoricons.**'));
  check('ProGuard: React Native keep rule', proguard.includes('-keep class com.facebook.react.**'));
} else {
  check('ProGuard file exists', false, 'proguard-rules.pro not found');
}

// 4. App Name & Localizations
const stringsPath = path.join(rootDir, 'android/app/src/main/res/values/strings.xml');
if (fs.existsSync(stringsPath)) {
  const strings = fs.readFileSync(stringsPath, 'utf8');
  check('Strings: App name is Stickman Tycoon Workout', strings.includes('<string name="app_name">Stickman Tycoon Workout</string>'));
}

const trJsonPath = path.join(rootDir, 'src/i18n/tr.json');
const enJsonPath = path.join(rootDir, 'src/i18n/en.json');
if (fs.existsSync(trJsonPath) && fs.existsSync(enJsonPath)) {
  const tr = JSON.parse(fs.readFileSync(trJsonPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));
  check('i18n: TR appName is Stickman Tycoon Workout', tr.common?.appName === 'Stickman Tycoon Workout');
  check('i18n: EN appName is Stickman Tycoon Workout', en.common?.appName === 'Stickman Tycoon Workout');
}

// 5. Store Screenshots
const screenshotsDir = path.join(rootDir, 'screenshots');
const requiredScreens = ['01_home.png', '02_search.png', '03_planner.png', '04_profile.png'];
for (const screen of requiredScreens) {
  const sPath = path.join(screenshotsDir, screen);
  const exists = fs.existsSync(sPath);
  const size = exists ? fs.statSync(sPath).size : 0;
  check(`Screenshots: ${screen} is present (> 20KB)`, exists && size > 20000, `Size: ${size} bytes`);
}

// 6. Security: No committed .env
const envPath = path.join(rootDir, '.env');
const gitignorePath = path.join(rootDir, '.gitignore');
const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
check('Security: .env ignored in .gitignore', gitignore.includes('.env'));

console.log('--------------------------------------------------');
if (failCount === 0) {
  console.log(`AUDIT SUCCESSFUL: All ${passCount} Play Store readiness checks passed!`);
  process.exit(0);
} else {
  console.error(`AUDIT FAILED: ${failCount} issues need resolution.`);
  process.exit(1);
}

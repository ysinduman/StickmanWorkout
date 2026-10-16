/**
 * Unified HTML/JS Computer Vision Engine for Calisthenics:
 * - Push-Up (Şınav): Elbow angle (Shoulder - Elbow - Wrist)
 * - Squat (Çömelme): Knee angle (Hip - Knee - Ankle)
 * - Crunches (Mekik): Torso contraction angle (Shoulder - Hip - Knee)
 * - Plank: Posture alignment (Shoulder - Hip - Ankle) + Real-time countdown
 */

export function getPushUpVisionHtml(options: {
  exerciseId?: string; // 'push_up' | 'squat' | 'crunches' | 'plank'
  targetReps?: number;
  targetTimeSeconds?: number;
  initialSoundEnabled?: boolean;
  language?: string;
}): string {
  const exId = options.exerciseId || 'push_up';
  const isTimeBased = exId === 'plank';
  const target = isTimeBased ? (options.targetTimeSeconds || 45) : (options.targetReps || 15);
  const soundEnabled = options.initialSoundEnabled ?? true;
  const lang = options.language || 'tr';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Stickman AI Calisthenics Tracker</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0A0A0F;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #F0F0F5;
    }
    #viewport-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #0A0A0F;
    }
    video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      z-index: 1;
    }
    video.unmirrored {
      transform: scaleX(1);
    }
    canvas#overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
    }
    /* HUD Overlays */
    .hud-header {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .hud-pill {
      background: rgba(18, 18, 26, 0.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 107, 53, 0.35);
      border-radius: 9999px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #F0F0F5;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .hud-pill .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ADE80;
      box-shadow: 0 0 8px #4ADE80;
    }
    .hud-pill .dot.calibrating {
      background: #FBBF24;
      box-shadow: 0 0 8px #FBBF24;
      animation: pulse 1s infinite;
    }
    .hud-controls {
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(18, 18, 26, 0.82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #F0F0F5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .icon-btn:active {
      transform: scale(0.92);
      background: rgba(255, 107, 53, 0.3);
    }

    /* Counter Display */
    .rep-display {
      position: absolute;
      top: 68px;
      left: 16px;
      z-index: 10;
      display: flex;
      flex-direction: column;
    }
    .rep-number {
      font-size: 54px;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #FF6B35 0%, #FF9F1C 50%, #FFD166 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 24px rgba(255, 107, 53, 0.4);
      font-variant-numeric: tabular-nums;
    }
    .rep-sublabel {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(240, 240, 245, 0.7);
      margin-top: 2px;
    }

    /* Feedback Banner */
    .feedback-banner {
      position: absolute;
      bottom: 24px;
      left: 16px;
      right: 16px;
      z-index: 10;
      background: rgba(18, 18, 26, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 107, 53, 0.4);
      border-radius: 16px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }
    .feedback-content {
      display: flex;
      flex-direction: column;
    }
    .feedback-text {
      font-size: 16px;
      font-weight: 700;
      color: #FF6B35;
    }
    .feedback-state {
      font-size: 12px;
      color: #A0A0B8;
      margin-top: 2px;
    }

    /* Depth Gauge */
    .depth-gauge {
      position: absolute;
      right: 16px;
      top: 130px;
      bottom: 120px;
      width: 20px;
      background: rgba(18, 18, 26, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
      flex-direction: column-reverse;
      z-index: 10;
    }
    .depth-fill {
      width: 100%;
      height: 0%;
      background: linear-gradient(to top, #4ADE80, #FF9F1C, #FF6B35);
      border-radius: 9999px;
      transition: height 0.08s ease-out;
      box-shadow: 0 0 12px rgba(255, 107, 53, 0.6);
    }
    .depth-target-line {
      position: absolute;
      top: 30%;
      left: 0;
      right: 0;
      height: 2px;
      background: #4ADE80;
      box-shadow: 0 0 6px #4ADE80;
      z-index: 11;
    }

    /* Prompt Splash */
    #prompt-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 15, 0.88);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      z-index: 100;
      transition: opacity 0.3s ease;
    }
    .stickman-guide-icon {
      font-size: 52px;
      margin-bottom: 16px;
      animation: bounce 1.8s infinite;
    }
    .prompt-title {
      font-size: 22px;
      font-weight: 700;
      color: #F0F0F5;
      margin-bottom: 8px;
    }
    .prompt-desc {
      font-size: 14px;
      color: #A0A0B8;
      max-width: 290px;
      line-height: 1.5;
    }

    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  </style>

  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="viewport-container">
    <video id="webcam" playsinline autoplay muted></video>
    <canvas id="overlay"></canvas>

    <div class="hud-header">
      <div class="hud-pill" id="status-pill">
        <span class="dot calibrating" id="status-dot"></span>
        <span id="status-text">${lang === 'tr' ? 'Kamera Başlatılıyor...' : 'Starting Camera...'}</span>
      </div>
      <div class="hud-controls">
        <button class="icon-btn" id="flip-btn" title="Kamerayı Çevir">🔄</button>
        <button class="icon-btn" id="sound-btn" title="Ses Aç/Kapat">🔊</button>
      </div>
    </div>

    <div class="rep-display">
      <div class="rep-number" id="rep-count">${isTimeBased ? target : '0'}</div>
      <div class="rep-sublabel" id="rep-target">${isTimeBased ? (lang === 'tr' ? `HEDEF: ${target} SN` : `TARGET: ${target}S`) : (lang === 'tr' ? `HEDEF: ${target}` : `TARGET: ${target}`)}</div>
    </div>

    <div class="depth-gauge">
      <div class="depth-target-line"></div>
      <div class="depth-fill" id="depth-fill"></div>
    </div>

    <div class="feedback-banner">
      <div class="feedback-content">
        <div class="feedback-text" id="feedback-text">${lang === 'tr' ? 'Pozisyon Alın' : 'Get into Position'}</div>
        <div class="feedback-state" id="feedback-state">${lang === 'tr' ? 'Kamera karşısında pozisyon alın' : 'Assume position in camera view'}</div>
      </div>
    </div>

    <div id="prompt-overlay">
      <div class="stickman-guide-icon" id="guide-icon">🏋️‍♂️</div>
      <div class="prompt-title" id="guide-title">${lang === 'tr' ? 'AI Calisthenics Takibi' : 'AI Calisthenics Tracker'}</div>
      <div class="prompt-desc" id="guide-desc">${lang === 'tr' ? 'Telefonunuzu sabit bir yere koyun ve kamera karşısında pozisyon alın.' : 'Prop your phone and assume position in front of the camera.'}</div>
    </div>
  </div>

  <script>
    (function() {
      var isTr = '${lang}' === 'tr';
      var exerciseId = '${exId}'; // 'push_up', 'squat', 'crunches', 'plank'
      var isTimeExercise = ${isTimeBased ? 'true' : 'false'};
      var targetGoal = ${target};
      var soundEnabled = ${soundEnabled};
      var facingMode = 'user';
      var repCount = 0;
      var plankTimeRemaining = targetGoal;
      var currentStage = 'UP'; // 'UP', 'DOWN', 'BOTTOM'
      var lastRepTime = 0;
      var lastPlankTick = Date.now();
      var mediaPipeReady = false;
      var cameraStarted = false;

      // Exercise Specific Guidance Titles & Icons
      var guideInfo = {
        push_up: {
          icon: '🏋️‍♂️',
          title: isTr ? 'AI Şınav Takibi' : 'AI Push-Up Tracker',
          desc: isTr ? 'Telefonu yere yaslayın ve şınav pozisyonu alın. Dirsekleriniz 90° büküldüğünde şınav otomatik sayılır.' : 'Assume push-up position. When elbows bend to 90°, reps count automatically.'
        },
        squat: {
          icon: '🦵',
          title: isTr ? 'AI Squat Takibi' : 'AI Squat Tracker',
          desc: isTr ? 'Telefonu karşıya koyun ve ayakta durun. Çömeldiğinizde diz açınız takip edilerek tekrarınız sayılır.' : 'Stand in camera view. As you squat down, knee angles are tracked and reps are counted.'
        },
        crunches: {
          icon: '🧘‍♂️',
          title: isTr ? 'AI Mekik Takibi' : 'AI Crunch Tracker',
          desc: isTr ? 'Yere yatın ve dizlerinizi bükün. Gövdenizi yukarı kaldırdığınızda mekik sayılır.' : 'Lie on your back with knees bent. Crunching your torso upwards counts your reps.'
        },
        plank: {
          icon: '⏱️',
          title: isTr ? 'AI Plank Takibi' : 'AI Plank Timer & Form',
          desc: isTr ? 'Düz bir plank pozisyonu alın. Vücudunuz düz durduğu sürece sayaç ilerler.' : 'Hold a straight plank position. The timer counts down while your posture is aligned.'
        }
      };

      var activeGuide = guideInfo[exerciseId] || guideInfo.push_up;
      document.getElementById('guide-icon').textContent = activeGuide.icon;
      document.getElementById('guide-title').textContent = activeGuide.title;
      document.getElementById('guide-desc').textContent = activeGuide.desc;

      // Audio synthesizer
      var audioCtx = null;
      function getAudioContext() {
        if (!audioCtx) {
          try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          } catch(e) {}
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        return audioCtx;
      }

      function playTone(freq, duration, type) {
        if (!soundEnabled) return;
        try {
          var ctx = getAudioContext();
          if (!ctx) return;
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = type || 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        } catch(e) {}
      }

      function speak(text) {
        if (!soundEnabled || !window.speechSynthesis) return;
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.lang = isTr ? 'tr-TR' : 'en-US';
          u.rate = 1.1;
          window.speechSynthesis.speak(u);
        } catch(e) {}
      }

      function sendToNative(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      // UI Elements
      var video = document.getElementById('webcam');
      var canvas = document.getElementById('overlay');
      var ctx = canvas.getContext('2d');
      var repCountEl = document.getElementById('rep-count');
      var depthFillEl = document.getElementById('depth-fill');
      var feedbackTextEl = document.getElementById('feedback-text');
      var feedbackStateEl = document.getElementById('feedback-state');
      var statusDot = document.getElementById('status-dot');
      var statusText = document.getElementById('status-text');
      var promptOverlay = document.getElementById('prompt-overlay');
      var flipBtn = document.getElementById('flip-btn');
      var soundBtn = document.getElementById('sound-btn');

      function updateSoundBtn() {
        soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
      }
      updateSoundBtn();

      soundBtn.addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        updateSoundBtn();
        sendToNative({ type: 'SOUND_TOGGLE', enabled: soundEnabled });
      });

      flipBtn.addEventListener('click', function() {
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        if (facingMode === 'user') {
          video.classList.remove('unmirrored');
        } else {
          video.classList.add('unmirrored');
        }
        initCamera();
      });

      // Calculate angle between three 2D points (A, B, C) where B is vertex
      function calculateAngle(a, b, c) {
        var radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        var angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
          angle = 360.0 - angle;
        }
        return angle;
      }

      // Kinematics router according to exercise
      function processKinematics(data) {
        var now = Date.now();

        // 1. PUSH-UP
        if (exerciseId === 'push_up') {
          var elbowAngle = data.elbowAngle || 180;
          var depth = Math.min(100, Math.max(0, Math.round(((160 - elbowAngle) / (160 - 85)) * 100)));
          depthFillEl.style.height = depth + '%';

          if (elbowAngle > 145) {
            if (currentStage === 'BOTTOM') {
              if (now - lastRepTime > 800) {
                repCount++;
                lastRepTime = now;
                repCountEl.textContent = repCount;
                playTone(587, 0.15, 'triangle');
                setTimeout(function() { playTone(880, 0.25, 'triangle'); }, 120);
                speak(String(repCount));

                feedbackTextEl.textContent = isTr ? 'Harika Şınav! 🔥' : 'Awesome Push-Up! 🔥';
                feedbackStateEl.textContent = isTr ? (repCount + '. tekrar sayıldı') : ('Rep ' + repCount + ' counted');

                sendToNative({
                  type: 'REP_COUNTED',
                  count: repCount,
                  target: targetGoal,
                  isComplete: repCount >= targetGoal
                });
              }
            }
            currentStage = 'UP';
            feedbackTextEl.textContent = isTr ? 'Hazır / Yukarıda' : 'Ready / Up';
            feedbackStateEl.textContent = isTr ? 'Aşağı inmeye başlayın' : 'Start lowering down';
          } else if (elbowAngle < 95) {
            if (currentStage !== 'BOTTOM') {
              currentStage = 'BOTTOM';
              playTone(320, 0.08, 'sine');
              feedbackTextEl.textContent = isTr ? 'Güzel! Şimdi İt! 💪' : 'Good! Push Up! 💪';
              feedbackStateEl.textContent = isTr ? 'Tam derinlik sağlandı' : 'Full depth reached';
            }
          }
        }

        // 2. SQUAT
        else if (exerciseId === 'squat') {
          var kneeAngle = data.kneeAngle || 180;
          var sDepth = Math.min(100, Math.max(0, Math.round(((165 - kneeAngle) / (165 - 95)) * 100)));
          depthFillEl.style.height = sDepth + '%';

          if (kneeAngle > 155) {
            if (currentStage === 'BOTTOM') {
              if (now - lastRepTime > 800) {
                repCount++;
                lastRepTime = now;
                repCountEl.textContent = repCount;
                playTone(520, 0.15, 'triangle');
                setTimeout(function() { playTone(784, 0.25, 'triangle'); }, 120);
                speak(String(repCount));

                feedbackTextEl.textContent = isTr ? 'Mükemmel Squat! 🦵' : 'Great Squat! 🦵';
                feedbackStateEl.textContent = isTr ? (repCount + '. squat sayıldı') : ('Squat ' + repCount + ' counted');

                sendToNative({
                  type: 'REP_COUNTED',
                  count: repCount,
                  target: targetGoal,
                  isComplete: repCount >= targetGoal
                });
              }
            }
            currentStage = 'UP';
            feedbackTextEl.textContent = isTr ? 'Ayakta / Hazır' : 'Standing / Ready';
            feedbackStateEl.textContent = isTr ? 'Çömelmeye başlayın' : 'Begin squatting down';
          } else if (kneeAngle < 100) {
            if (currentStage !== 'BOTTOM') {
              currentStage = 'BOTTOM';
              playTone(280, 0.08, 'sine');
              feedbackTextEl.textContent = isTr ? 'Harika Derinlik! Doğrul! ⚡' : 'Great Depth! Stand Up! ⚡';
              feedbackStateEl.textContent = isTr ? 'Dizler 90° büküldü' : 'Knees bent 90°';
            }
          }
        }

        // 3. CRUNCHES (MEKİK)
        else if (exerciseId === 'crunches') {
          var torsoAngle = data.torsoAngle || 140;
          var cDepth = Math.min(100, Math.max(0, Math.round(((135 - torsoAngle) / (135 - 80)) * 100)));
          depthFillEl.style.height = cDepth + '%';

          if (torsoAngle > 120) {
            if (currentStage === 'BOTTOM') {
              if (now - lastRepTime > 800) {
                repCount++;
                lastRepTime = now;
                repCountEl.textContent = repCount;
                playTone(550, 0.15, 'triangle');
                setTimeout(function() { playTone(820, 0.25, 'triangle'); }, 120);
                speak(String(repCount));

                feedbackTextEl.textContent = isTr ? 'Harika Mekik! 🔥' : 'Great Crunch! 🔥';
                feedbackStateEl.textContent = isTr ? (repCount + '. mekik sayıldı') : ('Crunch ' + repCount + ' counted');

                sendToNative({
                  type: 'REP_COUNTED',
                  count: repCount,
                  target: targetGoal,
                  isComplete: repCount >= targetGoal
                });
              }
            }
            currentStage = 'UP';
            feedbackTextEl.textContent = isTr ? 'Geriye Yat / Hazır' : 'Lie Back / Ready';
            feedbackStateEl.textContent = isTr ? 'Gövdeni yukarı kaldır' : 'Lift torso up';
          } else if (torsoAngle < 88) {
            if (currentStage !== 'BOTTOM') {
              currentStage = 'BOTTOM';
              playTone(340, 0.08, 'sine');
              feedbackTextEl.textContent = isTr ? 'Karını Sık! Şimdi İn! 💪' : 'Squeeze Abs! Now Lower! 💪';
              feedbackStateEl.textContent = isTr ? 'Tam kasılma sağlandı' : 'Peak contraction reached';
            }
          }
        }

        // 4. PLANK
        else if (exerciseId === 'plank') {
          var spineAngle = data.spineAngle || 170;
          var isGoodForm = spineAngle >= 150 && spineAngle <= 185;

          if (isGoodForm) {
            depthFillEl.style.height = '100%';
            feedbackTextEl.textContent = isTr ? 'Harika Duruş! Devam! 🔥' : 'Perfect Posture! Keep Going! 🔥';
            feedbackStateEl.textContent = isTr ? 'Vücudun düz bir çizgi halinde' : 'Straight body line maintained';

            if (now - lastPlankTick >= 1000 && plankTimeRemaining > 0) {
              lastPlankTick = now;
              plankTimeRemaining--;
              repCountEl.textContent = plankTimeRemaining + 's';

              if (plankTimeRemaining % 10 === 0 && plankTimeRemaining > 0) {
                playTone(440, 0.1, 'sine');
              }

              if (plankTimeRemaining === 0) {
                playTone(659, 0.2, 'triangle');
                setTimeout(function() { playTone(880, 0.4, 'triangle'); }, 150);
                speak(isTr ? 'Süre Doldu! Harika iş!' : 'Time Up! Great job!');

                sendToNative({
                  type: 'REP_COUNTED',
                  count: targetGoal,
                  target: targetGoal,
                  isComplete: true
                });
              }
            }
          } else {
            depthFillEl.style.height = '35%';
            feedbackTextEl.textContent = isTr ? 'Vücudunu Düz Tut! 📏' : 'Keep Body Straight! 📏';
            feedbackStateEl.textContent = isTr ? 'Kalçanı düşürme veya çok kaldırma' : 'Do not sag or pike hips';
          }
        }
      }

      // Draw Stickman skeleton on overlay
      function drawSkeleton(landmarks, activeAngle, activePoint) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!landmarks || landmarks.length === 0) return;

        var w = canvas.width;
        var h = canvas.height;

        var connections = [
          [11, 12],
          [11, 13], [13, 15],
          [12, 14], [14, 16],
          [11, 23], [12, 24],
          [23, 24],
          [23, 25], [25, 27],
          [24, 26], [26, 28]
        ];

        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }

        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 10;

        for (var i = 0; i < connections.length; i++) {
          var p1 = landmarks[connections[i][0]];
          var p2 = landmarks[connections[i][1]];
          if (p1 && p2 && (p1.visibility || 1) > 0.4 && (p2.visibility || 1) > 0.4) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }
        }

        for (var j = 11; j <= 28; j++) {
          var p = landmarks[j];
          if (p && (p.visibility || 1) > 0.4) {
            ctx.fillStyle = '#4ADE80';
            ctx.shadowColor = '#4ADE80';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        if (activePoint && activeAngle) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px sans-serif';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          var angleText = Math.round(activeAngle) + '°';
          ctx.fillText(angleText, activePoint.x * w + 12, activePoint.y * h - 10);
        }

        ctx.restore();
      }

      // MediaPipe Pose Handler
      var pose = null;
      try {
        if (window.Pose) {
          pose = new Pose({
            locateFile: function(file) {
              return 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file;
            }
          });
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          pose.onResults(function(results) {
            if (!results.poseLandmarks) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              return;
            }

            if (!mediaPipeReady) {
              mediaPipeReady = true;
              statusDot.classList.remove('calibrating');
              statusText.textContent = isTr ? 'AI Takip Aktif' : 'AI Tracking Active';
              if (promptOverlay) {
                promptOverlay.style.opacity = '0';
                setTimeout(function() { promptOverlay.style.display = 'none'; }, 300);
              }
            }

            var lm = results.poseLandmarks;
            var lConfArm = ((lm[11].visibility || 0) + (lm[13].visibility || 0) + (lm[15].visibility || 0)) / 3;
            var rConfArm = ((lm[12].visibility || 0) + (lm[14].visibility || 0) + (lm[16].visibility || 0)) / 3;
            var lConfLeg = ((lm[23].visibility || 0) + (lm[25].visibility || 0) + (lm[27].visibility || 0)) / 3;
            var rConfLeg = ((lm[24].visibility || 0) + (lm[26].visibility || 0) + (lm[28].visibility || 0)) / 3;

            var elbowAngle = (lConfArm >= rConfArm) ? calculateAngle(lm[11], lm[13], lm[15]) : calculateAngle(lm[12], lm[14], lm[16]);
            var kneeAngle = (lConfLeg >= rConfLeg) ? calculateAngle(lm[23], lm[25], lm[27]) : calculateAngle(lm[24], lm[26], lm[28]);
            var torsoAngle = (lConfArm >= rConfArm) ? calculateAngle(lm[11], lm[23], lm[25]) : calculateAngle(lm[12], lm[24], lm[26]);
            var spineAngle = (lConfArm >= rConfArm) ? calculateAngle(lm[11], lm[23], lm[27]) : calculateAngle(lm[12], lm[24], lm[28]);

            var activePoint = null;
            var activeAngle = null;

            if (exerciseId === 'push_up') {
              activePoint = lConfArm >= rConfArm ? lm[13] : lm[14];
              activeAngle = elbowAngle;
            } else if (exerciseId === 'squat') {
              activePoint = lConfLeg >= rConfLeg ? lm[25] : lm[26];
              activeAngle = kneeAngle;
            } else if (exerciseId === 'crunches') {
              activePoint = lConfArm >= rConfArm ? lm[23] : lm[24];
              activeAngle = torsoAngle;
            } else if (exerciseId === 'plank') {
              activePoint = lConfArm >= rConfArm ? lm[23] : lm[24];
              activeAngle = spineAngle;
            }

            processKinematics({
              elbowAngle: elbowAngle,
              kneeAngle: kneeAngle,
              torsoAngle: torsoAngle,
              spineAngle: spineAngle
            });

            drawSkeleton(lm, activeAngle, activePoint);
          });
        }
      } catch(e) {
        console.warn('Pose init error:', e);
      }

      // Optical Motion Fallback
      var prevFrame = null;
      var diffCanvas = document.createElement('canvas');
      diffCanvas.width = 120;
      diffCanvas.height = 90;
      var diffCtx = diffCanvas.getContext('2d');
      var opticalBaselineY = null;

      function processOpticalMotionFallback() {
        if (mediaPipeReady) return;
        if (video.readyState >= 2) {
          diffCtx.drawImage(video, 0, 0, 120, 90);
          var currentData = diffCtx.getImageData(0, 0, 120, 90);

          if (prevFrame) {
            var diffSum = 0;
            var weightedY = 0;
            var len = currentData.data.length;

            for (var i = 0; i < len; i += 8) {
              var d = Math.abs(currentData.data[i] - prevFrame.data[i]);
              if (d > 22) {
                var pixelIdx = i / 4;
                var py = Math.floor(pixelIdx / 120);
                weightedY += py * d;
                diffSum += d;
              }
            }

            if (diffSum > 1000) {
              var avgY = weightedY / diffSum;
              if (opticalBaselineY === null) {
                opticalBaselineY = avgY;
                statusDot.classList.remove('calibrating');
                statusText.textContent = isTr ? 'Hareket Takip Aktif' : 'Motion Tracking Active';
                if (promptOverlay) {
                  promptOverlay.style.opacity = '0';
                  setTimeout(function() { promptOverlay.style.display = 'none'; }, 300);
                }
              }

              var delta = avgY - opticalBaselineY;
              var pseudoAngle = Math.max(80, Math.min(170, 160 - (delta * 3.5)));
              processKinematics({
                elbowAngle: pseudoAngle,
                kneeAngle: pseudoAngle,
                torsoAngle: pseudoAngle,
                spineAngle: 170
              });

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = '#4ADE80';
              ctx.lineWidth = 3;
              ctx.strokeRect(canvas.width * 0.25, (avgY / 90) * canvas.height - 20, canvas.width * 0.5, 40);
            }
          }
          prevFrame = currentData;
        }
      }

      async function onFrame() {
        if (!cameraStarted) return;
        if (video.readyState >= 2) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          if (pose && window.Pose) {
            try {
              await pose.send({ image: video });
            } catch(e) {
              processOpticalMotionFallback();
            }
          } else {
            processOpticalMotionFallback();
          }
        }
        requestAnimationFrame(onFrame);
      }

      function initCamera() {
        if (window.stream) {
          window.stream.getTracks().forEach(function(track) { track.stop(); });
        }

        var constraints = {
          audio: false,
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };

        statusText.textContent = isTr ? 'Kamera Açılıyor...' : 'Starting Camera...';

        navigator.mediaDevices.getUserMedia(constraints)
          .then(function(stream) {
            window.stream = stream;
            video.srcObject = stream;
            cameraStarted = true;
            statusText.textContent = isTr ? 'Hazırlanıyor...' : 'Calibrating...';
            sendToNative({ type: 'CAMERA_READY' });
            requestAnimationFrame(onFrame);
          })
          .catch(function(err) {
            console.error('Camera error:', err);
            statusText.textContent = isTr ? 'Kamera İzni Gerekli' : 'Camera Error';
            feedbackTextEl.textContent = isTr ? 'Kamera Açılamadı' : 'Camera Inaccessible';
            feedbackStateEl.textContent = err.message || 'Lütfen kamera iznini kontrol edin';
            sendToNative({ type: 'CAMERA_ERROR', error: err.message });
          });
      }

      window.addEventListener('message', function(event) {
        try {
          var msg = JSON.parse(event.data);
          if (msg.type === 'RESET') {
            repCount = 0;
            plankTimeRemaining = targetGoal;
            repCountEl.textContent = isTimeExercise ? (targetGoal + 's') : '0';
            currentStage = 'UP';
          } else if (msg.type === 'FLIP_CAMERA') {
            flipBtn.click();
          } else if (msg.type === 'SET_SOUND') {
            soundEnabled = !!msg.enabled;
            updateSoundBtn();
          }
        } catch(e) {}
      });

      window.addEventListener('DOMContentLoaded', function() {
        initCamera();
      });
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initCamera();
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Self-contained HTML/JS engine for real-time Computer Vision Push-Up Tracking.
 * Runs inside React Native WebView.
 *
 * Features:
 * 1. WebRTC camera feed with front/back camera support.
 * 2. MediaPipe Pose landmark detection (elbow angle, depth, body alignment).
 * 3. High-performance offline Optical Motion fallback tracker.
 * 4. State machine: UP -> DOWN (elbow <= 90°) -> UP (elbow >= 150°) -> REP COUNTED.
 * 5. Web Audio API synthesized sound effects & speech synthesis voice counter.
 * 6. Futuristic Stickman Neon HUD overlay (matches app's flame theme).
 */

export function getPushUpVisionHtml(options: {
  targetReps?: number;
  initialSoundEnabled?: boolean;
  language?: string;
}): string {
  const target = options.targetReps || 15;
  const soundEnabled = options.initialSoundEnabled ?? true;
  const lang = options.language || 'tr';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Stickman AI Push-Up Vision Tracker</title>
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
      transform: scaleX(-1); /* Mirrored for front camera by default */
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
      background: rgba(18, 18, 26, 0.78);
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
      background: rgba(18, 18, 26, 0.78);
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

    /* Big Center Counter */
    .rep-display {
      position: absolute;
      top: 68px;
      left: 16px;
      z-index: 10;
      display: flex;
      flex-direction: column;
    }
    .rep-number {
      font-size: 56px;
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

    /* Form Feedback Banner */
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

    /* Vertical Depth Bar (Right side) */
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
      top: 30%; /* Target 70%+ depth */
      left: 0;
      right: 0;
      height: 2px;
      background: #4ADE80;
      box-shadow: 0 0 6px #4ADE80;
      z-index: 11;
    }

    /* Loading / Prompt Splash */
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
      max-width: 280px;
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

  <!-- Load MediaPipe Pose from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="viewport-container">
    <video id="webcam" playsinline autoplay muted></video>
    <canvas id="overlay"></canvas>

    <!-- Header HUD -->
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

    <!-- Rep Counter -->
    <div class="rep-display">
      <div class="rep-number" id="rep-count">0</div>
      <div class="rep-sublabel" id="rep-target">${lang === 'tr' ? `HEDEF: ${target}` : `TARGET: ${target}`}</div>
    </div>

    <!-- Depth Gauge -->
    <div class="depth-gauge">
      <div class="depth-target-line"></div>
      <div class="depth-fill" id="depth-fill"></div>
    </div>

    <!-- Bottom Feedback Banner -->
    <div class="feedback-banner">
      <div class="feedback-content">
        <div class="feedback-text" id="feedback-text">${lang === 'tr' ? 'Pozisyon Alın' : 'Get into Position'}</div>
        <div class="feedback-state" id="feedback-state">${lang === 'tr' ? 'Kamera karşısında şınav vaziyeti alın' : 'Assume push-up position in camera'}</div>
      </div>
    </div>

    <!-- Overlay Prompt -->
    <div id="prompt-overlay">
      <div class="stickman-guide-icon">🏋️‍♂️</div>
      <div class="prompt-title">${lang === 'tr' ? 'AI Şınav Takibi' : 'AI Push-Up Tracker'}</div>
      <div class="prompt-desc">${lang === 'tr' ? 'Telefonunuzu yere yaslayın ve kamera karşısında şınav pozisyonu alın. Görüntü işleme tekrarınızı otomatik sayacaktır.' : 'Prop your phone and get in push-up stance. Computer vision will automatically count your reps.'}</div>
    </div>
  </div>

  <script>
    (function() {
      var isTr = '${lang}' === 'tr';
      var targetReps = ${target};
      var soundEnabled = ${soundEnabled};
      var facingMode = 'user'; // 'user' or 'environment'
      var repCount = 0;
      var currentStage = 'UP'; // 'UP', 'DOWN', 'BOTTOM'
      var lastRepTime = 0;
      var mediaPipeReady = false;
      var cameraStarted = false;

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

      // Calculate angle between three 2D points (A, B, C) where B is the vertex
      function calculateAngle(a, b, c) {
        var radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        var angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
          angle = 360.0 - angle;
        }
        return angle;
      }

      // Process push-up logic given elbow angle and hip alignment
      function processPushUpKinematics(elbowAngle, hipAngle) {
        // Clamp depth between 0% (straight arms ~160 deg) and 100% (bent ~85 deg)
        var depth = Math.min(100, Math.max(0, Math.round(((160 - elbowAngle) / (160 - 85)) * 100)));
        depthFillEl.style.height = depth + '%';

        var now = Date.now();

        // State Machine
        if (elbowAngle > 145) {
          if (currentStage === 'BOTTOM') {
            // Rep completed!
            if (now - lastRepTime > 800) {
              repCount++;
              lastRepTime = now;
              repCountEl.textContent = repCount;

              // Audio celebration
              playTone(587, 0.15, 'triangle');
              setTimeout(function() { playTone(880, 0.25, 'triangle'); }, 120);
              speak(String(repCount));

              feedbackTextEl.textContent = isTr ? 'Harika Tekrar! 🔥' : 'Awesome Rep! 🔥';
              feedbackStateEl.textContent = isTr ? (repCount + '. şınav sayıldı') : ('Rep ' + repCount + ' counted');

              sendToNative({
                type: 'REP_COUNTED',
                count: repCount,
                depth: depth,
                target: targetReps,
                isComplete: repCount >= targetReps
              });

              if (repCount >= targetReps) {
                setTimeout(function() {
                  playTone(1046, 0.4, 'sine');
                }, 300);
              }
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
        } else {
          if (currentStage === 'UP') {
            feedbackTextEl.textContent = isTr ? 'Daha Aşağı İn... 📉' : 'Lower Down... 📉';
            feedbackStateEl.textContent = isTr ? 'Dirseklerinizi 90° bükün' : 'Bend elbows to 90°';
          }
        }
      }

      // Draw stickman skeleton on overlay canvas
      function drawSkeleton(landmarks, elbowAngle, pointElbow) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!landmarks || landmarks.length === 0) return;

        var w = canvas.width;
        var h = canvas.height;

        // Connections to draw
        var connections = [
          [11, 12], // shoulders
          [11, 13], [13, 15], // left arm
          [12, 14], [14, 16], // right arm
          [11, 23], [12, 24], // torso
          [23, 24], // hips
          [23, 25], [25, 27], // left leg
          [24, 26], [26, 28]  // right leg
        ];

        // Draw glowing neon lines
        ctx.save();
        if (facingMode === 'user') {
          // Mirror canvas drawing if video is mirrored
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

        // Draw glowing joint points
        for (var j = 11; j <= 28; j++) {
          var p = landmarks[j];
          if (p && (p.visibility || 1) > 0.4) {
            ctx.fillStyle = (j === 13 || j === 14) ? '#4ADE80' : '#FFD166';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        // Draw elbow angle readout
        if (pointElbow && elbowAngle) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px sans-serif';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          var angleText = Math.round(elbowAngle) + '°';
          ctx.fillText(angleText, pointElbow.x * w + 12, pointElbow.y * h - 10);
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
            // Key landmarks:
            // 11: left_shoulder, 13: left_elbow, 15: left_wrist, 23: left_hip
            // 12: right_shoulder, 14: right_elbow, 16: right_wrist, 24: right_hip
            var lConf = ((lm[11].visibility || 0) + (lm[13].visibility || 0) + (lm[15].visibility || 0)) / 3;
            var rConf = ((lm[12].visibility || 0) + (lm[14].visibility || 0) + (lm[16].visibility || 0)) / 3;

            var elbowAngle = 180;
            var hipAngle = 180;
            var activeElbow = null;

            if (lConf >= rConf && lConf > 0.3) {
              elbowAngle = calculateAngle(lm[11], lm[13], lm[15]);
              hipAngle = calculateAngle(lm[11], lm[23], lm[27]);
              activeElbow = lm[13];
            } else if (rConf > 0.3) {
              elbowAngle = calculateAngle(lm[12], lm[14], lm[16]);
              hipAngle = calculateAngle(lm[12], lm[24], lm[28]);
              activeElbow = lm[14];
            }

            processPushUpKinematics(elbowAngle, hipAngle);
            drawSkeleton(lm, elbowAngle, activeElbow);
          });
        }
      } catch(e) {
        console.warn('MediaPipe Pose init exception:', e);
      }

      // Secondary High-Performance Built-in Optical Motion Tracker (zero-network fallback)
      var prevFrame = null;
      var diffCanvas = document.createElement('canvas');
      diffCanvas.width = 120;
      diffCanvas.height = 90;
      var diffCtx = diffCanvas.getContext('2d');
      var motionHistory = [];
      var opticalBaselineY = null;

      function processOpticalMotionFallback() {
        if (mediaPipeReady) return; // MediaPipe is taking care of it

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
              motionHistory.push(avgY);
              if (motionHistory.length > 20) motionHistory.shift();

              if (opticalBaselineY === null) {
                opticalBaselineY = avgY;
                statusDot.classList.remove('calibrating');
                statusText.textContent = isTr ? 'Hareket Takip Aktif' : 'Motion Tracking Active';
                if (promptOverlay) {
                  promptOverlay.style.opacity = '0';
                  setTimeout(function() { promptOverlay.style.display = 'none'; }, 300);
                }
              }

              // Simulated elbow angle from vertical displacement
              var delta = avgY - opticalBaselineY;
              var pseudoAngle = Math.max(80, Math.min(170, 160 - (delta * 3.5)));
              processPushUpKinematics(pseudoAngle, 170);

              // Draw optical motion indicator
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = '#4ADE80';
              ctx.lineWidth = 3;
              ctx.strokeRect(canvas.width * 0.25, (avgY / 90) * canvas.height - 20, canvas.width * 0.5, 40);
            }
          }
          prevFrame = currentData;
        }
      }

      // Camera feed loop
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

      // Initialize Webcam Stream
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

      // Handle messages from React Native
      window.addEventListener('message', function(event) {
        try {
          var msg = JSON.parse(event.data);
          if (msg.type === 'RESET') {
            repCount = 0;
            repCountEl.textContent = '0';
            currentStage = 'UP';
          } else if (msg.type === 'FLIP_CAMERA') {
            flipBtn.click();
          } else if (msg.type === 'SET_SOUND') {
            soundEnabled = !!msg.enabled;
            updateSoundBtn();
          }
        } catch(e) {}
      });

      // Kick off camera on page load
      window.addEventListener('DOMContentLoaded', function() {
        initCamera();
      });
      // Safety trigger if DOM already loaded
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initCamera();
      }
    })();
  </script>
</body>
</html>`;
}

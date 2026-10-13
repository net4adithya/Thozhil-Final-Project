import { ref, onBeforeUnmount } from 'vue';
import proctoringApi from '../api/proctoringApi';

const SEGMENT_MS = 60_000; // upload a recording segment every 60s, bounding memory and data loss on crash
const HEARTBEAT_MS = 10_000; // tell the admin dashboard "still actually recording" this often

/**
 * Wires up webcam/screen recording and violation detection for an exam session.
 * `config` is exam.proctoring from the backend: { webcam, screenShare, fullscreenRequired, maxViolations }.
 * `onAutoSubmitted` fires if a violation call reports the server auto-submitted the exam.
 */
export function useProctoring(token, config, onAutoSubmitted) {
  const webcamGranted = ref(false);
  const screenGranted = ref(false);
  const violationCount = ref(0);
  const lastWarning = ref('');
  const setupError = ref('');

  let webcamStream = null;
  let screenStream = null;
  let webcamRecorder = null;
  let screenRecorder = null;
  let webcamSegmentStart = null;
  let screenSegmentStart = null;
  let segmentTimers = [];
  let heartbeatId = null;

  async function report(type, meta) {
    try {
      const res = await proctoringApi.logViolation(token, { type, meta });
      violationCount.value = res.violationCount;
      lastWarning.value = warningText(type);
      if (res.autoSubmitted || res.banned || res.terminated) onAutoSubmitted?.(type);
    } catch {
      // Best effort report
    }
  }

  function warningText(type) {
    const map = {
      fullscreen_exit: 'You exited fullscreen. Please return to fullscreen to continue.',
      tab_hidden: 'You switched away from the exam tab. This has been logged.',
      screen_share_stopped: 'Screen sharing was stopped. Please restart it to continue.',
      webcam_denied: 'Webcam access was denied or lost.',
      copy_paste: 'Copy/paste was detected. This has been logged.',
      devtools: 'Developer tools were detected. This has been logged.',
      game_bar_shortcut: 'Screen recording / Game Bar shortcut (Alt+G / Win+G) was blocked & logged.',
      restricted_shortcut: 'Restricted shortcut (F12 / DevTools) was blocked & logged.',
    };
    return map[type] || 'A proctoring event was logged.';
  }

  function startSegmentedRecorder(stream, type) {
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    const chunks = [];
    const startedAt = new Date().toISOString();

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      if (chunks.length === 0) return;
      const blob = new Blob(chunks, { type: 'video/webm' });
      try {
        await proctoringApi.uploadRecording(token, {
          type,
          blob,
          startedAt,
          endedAt: new Date().toISOString(),
        });
      } catch {
        // Best-effort: a lost segment doesn't stop the exam. Worth a "some recordings
        // failed to upload" admin-facing indicator in a later pass.
      }
    };
    recorder.start();
    return recorder;
  }

  function scheduleSegmentRotation(getRecorder, setRecorder, stream, type) {
    const id = setInterval(() => {
      const current = getRecorder();
      if (!current || current.state !== 'recording') return;
      current.stop();
      setRecorder(startSegmentedRecorder(stream, type));
    }, SEGMENT_MS);
    segmentTimers.push(id);
  }

  async function setupWebcam() {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      webcamGranted.value = true;
      webcamRecorder = startSegmentedRecorder(webcamStream, 'webcam');
      scheduleSegmentRotation(
        () => webcamRecorder,
        (r) => (webcamRecorder = r),
        webcamStream,
        'webcam'
      );
      webcamStream.getVideoTracks()[0].addEventListener('ended', () => report('webcam_denied'));
    } catch {
      webcamGranted.value = false;
      await report('webcam_denied');
    }
  }

  async function setupScreenShare() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenGranted.value = true;
      screenRecorder = startSegmentedRecorder(screenStream, 'screen');
      scheduleSegmentRotation(
        () => screenRecorder,
        (r) => (screenRecorder = r),
        screenStream,
        'screen'
      );
      screenStream.getVideoTracks()[0].addEventListener('ended', () => report('screen_share_stopped'));
    } catch {
      screenGranted.value = false;
      await report('screen_share_stopped');
    }
  }

  // Tells the admin dashboard "recording is actually happening right now" — distinct
  // from webcamGranted/screenGranted (permission was granted) since a MediaRecorder can
  // stop or error out silently after that without the stream's 'ended' event firing.
  function sendHeartbeat() {
    proctoringApi
      .recordingHeartbeat(token, {
        webcamActive: !!(webcamRecorder && webcamRecorder.state === 'recording'),
        screenActive: !!(screenRecorder && screenRecorder.state === 'recording'),
      })
      .catch(() => {
        // Best-effort, same as violation reporting — a missed heartbeat just means the
        // admin dashboard shows "stalled" a little early; it self-corrects next tick.
      });
  }

  function onVisibilityChange() {
    if (document.hidden) report('tab_hidden');
  }
  function onFullscreenChange() {
    if (config.fullscreenRequired && !document.fullscreenElement) {
      report('fullscreen_exit');
    }
  }

  let blurTimeoutId = null;

  function onWindowBlur() {
    if (blurTimeoutId) clearTimeout(blurTimeoutId);
    blurTimeoutId = setTimeout(() => {
      // Only report tab_hidden if document is actually hidden (tab switch) or focus truly left browser window
      if (document.hidden || !document.hasFocus()) {
        report('tab_hidden');
      }
    }, 250);
  }

  function onWindowFocus() {
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
      blurTimeoutId = null;
    }
  }

  function onCopy(e) {
    report('copy_paste', { action: 'copy', target: e.target?.tagName || null });
  }
  function onCut(e) {
    report('copy_paste', { action: 'cut', target: e.target?.tagName || null });
  }
  function onPaste(e) {
    report('copy_paste', { action: 'paste', target: e.target?.tagName || null });
  }

  const DEVTOOLS_THRESHOLD_PX = 160;
  const DEVTOOLS_CONSECUTIVE_POLLS_REQUIRED = 3;
  let devtoolsOpen = false;
  let devtoolsSuspectStreak = 0;
  let devtoolsPollId = null;

  function checkDevtools() {
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    const isOpen = widthGap > DEVTOOLS_THRESHOLD_PX || heightGap > DEVTOOLS_THRESHOLD_PX;

    if (!isOpen) {
      devtoolsSuspectStreak = 0;
      devtoolsOpen = false;
      return;
    }

    devtoolsSuspectStreak += 1;
    if (devtoolsSuspectStreak >= DEVTOOLS_CONSECUTIVE_POLLS_REQUIRED && !devtoolsOpen) {
      devtoolsOpen = true;
      report('devtools', { widthGap, heightGap });
    }
  }

  function onKeyDown(e) {
    const isG = e.key === 'g' || e.key === 'G' || e.code === 'KeyG';
    const isWinKey = e.key === 'Meta' || e.key === 'Win' || e.code?.includes('Meta') || e.code?.includes('OS');
    const isGameBarShortcut = (e.altKey && isG) || (e.metaKey && isG) || isWinKey;
    const isDevtoolsShortcut =
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
      (e.metaKey && e.altKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key));
    const isCopyPasteKey =
      (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key);

    if (isGameBarShortcut) {
      e.preventDefault();
      e.stopPropagation();
      report('game_bar_shortcut');
    } else if (isDevtoolsShortcut) {
      e.preventDefault();
      e.stopPropagation();
      report('restricted_shortcut');
    } else if (isCopyPasteKey) {
      e.preventDefault();
      e.stopPropagation();
      report('copy_paste', { key: e.key });
    }
  }
  function onContextMenu(e) {
    e.preventDefault();
  }

  async function requestFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setupError.value = 'Could not enter fullscreen. Please allow it in your browser.';
    }
  }

  async function start() {
    if (config.webcam) await setupWebcam();
    if (config.screenShare) await setupScreenShare();
    if (config.fullscreenRequired) await requestFullscreen();
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    window.addEventListener('blur', onWindowBlur, true);
    window.addEventListener('focus', onWindowFocus, true);
    document.addEventListener('fullscreenchange', onFullscreenChange, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    devtoolsPollId = setInterval(checkDevtools, 1000);
    if (config.webcam || config.screenShare) {
      sendHeartbeat();
      heartbeatId = setInterval(sendHeartbeat, HEARTBEAT_MS);
    }
  }

  function stopRecorderAndWait(recorder) {
    return new Promise((resolve) => {
      if (!recorder || recorder.state !== 'recording') return resolve();
      const originalOnStop = recorder.onstop;
      recorder.onstop = async (e) => {
        try {
          if (originalOnStop) await originalOnStop.call(recorder, e);
        } finally {
          resolve();
        }
      };
      recorder.stop();
    });
  }

  async function stopAll() {
    document.removeEventListener('visibilitychange', onVisibilityChange, true);
    window.removeEventListener('blur', onWindowBlur, true);
    window.removeEventListener('focus', onWindowFocus, true);
    document.removeEventListener('fullscreenchange', onFullscreenChange, true);
    document.removeEventListener('copy', onCopy, true);
    document.removeEventListener('cut', onCut, true);
    document.removeEventListener('paste', onPaste, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('contextmenu', onContextMenu, true);
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
      blurTimeoutId = null;
    }
    if (devtoolsPollId) clearInterval(devtoolsPollId);
    if (heartbeatId) clearInterval(heartbeatId);
    segmentTimers.forEach(clearInterval);
    await Promise.all([stopRecorderAndWait(webcamRecorder), stopRecorderAndWait(screenRecorder)]);
    [webcamStream, screenStream].forEach((s) => s?.getTracks().forEach((t) => t.stop()));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  onBeforeUnmount(stopAll);

  return { start, stopAll, webcamGranted, screenGranted, violationCount, lastWarning, setupError };
}

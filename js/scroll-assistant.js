/**
 * Scroll Checkpoint Recorder & Player
 * ====================================
 * Keyboard-only scroll assistant for presentations.
 *
 * Keys:
 *   R     → Start recording (scrolls to top, clears old checkpoints)
 *   S     → Save checkpoint at current scroll position
 *   E     → End recording, save to localStorage, enter playback mode
 *   Space → Scroll to next checkpoint (playback mode only)
 *
 * Checkpoints persist in localStorage keyed by page pathname.
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  const STORAGE_KEY = 'scroll-assist:' + location.pathname;
  let mode = 'idle';          // idle | recording | playback
  let checkpoints = [];       // absolute scrollY values
  let playbackIndex = 0;
  let isScrolling = false;

  // ── Speed tuning ───────────────────────────────────────
  // Duration (ms) to scroll one full viewport-height of distance.
  const MS_PER_VIEWPORT = 100;

  // ── Helpers ────────────────────────────────────────────
  function log(msg) {
    console.log('%c[ScrollAssist]%c ' + msg,
      'color:#22c55e;font-weight:bold', 'color:inherit');
  }

  /** easeOutQuint — iOS-style fast start, smooth deceleration */
  function ease(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  /**
   * Smoothly scroll to `targetY` at ~1 s per viewport-height.
   * Returns a Promise that resolves when the animation finishes.
   */
  function smoothScrollTo(targetY) {
    return new Promise(function (resolve) {
      var startY = window.scrollY;
      var distance = targetY - startY;
      if (distance === 0) { resolve(); return; }

      var duration = Math.abs(distance) / window.innerHeight * MS_PER_VIEWPORT;
      // Clamp: minimum 200 ms, maximum 4 s
      duration = Math.max(200, Math.min(duration, 4000));

      var startTime = null;
      isScrolling = true;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * ease(progress));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          isScrolling = false;
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  function shouldIgnoreKey(e) {
    var tag = (e.target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
  }

  // ── Initialisation ────────────────────────────────────
  function init() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        checkpoints = JSON.parse(saved);
        if (Array.isArray(checkpoints) && checkpoints.length) {
          mode = 'playback';
          playbackIndex = 0;
          log('Loaded ' + checkpoints.length + ' checkpoint(s) from storage. Press Space to play.');
        }
      } catch (_) { /* corrupt data — ignore */ }
    }
    log('Scroll Assistant ready.  R = Record  |  S = Save checkpoint  |  E = End recording  |  Space = Play');
  }

  // ── Keyboard handler ──────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (shouldIgnoreKey(e)) return;
    var key = e.key;

    // ── R: start recording ──────────────────────────────
    if (key === 'r' || key === 'R') {
      mode = 'recording';
      checkpoints = [];
      playbackIndex = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
      log('Recording started — scroll to each section and press S to save.');
      return;
    }

    // ── S: save checkpoint (recording only) ─────────────
    if ((key === 's' || key === 'S') && mode === 'recording') {
      e.preventDefault();          // prevent browser "Save page" dialog
      var y = Math.round(window.scrollY);
      checkpoints.push(y);
      log('Checkpoint ' + checkpoints.length + ' saved at ' + y + ' px');
      return;
    }

    // ── E: end recording ────────────────────────────────
    if ((key === 'e' || key === 'E') && mode === 'recording') {
      if (checkpoints.length === 0) {
        log('No checkpoints saved — keep scrolling and pressing S.');
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
      mode = 'playback';
      playbackIndex = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });
      log('Recording ended. ' + checkpoints.length + ' checkpoint(s) saved. Press Space to play.');
      return;
    }

    // ── Space: play next checkpoint ─────────────────────
    if (key === ' ' && mode === 'playback') {
      e.preventDefault();          // prevent default page-down scroll

      if (isScrolling) return;     // wait for current animation

      // Past last checkpoint → loop back to top
      if (playbackIndex >= checkpoints.length) {
        playbackIndex = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
        log('Looped back to top. Press Space to start again.');
        return;
      }

      var target = checkpoints[playbackIndex];
      var idx = playbackIndex + 1;
      playbackIndex++;
      smoothScrollTo(target).then(function () {
        log('▶ Checkpoint ' + idx + '/' + checkpoints.length + '  →  ' + target + ' px');
      });
      return;
    }
  });

  // ── Boot ──────────────────────────────────────────────
  init();
})();

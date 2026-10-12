(() => {
  let selectionVersion = 0;
  const pauseAll = () => document.querySelectorAll('[data-after-dark-suite] video').forEach(video => video.pause());
  document.querySelectorAll('[data-after-dark-suite]').forEach(suite => {
  const options = [...suite.querySelectorAll('[data-asset-option]')];
  const panels = [...suite.querySelectorAll('[data-asset-panel]')];
  const play = suite.querySelector('[data-asset-play]');
  const caption = suite.querySelector('[data-asset-caption]');
  const videos = [...suite.querySelectorAll('video')];
  let active = panels.find(panel => !panel.hidden);
  const activeVideo = () => active?.querySelector('video');
  const updatePlay = () => {
    const video = activeVideo();
    if (video?.dataset.artworkOnly === 'true') {
      play.hidden = true;
      caption.textContent = `${active.dataset.assetTitle} artwork. Motion preview is unavailable in this browser.`;
      return;
    }
    play.hidden = !video;
    play.textContent = video?.ended ? 'Replay demo' : video && !video.paused ? 'Pause demo' : 'Play demo';
    play.setAttribute('aria-label', `${play.textContent}: ${active?.dataset.assetTitle ?? ''}`);
  };
  for (const option of options) option.addEventListener('click', () => {
    selectionVersion++;
    pauseAll();
    panels.forEach(panel => panel.hidden = panel.dataset.assetPanel !== option.dataset.assetOption);
    active = panels.find(panel => !panel.hidden);
    options.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
    caption.textContent = active.dataset.assetCaption;
    updatePlay();
  });
  play.addEventListener('click', async () => {
    const video = activeVideo();
    if (!video) return;
    const currentVersion = selectionVersion;
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
      if (currentVersion !== selectionVersion) video.pause();
    } catch {
      if (currentVersion === selectionVersion) { caption.textContent = 'Unable to play this preview. Please try again.'; play.textContent = 'Try again'; }
    }
  });
  videos.forEach(video => ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, () => {
    if (video !== activeVideo()) return;
    if (event === 'error') {
      const fallback = active.querySelector('[data-asset-fallback]');
      if (fallback) { video.dataset.artworkOnly = 'true'; video.hidden = true; fallback.hidden = false; updatePlay(); }
      else { caption.textContent = 'Video unavailable. The still preview is shown.'; play.textContent = 'Try again'; }
    }
    else updatePlay();
  })));
  updatePlay();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { selectionVersion++; pauseAll(); } });
})();

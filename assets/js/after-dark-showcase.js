(() => {
  const suite = document.querySelector('[data-after-dark-suite]');
  if (!suite) return;
  const options = [...suite.querySelectorAll('[data-asset-option]')];
  const panels = [...suite.querySelectorAll('[data-asset-panel]')];
  const play = suite.querySelector('[data-asset-play]');
  const caption = suite.querySelector('[data-asset-caption]');
  const videos = [...suite.querySelectorAll('video')];
  let active = panels.find(panel => !panel.hidden);
  let version = 0;
  const activeVideo = () => active?.querySelector('video');
  const updatePlay = () => {
    const video = activeVideo();
    play.hidden = !video;
    play.textContent = video?.ended ? 'Replay demo' : video && !video.paused ? 'Pause demo' : 'Play demo';
    play.setAttribute('aria-label', `${play.textContent}: ${active?.dataset.assetTitle ?? ''}`);
  };
  for (const option of options) option.addEventListener('click', () => {
    version++;
    videos.forEach(video => video.pause());
    panels.forEach(panel => panel.hidden = panel.dataset.assetPanel !== option.dataset.assetOption);
    active = panels.find(panel => !panel.hidden);
    options.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
    caption.textContent = active.dataset.assetCaption;
    updatePlay();
  });
  play.addEventListener('click', async () => {
    const video = activeVideo();
    if (!video) return;
    const currentVersion = version;
    if (!video.paused) { video.pause(); return; }
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
      if (currentVersion !== version) video.pause();
    } catch {
      if (currentVersion === version) { caption.textContent = 'Unable to play this preview. Please try again.'; play.textContent = 'Try again'; }
    }
  });
  videos.forEach(video => ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, () => {
    if (video !== activeVideo()) return;
    if (event === 'error') { caption.textContent = 'Video unavailable. The still preview is shown.'; play.textContent = 'Try again'; }
    else updatePlay();
  })));
  document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
  updatePlay();
})();

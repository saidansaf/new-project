// YouTube IFrame Player API'ni yuklab, video tugaganini (ENDED) aniqlash uchun yordamchi.

let apiLoadPromise = null;

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * `elementId` konteyner ichida YouTube pleer yaratadi va video tugaganda
 * `onEnded` callback'ini chaqiradi.
 */
export async function createPlayer(elementId, videoId, onEnded) {
  await loadYouTubeAPI();
  return new window.YT.Player(elementId, {
    videoId,
    playerVars: { rel: 0 },
    events: {
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.ENDED) {
          onEnded();
        }
      },
    },
  });
}

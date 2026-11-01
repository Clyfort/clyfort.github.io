(() => {
  if (document.getElementById("clybio-music-widget")) return;

  const tracks = [];
  const style = document.createElement("style");
  style.textContent = `
    #clybio-music-widget {
      --clybio-player-blue: #83b8f4;
      --clybio-player-ink: #24364b;
      position: fixed;
      z-index: 9998;
      right: 88px;
      bottom: 24px;
      font-family: inherit;
      color: var(--clybio-player-ink);
    }
    #clybio-music-widget * { box-sizing: border-box; }
    #clybio-music-toggle {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(84, 139, 202, .22);
      border-radius: 50%;
      background: linear-gradient(145deg, #eaf4ff, #cfe5ff);
      color: #326da9;
      box-shadow: 0 8px 24px rgba(43, 91, 145, .2);
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    #clybio-music-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 11px 28px rgba(43, 91, 145, .26);
    }
    #clybio-music-toggle svg { width: 21px; height: 21px; }
    #clybio-music-panel {
      position: absolute;
      right: 0;
      bottom: 60px;
      width: min(320px, calc(100vw - 32px));
      padding: 16px;
      border: 1px solid rgba(101, 153, 209, .22);
      border-radius: 18px;
      background: rgba(250, 253, 255, .96);
      box-shadow: 0 18px 50px rgba(28, 57, 89, .2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    #clybio-music-panel[hidden] { display: none; }
    .clybio-player-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .clybio-player-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .clybio-player-disc {
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      background: linear-gradient(145deg, #e6f2ff, #c9e2ff);
      color: #3978b8;
    }
    .clybio-player-disc svg { width: 21px; height: 21px; }
    .clybio-player-title {
      overflow: hidden;
      color: #263b53;
      font-size: 14px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .clybio-player-subtitle {
      margin-top: 2px;
      color: #7a8da2;
      font-size: 11px;
    }
    #clybio-player-close {
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: #70849a;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }
    #clybio-player-close:hover { background: #edf5fd; }
    .clybio-player-status {
      padding: 14px 12px;
      border: 1px dashed rgba(96, 145, 195, .32);
      border-radius: 12px;
      background: rgba(234, 244, 255, .62);
      color: #667e97;
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
    }
    .clybio-player-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      padding-top: 13px;
    }
    .clybio-player-controls button {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #6f8ca9;
      font-size: 15px;
    }
    .clybio-player-controls button[disabled] { opacity: .38; }
    .clybio-player-controls .clybio-player-play {
      width: 38px;
      height: 38px;
      background: #dceeff;
      color: #4c86c0;
      font-size: 16px;
    }
    @media (max-width: 640px) {
      #clybio-music-widget {
        left: 16px;
        right: auto;
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
      #clybio-music-panel {
        left: 0;
        right: auto;
        bottom: 58px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #clybio-music-toggle { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement("aside");
  widget.id = "clybio-music-widget";
  widget.setAttribute("aria-label", "ClyBio 音乐播放器");
  widget.innerHTML = `
    <section id="clybio-music-panel" hidden aria-label="音乐播放器">
      <div class="clybio-player-head">
        <div class="clybio-player-brand">
          <div class="clybio-player-disc" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div>
            <div class="clybio-player-title">ClyBio Music</div>
            <div class="clybio-player-subtitle">博客音乐播放器</div>
          </div>
        </div>
        <button id="clybio-player-close" type="button" aria-label="收起播放器">×</button>
      </div>
      <div class="clybio-player-status" role="status">播放器已就绪，曲目待添加</div>
      <div class="clybio-player-controls" aria-label="播放控制">
        <button type="button" aria-label="上一首" disabled>◀|</button>
        <button type="button" class="clybio-player-play" aria-label="播放" disabled>▶</button>
        <button type="button" aria-label="下一首" disabled>|▶</button>
      </div>
    </section>
    <button id="clybio-music-toggle" type="button" aria-label="打开音乐播放器" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
      </svg>
    </button>
  `;
  document.body.appendChild(widget);

  const panel = widget.querySelector("#clybio-music-panel");
  const toggle = widget.querySelector("#clybio-music-toggle");
  const close = widget.querySelector("#clybio-player-close");
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭音乐播放器" : "打开音乐播放器");
  };
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
})();

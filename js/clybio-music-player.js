(() => {
  if (document.getElementById("clybio-music-widget")) return;

  const style = document.createElement("style");
  style.textContent = `
    #clybio-music-widget {
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
      width: min(360px, calc(100vw - 32px));
      max-height: min(76vh, 590px);
      overflow-y: auto;
      padding: 16px;
      border: 1px solid rgba(101, 153, 209, .22);
      border-radius: 18px;
      background: rgba(250, 253, 255, .97);
      box-shadow: 0 18px 50px rgba(28, 57, 89, .2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    #clybio-music-panel[hidden], #clybio-netease-frame-wrap[hidden] { display: none; }
    .clybio-player-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .clybio-player-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
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
    .clybio-player-subtitle { margin-top: 2px; color: #7a8da2; font-size: 11px; }
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
    .clybio-netease-form { display: flex; gap: 8px; margin-bottom: 8px; }
    #clybio-netease-url {
      flex: 1;
      min-width: 0;
      height: 38px;
      padding: 0 10px;
      border: 1px solid #d7e4f1;
      border-radius: 10px;
      outline: none;
      background: #fff;
      color: #263b53;
      font: inherit;
      font-size: 12px;
    }
    #clybio-netease-url:focus { border-color: #82b5e8; box-shadow: 0 0 0 3px rgba(130, 181, 232, .16); }
    #clybio-netease-load {
      flex: 0 0 auto;
      padding: 0 12px;
      border: 0;
      border-radius: 10px;
      background: #dceeff;
      color: #326da9;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    #clybio-netease-load:hover { background: #c9e4ff; }
    .clybio-player-hint { margin: 0 1px 10px; color: #8293a6; font-size: 11px; line-height: 1.5; }
    #clybio-player-status { margin: 0 1px 10px; color: #b05c53; font-size: 11px; line-height: 1.5; }
    #clybio-player-status[hidden] { display: none; }
    .clybio-netease-login {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 1px 0 12px;
      color: #4d7fae;
      font-size: 11px;
      text-decoration: none;
    }
    .clybio-netease-login:hover { color: #245c91; text-decoration: underline; }
    #clybio-netease-frame-wrap {
      overflow: hidden;
      border: 1px solid rgba(101, 153, 209, .18);
      border-radius: 12px;
      background: #fff;
    }
    #clybio-netease-frame { display: block; width: 100%; min-height: 86px; border: 0; background: #fff; }
    @media (max-width: 640px) {
      #clybio-music-widget {
        left: 16px;
        right: auto;
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
      #clybio-music-panel { left: 0; right: auto; bottom: 58px; }
    }
    @media (prefers-reduced-motion: reduce) { #clybio-music-toggle { transition: none; } }
  `;
  document.head.appendChild(style);

  const widget = document.createElement("aside");
  widget.id = "clybio-music-widget";
  widget.setAttribute("aria-label", "ClyBio 音乐播放器");
  widget.innerHTML = '<section id="clybio-music-panel" hidden aria-label="音乐播放器">' +
    '<div class="clybio-player-head">' +
      '<div class="clybio-player-brand"><div class="clybio-player-disc" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>' +
      '</div><div><div class="clybio-player-title">ClyBio Music</div><div class="clybio-player-subtitle">网易云音乐</div></div></div>' +
      '<button id="clybio-player-close" type="button" aria-label="收起播放器">×</button>' +
    '</div>' +
    '<form class="clybio-netease-form" id="clybio-netease-form">' +
      '<input id="clybio-netease-url" type="url" inputmode="url" placeholder="粘贴网易云歌曲或歌单链接" aria-label="网易云歌曲或歌单链接">' +
      '<button id="clybio-netease-load" type="submit">载入</button>' +
    '</form>' +
    '<p class="clybio-player-hint">每位访客可载入自己的分享链接；选择保存在当前浏览器。</p>' +
    '<p id="clybio-player-status" role="status" hidden></p>' +
    '<a class="clybio-netease-login" href="https://music.163.com/" target="_blank" rel="noopener noreferrer">↗ 打开网易云音乐并登录</a>' +
    '<div id="clybio-netease-frame-wrap" hidden><iframe id="clybio-netease-frame" title="网易云音乐播放器" loading="lazy" allow="autoplay"></iframe></div>' +
  '</section>' +
  '<button id="clybio-music-toggle" type="button" aria-label="打开音乐播放器" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>' +
  '</button>';
  document.body.appendChild(widget);

  const panel = widget.querySelector("#clybio-music-panel");
  const toggle = widget.querySelector("#clybio-music-toggle");
  const close = widget.querySelector("#clybio-player-close");
  const form = widget.querySelector("#clybio-netease-form");
  const input = widget.querySelector("#clybio-netease-url");
  const frameWrap = widget.querySelector("#clybio-netease-frame-wrap");
  const frame = widget.querySelector("#clybio-netease-frame");
  const status = widget.querySelector("#clybio-player-status");

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭音乐播放器" : "打开音乐播放器");
  };
  const showStatus = (message) => {
    status.textContent = message;
    status.hidden = !message;
  };
  const parseShareLink = (raw) => {
    let url;
    try { url = new URL(raw); } catch (_) { return null; }
    if (!/(^|\.)music\.163\.com$/i.test(url.hostname)) return null;

    let params = new URLSearchParams(url.search);
    if (!params.has("id") && url.hash.includes("?")) {
      params = new URLSearchParams(url.hash.slice(url.hash.indexOf("?") + 1));
    }
    let id = params.get("id");
    if (!id) {
      const match = (url.pathname + url.hash).match(/(?:playlist|song)\/(\d+)/i);
      if (match) id = match[1];
    }
    if (!id || !/^\d+$/.test(id)) return null;

    const route = (url.pathname + url.hash).toLowerCase();
    const isPlaylist = /playlist|\/discover\//.test(route) || params.get("type") === "0";
    const isSong = /song/.test(route) || params.get("type") === "2";
    if (!isPlaylist && !isSong) return null;
    return { id, isPlaylist };
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const parsed = parseShareLink(input.value.trim());
    if (!parsed) {
      showStatus("请粘贴网易云音乐的单曲或歌单分享链接。");
      return;
    }
    const height = parsed.isPlaylist ? 430 : 86;
    const type = parsed.isPlaylist ? 0 : 2;
    frame.src = "https://music.163.com/outchain/player?type=" + type +
      "&id=" + encodeURIComponent(parsed.id) + "&auto=0&height=" + height;
    frame.style.height = height + "px";
    frameWrap.hidden = false;
    showStatus("");
    try { localStorage.setItem("clybio-netease-share-url", input.value.trim()); } catch (_) {}
  });

  try {
    input.value = localStorage.getItem("clybio-netease-share-url") || "";
  } catch (_) {}

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  document.addEventListener("pointerdown", (event) => {
    if (!widget.contains(event.target) && !panel.hidden) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
})();

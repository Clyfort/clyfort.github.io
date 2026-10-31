let cleanup = () => {};
export default function initBriefing() {
  cleanup();
  const page = document.querySelector(".briefing-page");
  if (!page) return;
  // Also load the current styles after a Swup navigation from an older page.
  if (!document.querySelector('link[data-briefing-layout-style]')) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "/css/life-briefing.css?v=20261101-2";
    style.dataset.briefingLayoutStyle = "";
    document.head.append(style);
  }
  const links = [...page.querySelectorAll(".briefing-toc-links a")];
  const targets = links.map(link => page.querySelector(link.getAttribute("href")));
  let frame = 0;
  function updateCurrent() {
    frame = 0;
    let current = 0;
    targets.forEach((target, index) => {
      if (target && target.getBoundingClientRect().top <= 150) current = index;
    });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function onScroll() {
    if (!frame) frame = requestAnimationFrame(updateCurrent);
  }
  window.addEventListener("scroll", onScroll, {passive: true});
  window.addEventListener("resize", onScroll);
  updateCurrent();

  const section = page.querySelector("#briefing-comments");
  const list = section.querySelector("[data-comment-list]");
  const status = section.querySelector("[data-comment-status]");
  const count = section.querySelector("[data-comment-count]");
  const refresh = section.querySelector("[data-comments-refresh]");
  const more = section.querySelector("[data-comments-more]");
  const controller = new AbortController();
  const endpoint = "https://api.github.com/repos/Clyfort/clyfort.github.io/issues/1/comments";
  let nextPage = 1;
  let loaded = 0;
  let busy = false;
  let disposed = false;
  function renderComment(comment) {
    const card = document.createElement("article");
    card.className = "briefing-comment-card";
    const header = document.createElement("header");
    const avatar = document.createElement("img");
    const login = comment.user?.login || "GitHub 用户";
    const avatarUrl = new URL(comment.user?.avatar_url || "https://github.com/identicons/anonymous.png");
    if (avatarUrl.protocol === "https:") avatar.src = avatarUrl.href;
    avatar.alt = "";
    avatar.loading = "lazy";
    avatar.referrerPolicy = "no-referrer";
    const byline = document.createElement("div");
    const author = document.createElement("a");
    author.className = "comment-author";
    author.textContent = login;
    author.href = "https://github.com/" + encodeURIComponent(login);
    author.target = "_blank";
    author.rel = "noopener noreferrer";
    const time = document.createElement("time");
    time.dateTime = comment.created_at;
    time.textContent = new Date(comment.created_at).toLocaleString("zh-CN", {hour12: false});
    byline.append(author, time);
    header.append(avatar, byline);
    const body = document.createElement("div");
    body.className = "briefing-comment-body";
    body.textContent = comment.body || "";
    card.append(header, body);
    return card;
  }
  async function load(reset = false) {
    if (busy || disposed) return;
    busy = true;
    refresh.disabled = true;
    more.disabled = true;
    const pageNumber = reset ? 1 : nextPage;
    status.hidden = false;
    status.textContent = "正在加载评论…";
    let timeout;
    const request = new AbortController();
    const abort = () => request.abort();
    controller.signal.addEventListener("abort", abort, {once: true});
    try {
      timeout = setTimeout(abort, 15000);
      const response = await fetch(endpoint + "?per_page=100&page=" + pageNumber, {
        headers: {Accept: "application/vnd.github+json"},
        signal: request.signal,
        credentials: "omit"
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const comments = await response.json();
      if (!Array.isArray(comments)) throw new Error("Invalid comments response");
      if (disposed) return;
      if (reset) {list.replaceChildren(); loaded = 0;}
      const fragment = document.createDocumentFragment();
      comments.forEach(comment => fragment.append(renderComment(comment)));
      list.append(fragment);
      loaded += comments.length;
      count.textContent = loaded ? "(" + loaded + ")" : "";
      nextPage = pageNumber + 1;
      more.hidden = !(response.headers.get("link") || "").includes('rel="next"');
      status.textContent = loaded ? "" : "暂无评论，欢迎发表第一条评论。";
      status.hidden = loaded > 0;
    } catch (error) {
      if (!disposed) {
        status.hidden = false;
        status.textContent = "评论暂时无法加载，请点击刷新，或前往 GitHub 查看评论。";
      }
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", abort);
      busy = false;
      refresh.disabled = false;
      more.disabled = false;
    }
  }
  refresh.addEventListener("click", () => load(true));
  more.addEventListener("click", () => load());
  load(true);
  cleanup = () => {
    disposed = true;
    controller.abort();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    cancelAnimationFrame(frame);
  };
}

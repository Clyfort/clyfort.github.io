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

  let disposed = false;
  let instance;
  const section = page.querySelector("#briefing-comments");
  const mount = section.querySelector("#waline");
  const status = section.querySelector("[data-waline-status]");
  if (!document.querySelector('link[data-waline-style]')) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://unpkg.com/@waline/client@v3/dist/waline.css";
    style.dataset.walineStyle = "";
    document.head.append(style);
  }
  import("https://unpkg.com/@waline/client@v3/dist/waline.js")
    .then(({init}) => {
      if (disposed) return;
      instance = init({el: mount, serverURL: "https://clybio.vercel.app", path: "/2026/11/01/life-sciences-briefing/", lang: "zh-CN", meta: ["nick"], requiredMeta: ["nick"], dark: ".dark-mode"});
      status.hidden = true;
    })
    .catch(() => { if (!disposed) status.textContent = "评论组件加载失败，请刷新页面重试。"; });
  cleanup = () => {
    disposed = true;
    if (instance) instance.destroy();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    cancelAnimationFrame(frame);
  };
}

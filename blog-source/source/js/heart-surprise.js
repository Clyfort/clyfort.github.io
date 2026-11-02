(() => {
  let heartClicks = 0;
  let overlay = null;

  function closeSurprise() {
    if (!overlay) return;
    document.removeEventListener("keydown", onKeydown);
    const wasFullscreen = document.fullscreenElement === overlay;
    overlay.remove();
    overlay = null;
    if (wasFullscreen && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") closeSurprise();
  }

  document.addEventListener("click", (event) => {
    const heart = event.target.closest("footer .fa-heart");
    if (!heart || overlay) return;

    heartClicks += 1;
    if (heartClicks < 3) return;

    heartClicks = 0;
    overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "惊喜图片");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      width: "100vw",
      height: "100vh",
      height: "100dvh",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      background: "#1d3657",
      cursor: "zoom-out"
    });

    const image = document.createElement("img");
    image.src = "/images/heart-surprise.jpg";
    image.alt = "海面上的少女与流动的光带";
    Object.assign(image.style, {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain"
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭图片");
    closeButton.textContent = "×";
    Object.assign(closeButton.style, {
      position: "fixed",
      top: "max(16px, env(safe-area-inset-top))",
      right: "max(16px, env(safe-area-inset-right))",
      zIndex: "1",
      width: "44px",
      height: "44px",
      border: "0",
      borderRadius: "50%",
      color: "#fff",
      background: "rgba(0,0,0,.45)",
      font: "32px/1 sans-serif",
      cursor: "pointer"
    });

    overlay.append(image, closeButton);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target === closeButton) closeSurprise();
    });
    document.addEventListener("keydown", onKeydown);
    document.body.append(overlay);

    if (overlay.requestFullscreen) {
      overlay.requestFullscreen().catch(() => {});
    }
  });
})();

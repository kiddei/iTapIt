document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/media");
    const media = await res.json();

    // Sort by reactions desc and take first 6 to match your current layout/dots
    const top = media
      .sort((a, b) => (b.reactions || 0) - (a.reactions || 0))
      .slice(0, 7);

    const slides = document.querySelectorAll("#swiperWrapper .swiper-slide");

    slides.forEach((slide, i) => {
      const card = slide.querySelector(".card-content");
      if (!card) return;

      // ensure overlay positioning works
      card.classList.add("position-relative");

      // clear existing media
      card.innerHTML = "";

      const item = top[i];
      if (!item) return;

      // create media element
      let el;
      if (/mp4|mov|webm/i.test(item.format)) {
        el = document.createElement("video");
        el.src = item.media_link;
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        // don't force autoplay; your custom slider can control play on active
      } else {
        el = document.createElement("img");
        el.src = item.media_link;
        el.alt = item.cloudinary_id || "featured";
      }
      el.className = "w-100 h-100 object-fit-cover";
      card.appendChild(el);

     
    });

    // Optionally play the center (active) slide if it's a video
    const activeVideo = document.querySelector("#swiperWrapper .swiper-slide.active video");
    if (activeVideo) activeVideo.play().catch(() => {});
  } catch (err) {
    console.error("Failed to hydrate Featured Photos:", err);
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const galleryItems = document.querySelectorAll("#gallery img, #gallery video");

  // 🔹 Lazy load images & videos
  const lazyElements = document.querySelectorAll(".lazy");
  const lazyObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;

        if (el.tagName === "IMG" && el.dataset.src) {
          el.src = el.dataset.src;
        } else if (el.tagName === "VIDEO" && el.dataset.src) {
          el.src = el.dataset.src;
          el.load();
        }

        el.classList.remove("lazy");
        obs.unobserve(el);
      }
    });
  }, { rootMargin: "100px", threshold: 0.25 });

  lazyElements.forEach(el => lazyObserver.observe(el));

  // 🔹 Prepare videos (mute, inline, no controls)
  const videos = document.querySelectorAll("#gallery video");
  videos.forEach(video => {
    video.muted = true;
    video.playsInline = true;
    video.removeAttribute("controls");
    video.dataset.playedOnce = "false"; // flag to track 5s autoplay
  });

  // 🔹 Autoplay videos for 5s only once when in view
  const playObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && video.dataset.playedOnce === "false") {
        video.play().catch(err => console.warn("Autoplay failed:", err));

      // Determine actual play time: min(5s, video duration)
      //const playTime = Math.min(5000, video.duration * 1000);

        // Play 5s then pause, but DO NOT reset currentTime
        setTimeout(() => {
          video.pause();
          video.dataset.playedOnce = "true"; // mark as played once
        }, 10000);
      }
    });
  }, { threshold: 0.5 });

  videos.forEach(video => playObserver.observe(video));

  // 🔹 Lightbox setup
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const lightboxVideoSrc = document.getElementById("lightbox-video-src");
  const closeBtn = document.querySelector(".close");

  let currentIndex = -1;

  function openLightbox(index) {
    const item = galleryItems[index];
    currentIndex = index;

    lightbox.classList.add("active");

    if (item.tagName === "IMG") {
      lightboxImg.style.display = "block";
      lightboxVideo.style.display = "none";
      lightboxImg.src = item.src || item.dataset.src;
    } else if (item.tagName === "VIDEO") {
      lightboxImg.style.display = "none";
      lightboxVideo.style.display = "block";
      lightboxVideoSrc.src = item.src || item.dataset.src;
      lightboxVideo.load();
      lightboxVideo.play();
    }
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightboxImg.src = "";
    lightboxVideo.pause();
    lightboxVideoSrc.src = "";
    currentIndex = -1;
  }

  function showNext() {
    if (currentIndex < galleryItems.length - 1) {
      openLightbox(currentIndex + 1);
    }
  }

  function showPrev() {
    if (currentIndex > 0) {
      openLightbox(currentIndex - 1);
    }
  }

  // 🔹 Event Listeners
  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });

  closeBtn.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });
});

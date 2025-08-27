document.addEventListener("DOMContentLoaded", async () => {
  const gallery = document.getElementById("gallery");

  try {
    // 🔹 Fetch from backend
    const res = await fetch("/media");
    const mediaList = await res.json();

    gallery.innerHTML = "";

    mediaList.forEach(item => {
      const div = document.createElement("div");
      div.className = "masonry-item";

      // Wrap media + like UI
      div.innerHTML = `
        <div class="media-wrapper" data-id="${item.media_id}">
          ${item.format.match(/mp4|mov|webm/i)
            ? `<video data-src="${item.media_link}" preload="none" muted playsinline loop class="lazy"></video>`
            : `<img data-src="${item.media_link}" alt="${item.cloudinary_id}" class="lazy">`
          }
          <div class="like-overlay">
            <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 
                       4.5 2.09C13.09 3.81 14.76 3 16.5 3 
                       19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                       6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="like-count">${item.reactions || 0}</span>
          </div>
        </div>
      `;

      gallery.appendChild(div);
    });

    // Re-run setup
    setupLazyLoading();
    setupLightbox();
    setupLikes();

  } catch (err) {
    console.error("Failed to load media:", err);
  }
});

/* ====================
   Lazy Loading
==================== */
function setupLazyLoading() {
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
}

/* ====================
   Lightbox
==================== */
function setupLightbox() {
  const galleryItems = document.querySelectorAll("#gallery img, #gallery video");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const lightboxVideoSrc = document.getElementById("lightbox-video-src");
  const closeBtn = document.querySelector(".close");

  const lightboxHeart = lightbox.querySelector(".lightbox-like-overlay .heart-icon");
  const lightboxCount = lightbox.querySelector(".lightbox-like-overlay .like-count");

  let currentIndex = -1;

  function openLightbox(index) {
  const item = galleryItems[index];
  currentIndex = index;
  lightbox.classList.add("active");

  // sync count from gallery
  const wrapper = item.closest(".media-wrapper");
  if (wrapper) {
    const galleryCount = wrapper.querySelector(".like-count");
    lightboxCount.textContent = galleryCount.textContent;
    lightboxHeart.onclick = () => handleLike(wrapper, lightboxHeart, lightboxCount, galleryCount);

    // 👉 Add double-tap listener to media
    let lastTap = 0;
    const targetMedia = (item.tagName === "IMG") ? lightboxImg : lightboxVideo;
    targetMedia.onclick = (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double-tap detected
        handleLike(wrapper, lightboxHeart, lightboxCount, galleryCount);
        showHeartAnimation();
      }
      lastTap = now;
    };
  }

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
}

/* ====================
   Likes (❤️ animation)
==================== */


function handleLike(wrapper, heart, likeCount, extraCount = null) {
  // Animate heart
  heart.classList.add("animate-like");
  setTimeout(() => heart.classList.remove("animate-like"), 600);

  // Update counts visually
  let count = parseInt(likeCount.textContent) || 0;
  count++;
  likeCount.textContent = count;
  if (extraCount) extraCount.textContent = count; // keep lightbox + gallery in sync

  // 🔹 Backend update
  const mediaId = wrapper.dataset.id;
  fetch(`/like/${mediaId}`, { method: "POST" }).catch(err => console.error("Like failed:", err));
}

function showHeartAnimation() {
  const wrapper = document.querySelector("#lightbox .lightbox-content");

  // 🔹 Big heart
  const bigHeart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  bigHeart.setAttribute("viewBox", "0 0 24 24");
  bigHeart.setAttribute("fill", "red");
  bigHeart.classList.add("doubletap-heart");
  bigHeart.innerHTML = `
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
             2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 
             4.5 2.09C13.09 3.81 14.76 3 16.5 3 
             19.58 3 22 5.42 22 8.5c0 3.78-3.4 
             6.86-8.55 11.54L12 21.35z"/>
  `;
  wrapper.appendChild(bigHeart);

  // remove after done
  setTimeout(() => bigHeart.remove(), 1000);

  // 🔹 Spawn 2–3 mini hearts when spammed
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    spawnMiniHeart(wrapper);
  }
}

function spawnMiniHeart(wrapper) {
  const mini = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  mini.setAttribute("viewBox", "0 0 24 24");
  mini.setAttribute("fill", "red");
  mini.classList.add("mini-heart");
  mini.innerHTML = `
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 
             2 12.28 2 8.5c0-3.08 2.42-5.5 
             5.5-5.5 1.74 0 3.41.81 
             4.5 2.09C13.09 3.81 
             14.76 3 16.5 3c3.08 0 5.5 2.42 
             5.5 5.5 0 3.78-3.4 6.86-8.55 
             11.54L12 21.35z"/>
  `;

  const angle = (Math.random() - 0.5) * 60; // random left/right angle
  const distance = 120 + Math.random() * 50;
  const duration = 800 + Math.random() * 400;

  mini.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 24px;
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.8);
    animation: float-up ${duration}ms ease-out forwards;
  `;

  // custom properties for angle/distance
  mini.style.setProperty("--dx", `${Math.sin(angle * Math.PI / 180) * distance}px`);
  mini.style.setProperty("--dy", `-${Math.cos(angle * Math.PI / 180) * distance}px`);

  wrapper.appendChild(mini);
  setTimeout(() => mini.remove(), duration);
}



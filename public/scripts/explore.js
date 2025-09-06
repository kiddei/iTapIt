// At the top of your index.js (or explore.js)
const isHost = sessionStorage.getItem("isHost") === "true";
  let isManaging = false;

const urlParams = new URLSearchParams(window.location.search);
const isManagingFromUrl = urlParams.get("manage") === "1";
const preselectAlbumId = urlParams.get("album");



document.addEventListener("DOMContentLoaded", async () => {
  const gallery = document.getElementById("gallery");
  let originalOrder = []; // will store DB order




    try {
    // 🔹 Fetch from backend
    const res = await fetch("/media");
    const mediaList = await res.json();

    gallery.innerHTML = "";

    mediaList.forEach(item => {
      const div = document.createElement("div");
      div.className = "masonry-item";

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

          <input type="checkbox" class="select-checkbox form-check-input"
                 style="display:none; position:absolute; top:8px; left:8px; z-index:10;"
                 data-id="${item.media_id}">

          ${isHost ? `
            <button class="delete-btn btn btn-sm btn-danger rounded-pill align-items-center gap-1"
                  data-id="${item.media_id}" aria-label="Delete">
              <i class="bi bi-trash"></i>
            </button>
          ` : ""}
        </div>
      `;
      gallery.appendChild(div);
    });

    // ✅ Capture original DB order AFTER rendering
    originalOrder = Array.from(gallery.children);

    setupLazyLoading();
    setupLightbox();
    setupFilters(gallery, originalOrder);

    // 🔹 Now apply managing mode if URL said so
    if (isManagingFromUrl) {
      isManaging = true;
      gallery.classList.add("managing");
      document.querySelectorAll(".select-checkbox").forEach(cb => {
        cb.style.display = "block";
      });
      bulkBar.style.display = "block";  // or "flex" depending on your CSS
    }

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
  const lightboxDeleteBtn = document.getElementById("lightbox-delete-btn");

  const lightboxHeart = lightbox.querySelector(".lightbox-like-overlay .heart-icon");
  const lightboxCount = lightbox.querySelector(".lightbox-like-overlay .like-count");

  let currentIndex = -1;

  function openLightbox(index) {
  const item = galleryItems[index];
  currentIndex = index;
  lightbox.classList.add("active");

  // sync count from gallery
  const wrapper = item.closest(".media-wrapper");

if (isHost) {
  lightboxDeleteBtn.style.display = "inline-flex";
  lightboxDeleteBtn.onclick = () => {
    const mediaEl = wrapper.querySelector("img, video");
    showDeleteConfirm([{
      id: wrapper.dataset.id,
      src: mediaEl.currentSrc || mediaEl.dataset.src,
      type: mediaEl.tagName.toLowerCase()
    }]);
    closeLightbox(); // close the lightbox while confirming
  };
} else {
  lightboxDeleteBtn.style.display = "none";
}

  
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
function setupFilters(gallery, originalOrder) {
  const filterButtons = document.querySelectorAll(".custom-filter-btn, .dropdown-item[data-filter]");
  const selectedFilterText = document.getElementById("selectedFilterText");

  function applyFilter(filter) {
    const items = Array.from(gallery.children);

    if (filter === "all") {
      // ✅ Restore DB order
      originalOrder.forEach(el => {
        el.style.display = "block";
        gallery.appendChild(el);
      });
    }
    else if (filter === "photos") {
      items.forEach(item => {
        const isPhoto = !!item.querySelector("img");
        item.style.display = isPhoto ? "block" : "none";
      });
    }
    else if (filter === "videos") {
      items.forEach(item => {
        const isVideo = !!item.querySelector("video");
        item.style.display = isVideo ? "block" : "none";
      });
    }
    else if (filter === "most-liked") {
      const sorted = items.sort((a, b) => {
        const aLikes = parseInt(a.querySelector(".like-count")?.textContent || "0", 10);
        const bLikes = parseInt(b.querySelector(".like-count")?.textContent || "0", 10);
        return bLikes - aLikes;
      });

      sorted.forEach(el => {
        el.style.display = "block";
        gallery.appendChild(el);
      });
    }

    // Active state
    document.querySelectorAll(".custom-filter-btn").forEach(btn =>
      btn.classList.toggle("active", btn.dataset.filter === filter)
    );

    if (selectedFilterText) {
      selectedFilterText.textContent = "Selected: " + filter.charAt(0).toUpperCase() + filter.slice(1);
    }
  }

  // Hook events
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  // Default
  applyFilter("all");
}

if (isHost) {
  document.addEventListener("click", (e) => {
    if (e.target.closest(".delete-btn")) {
      const btn = e.target.closest(".delete-btn");
      const wrapper = btn.closest(".media-wrapper");
      const mediaEl = wrapper.querySelector("img, video");

      showDeleteConfirm([{
        id: btn.dataset.id,
        src: mediaEl.currentSrc || mediaEl.dataset.src,
        type: mediaEl.tagName.toLowerCase()
      }]);
    }
  });
}

const manageControls = document.getElementById("manage-controls");
const manageToggle = document.getElementById("manage-toggle");
const bulkBar = document.getElementById("bulk-action-bar");

const bulkCancel = document.getElementById("bulk-cancel");
const bulkDelete = document.getElementById("bulk-delete");
const bulkAdd = document.getElementById("bulk-add");
const selectedCount = document.getElementById("selected-count");

manageControls.style.display = "block"; // always visible now

let selectionMode = false;

function updateSelectedCount() {
  const checked = document.querySelectorAll(".select-checkbox:checked");
  selectedCount.textContent = `${checked.length} selected`;
}

manageToggle.addEventListener("click", () => {
  selectionMode = !selectionMode;
  document.querySelectorAll(".select-checkbox").forEach(cb => {
    cb.style.display = selectionMode ? "block" : "none";
    cb.checked = false;
  });

  bulkBar.style.display = selectionMode ? "block" : "none";

  // 👇 Host vs non-host control
  if (isHost) {
    bulkDelete.style.display = "inline-block";
  } else {
    bulkDelete.style.display = "none";
  }

  updateSelectedCount();
});

bulkCancel.addEventListener("click", () => {
  manageToggle.click(); // exit selection mode
});

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("select-checkbox")) {
    updateSelectedCount();
  }
});

// Host-only bulk delete
if (isHost) {
  bulkDelete.addEventListener("click", () => {
    const checked = Array.from(document.querySelectorAll(".select-checkbox:checked"));
    if (checked.length === 0) return;

    const items = checked.map(cb => {
      const wrapper = cb.closest(".media-wrapper");
      const mediaEl = wrapper.querySelector("img, video");
      return {
        id: cb.dataset.id,
        src: mediaEl.currentSrc || mediaEl.dataset.src,
        type: mediaEl.tagName.toLowerCase()
      };
    });

    showDeleteConfirm(items);
    manageToggle.click(); // exit selection mode
  });
}




const gallery = document.getElementById("gallery");

manageToggle.addEventListener("click", () => {
  isManaging = !isManaging;
  gallery.classList.toggle("managing", isManaging);
});

let deleteQueue = []; // holds {id, src, type}

const deleteModalEl = document.getElementById("deleteConfirmModal");
const deleteModal = new bootstrap.Modal(deleteModalEl);
const deletePreview = document.getElementById("delete-preview");
const deleteMessage = document.getElementById("delete-message");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const addSuccessModalEl = document.getElementById("addSuccessModal");
const addSuccessModal = new bootstrap.Modal(addSuccessModalEl);
const addSuccessMessage = document.getElementById("add-success-message");

function showDeleteConfirm(items) {
  deleteQueue = items;
  deletePreview.innerHTML = "";

  deleteMessage.textContent = items.length === 1
    ? "Are you sure you want to delete this item?"
    : `Are you sure you want to delete ${items.length} items?`;

  items.forEach(it => {
    const thumb = document.createElement(it.type === "video" ? "video" : "img");
    thumb.src = it.src;
    thumb.className = "rounded border";
    thumb.style.width = "80px";
    thumb.style.height = "80px";
    thumb.style.objectFit = "cover";
    if (it.type === "video") thumb.muted = true;
    deletePreview.appendChild(thumb);
  });

  deleteModal.show();
}

confirmDeleteBtn.onclick = () => {
  deleteQueue.forEach(it => {
    // remove from DOM
    const wrapper = document.querySelector(`.media-wrapper[data-id="${it.id}"]`);
    if (wrapper) wrapper.closest(".masonry-item").remove();

    // backend delete (DB + Cloudinary)
    fetch(`/delete/${it.id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          console.error("Delete failed:", data.message || data.error);
        }
      })
      .catch(err => console.error("Delete failed:", err));
  });

  deleteModal.hide();
};

let addQueue = []; // holds {id, src, type}

const addModalEl = document.getElementById("addToAlbumModal");
const addModal = new bootstrap.Modal(addModalEl);
const addPreview = document.getElementById("add-preview");
const albumSelect = document.getElementById("album-select");
const confirmAddBtn = document.getElementById("confirm-add");

async function showAddToAlbum(items) {
  addQueue = items;
  addPreview.innerHTML = "";

  items.forEach(it => {
    const thumb = document.createElement(it.type === "video" ? "video" : "img");
    thumb.src = it.src;
    thumb.className = "rounded border";
    thumb.style.width = "80px";
    thumb.style.height = "80px";
    thumb.style.objectFit = "cover";
    if (it.type === "video") thumb.muted = true;
    addPreview.appendChild(thumb);
  });

  await populateAlbumDropdown(); 
  addModal.show();
}


bulkAdd.addEventListener("click", () => {
  const checked = Array.from(document.querySelectorAll(".select-checkbox:checked"));
  if (checked.length === 0) return;

  const items = checked.map(cb => {
    const wrapper = cb.closest(".media-wrapper");
    const mediaEl = wrapper.querySelector("img, video");
    return {
      id: cb.dataset.id,
      src: mediaEl.currentSrc || mediaEl.dataset.src,
      type: mediaEl.tagName.toLowerCase()
    };
  });

  showAddToAlbum(items);
});


async function populateAlbumDropdown() {
  try {
    const res = await fetch("/folders");
    const albums = await res.json();

    albumSelect.innerHTML = `<option value="">Choose album...</option>`;
    albums.forEach(folder => {
      const opt = document.createElement("option");
      opt.value = folder.folder_id;
      opt.textContent = folder.folder_name;
      if (preselectAlbumId && preselectAlbumId == folder.folder_id) {
        opt.selected = true;
      }
      albumSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error fetching albums:", err);
  }
}

confirmAddBtn.onclick = async () => {
  const folder_id = albumSelect.value;
  const folder_name = albumSelect.options[albumSelect.selectedIndex]?.textContent;
  if (!folder_id) {
    alert("Please choose an album.");
    return;
  }

  const media_ids = addQueue.map(it => it.id);

  try {
    const res = await fetch("/folder_items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id, media_ids })
    });

    const data = await res.json();
    if (data.success) {
      addModal.hide();

      // 🔹 Build message
      let msg = `${data.added} file${data.added !== 1 ? "s" : ""} added to "${folder_name}".`;
      if (data.skipped > 0) {
        msg += ` ${data.skipped} file${data.skipped !== 1 ? "s were" : " was"} already in the album.`;
      }

      addSuccessMessage.textContent = msg;
      addSuccessModal.show();

      // 🔹 Exit managing mode
      isManaging = false;
      gallery.classList.remove("managing");
      document.querySelectorAll(".select-checkbox").forEach(cb => {
        cb.style.display = "none";
        cb.checked = false;
      });
      bulkBar.style.display = "none";
    } else {
      console.error("Add failed:", data.message || data.error);
    }
  } catch (err) {
    console.error("Add failed:", err);
  }
};

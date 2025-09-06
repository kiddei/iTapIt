const isHost = sessionStorage.getItem("isHost") === "true";

document.addEventListener("DOMContentLoaded", async function () {
  const albumsGrid = document.querySelector(".row.g-4"); // album grid container
  const createBtn = document.querySelector("#createAlbumModal .btn-hero-primary");
  const albumTitleInput = document.getElementById("albumTitle");
  const albumDescInput = document.getElementById("albumDescription");

  // ==========================
  // Load albums from backend
  // ==========================
  async function loadAlbums() {
    try {
      const res = await fetch("/folders");
      const folders = await res.json();

      albumsGrid.innerHTML = ""; // clear old content

      folders.forEach(folder => {
        addAlbumToUI(folder);
      });
    } catch (err) {
      console.error("❌ Error loading albums:", err);
    }
  }

  // ==========================
  // Add album card + modal to UI
  // ==========================
  function addAlbumToUI(folder) {
const col = document.createElement("div");
  col.className = "col d-flex";   // ⬅️ flex column instead of h-100

  col.innerHTML = `
    <div class="card album-card text-white flex-fill" 
         data-bs-toggle="modal" data-bs-target="#albumModal${folder.folder_id}">
      <div class="album-grid" id="album-grid-${folder.folder_id}">
        <div class="placeholder"></div>
        <div class="placeholder"></div>
        <div class="placeholder"></div>
        <div class="placeholder"></div>
        <div class="placeholder"></div>
        <div class="placeholder"></div>
      </div>
      <div class="card-body text-start p-3 d-flex flex-column">
        <h5 class="card-title">${folder.folder_name}</h5>
        <p class="card-text album-meta flex-grow-1">${folder.folder_description || ""}</p>
        <div class="d-flex align-items-center justify-content-between mt-auto">
          <span class="album-insight" id="album-count-${folder.folder_id}">Loading...</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
               class="bi bi-arrow-right-circle-fill" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 
                     0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 
                     0 1 0-.708.708L10.293 7.5z"/>
          </svg>
        </div>
      </div>
    </div>
  `;

  albumsGrid.appendChild(col);

  // Modal
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = `
    <div class="modal fade" id="albumModal${folder.folder_id}" tabindex="-1"
         aria-labelledby="albumModal${folder.folder_id}Label" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header d-flex justify-content-between align-items-start">
            <div>
              <h5 class="modal-title mb-1" id="albumModal${folder.folder_id}Label">${folder.folder_name}</h5>
              <p class="album-description-text mb-0">${folder.folder_description}</p>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body row g-3" id="album-body-${folder.folder_id}">
            <p class="text-muted">Loading...</p>
          </div>
        <div class="modal-footer d-flex justify-content-between align-items-center">
        <!-- Left: Close button -->
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>

        <!-- Right: Host buttons -->
        <div class="d-flex gap-2">
          ${isHost ? `
            <button
              type="button"
              class="btn btn-hero-success download-album-btn"
              data-folder-id="${folder.folder_id}"
              data-folder-name="${folder.folder_name}">
              Download as Zip
            </button>
            <button 
              type="button" 
              class="btn btn-hero-danger delete-album-btn"
              data-folder-id="${folder.folder_id}"
              data-folder-name="${folder.folder_name}">
              Delete Album
            </button>
          ` : ""}

          <!-- Always visible Add to Album -->
          <button 
            type="button" 
            class="btn btn-hero-primary add-to-album-btn" 
            data-folder-id="${folder.folder_id}" 
            data-folder-name="${folder.folder_name}">
            Add to Album
          </button>
        </div>
      </div>


      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  fetch(`/folders/${folder.folder_id}/media`)
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById(`album-grid-${folder.folder_id}`);
    const countEl = document.getElementById(`album-count-${folder.folder_id}`);
    const modalBody = document.getElementById(`album-body-${folder.folder_id}`);

    if (data.success && data.media.length > 0) {
      // Album card preview (max 6 thumbnails)
      grid.innerHTML = data.media.slice(0, 6).map(m => `
        <div class="thumb" style="background-image:url('${m.media_link}')"></div>
      `).join("");

      // ✅ Detect type from extension
      const photos = data.media.filter(m =>
        /\.(jpe?g|png|gif|webp|heic)$/i.test(m.media_link)
      ).length;

      const videos = data.media.filter(m =>
        /\.(mp4|mov|avi|mkv|webm)$/i.test(m.media_link)
      ).length;

      countEl.textContent = `${photos} photos & ${videos} videos`;

      // Modal thumbnails
      modalBody.innerHTML = data.media.map(m => `
        <div class="col-md-3">
          <img src="${m.media_link}" class="img-fluid rounded album-photo" alt="">
        </div>
      `).join("");
    } else {
      // Empty album fallback
      grid.innerHTML = `<div class="placeholder"></div>`.repeat(6);
      countEl.textContent = "0 photos & 0 videos";
      modalBody.innerHTML = `<p class="text-muted">No photos yet. Start adding some!</p>`;
    }
  })
  .catch(err => {
    console.error("❌ Error fetching album media:", err);
  });
}


  // ==========================
  // Create album
  // ==========================
  createBtn.addEventListener("click", async () => {
    const folder_name = albumTitleInput.value.trim();
    const folder_description = albumDescInput.value.trim();

    if (!folder_name) {
      alert("Album name is required!");
      return;
    }

    try {
      const res = await fetch("/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_name, folder_description })
      });

      const data = await res.json();
      if (data.success) {
        console.log("✅ Album created:", data.folder);

        addAlbumToUI(data.folder);

        // Reset inputs
        albumTitleInput.value = "";
        albumDescInput.value = "";

        // Close modal programmatically
        const modalElement = bootstrap.Modal.getInstance(document.getElementById("createAlbumModal"));
        modalElement.hide();
      } else {
        alert("❌ Failed to create album");
      }
    } catch (err) {
      console.error("Error creating album:", err);
    }
  });


  if (isHost) {
  const confirmModal = document.createElement("div");
  confirmModal.innerHTML = `
    <div class="modal fade" id="deleteAlbumConfirm" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Delete Album</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p id="delete-album-message" class="mb-0"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button id="confirm-delete-album" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(confirmModal);

  document.getElementById("confirm-delete-album").addEventListener("click", async () => {
  console.log("Deleting album:", albumToDelete);

  try {
    const response = await fetch(`/folders/${albumToDelete}`, { method: "DELETE" });
    const result = await response.json();
    console.log("Delete result:", result);

    if (result.success) {
      // Hide album modal
      const albumModalEl = document.getElementById(`albumModal${albumToDelete}`);
      const albumModal = bootstrap.Modal.getInstance(albumModalEl);
      if (albumModal) albumModal.hide();

      // Hide delete confirmation modal
      const deleteModalEl = document.getElementById("deleteAlbumConfirm");
      const deleteModal = bootstrap.Modal.getInstance(deleteModalEl);
      if (deleteModal) deleteModal.hide();

      // Remove album card from grid
      const albumCard = document.querySelector(`.album-card[data-bs-target="#albumModal${albumToDelete}"]`);
      albumCard?.closest(".col")?.remove();

      // Remove album modal from DOM
      albumModalEl?.remove();

      albumToDelete = null;
    } else {
      alert("Failed to delete album");
    }
  } catch (err) {
    console.error("❌ Error deleting album:", err);
  }
});


}
  // ==========================
  // Init
  // ==========================
  await loadAlbums();
});

// ==========================
// Lightbox for Album Photos
// ==========================
let currentIndex = 0;
let currentAlbumImages = [];

const lightboxModal = document.getElementById("lightboxModal");
const lightboxImage = document.getElementById("lightboxImage");
const closeBtn = document.querySelector(".lightbox-close");
const prevBtn = document.querySelector(".lightbox-prev");
const nextBtn = document.querySelector(".lightbox-next");

// Delegate click to album photos
document.body.addEventListener("click", function(e) {
  if (e.target.classList.contains("album-photo")) {
    const albumBody = e.target.closest(".modal-body");
    currentAlbumImages = [...albumBody.querySelectorAll(".album-photo")];
    currentIndex = currentAlbumImages.indexOf(e.target);

    showLightbox(currentIndex);
  }
});

function showLightbox(index) {
  lightboxModal.style.display = "block";
  lightboxImage.src = currentAlbumImages[index].src;
}

function changeSlide(n) {
  currentIndex = (currentIndex + n + currentAlbumImages.length) % currentAlbumImages.length;
  showLightbox(currentIndex);
}

// Event listeners
closeBtn.addEventListener("click", () => lightboxModal.style.display = "none");
prevBtn.addEventListener("click", () => changeSlide(-1));
nextBtn.addEventListener("click", () => changeSlide(1));

// Close on click outside image
lightboxModal.addEventListener("click", (e) => {
  if (e.target === lightboxModal) {
    lightboxModal.style.display = "none";
  }
});

document.body.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-album-btn")) {
    const albumId = e.target.dataset.folderId;

    // redirect to Explore with album preselect and managing mode
    window.location.href = `explore.html?manage=1&album=${albumId}`;
  }
});

let albumToDelete = null;

document.body.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-album-btn")) {
    const folderId = e.target.dataset.folderId;
    const folderName = e.target.dataset.folderName;

    albumToDelete = folderId;
    document.getElementById("delete-album-message").textContent =
      `Are you sure you want to permanently delete the album "${folderName}"? This cannot be undone.`;

    const modal = new bootstrap.Modal(document.getElementById("deleteAlbumConfirm"));
    modal.show();
  }
});

document.body.addEventListener("click", async (e) => {
  if (e.target.classList.contains("download-album-btn")) {
    const folderId = e.target.dataset.folderId;
    const folderName = e.target.dataset.folderName;

    try {
      const res = await fetch(`/folders/${folderId}/media`);
      const data = await res.json();

      if (data.success && data.media.length > 0) {
        const JSZip = window.JSZip ? window.JSZip : null;
        if (!JSZip) {
          alert("JSZip library not loaded!");
          return;
        }

        const zip = new JSZip();

        // Fetch and add each image to ZIP
        const fetchPromises = data.media.map(async (m, idx) => {
          const response = await fetch(m.media_link);
          const blob = await response.blob();
          const ext = m.media_link.split('.').pop().split(/\#|\?/)[0];
          zip.file(`image_${idx + 1}.${ext}`, blob);
        });

        await Promise.all(fetchPromises);

        // Generate ZIP and trigger download
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${folderName}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        alert("No images in this album to download.");
      }
    } catch (err) {
      console.error("❌ Error downloading album:", err);
      alert("Failed to download album.");
    }
  }
});



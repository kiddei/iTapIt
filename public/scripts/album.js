document.addEventListener("DOMContentLoaded", function () {
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeBtn = document.querySelector(".lightbox-close");

  // ✅ Use event delegation so it works even inside Bootstrap modals
  document.body.addEventListener("click", function (e) {
    if (e.target.classList.contains("album-photo")) {
      lightboxModal.style.display = "flex";
      lightboxImage.src = e.target.src;
    }
  });

  // Close button
  closeBtn.addEventListener("click", () => {
    lightboxModal.style.display = "none";
  });

  // Close when clicking outside image
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) {
      lightboxModal.style.display = "none";
    }
  });
});

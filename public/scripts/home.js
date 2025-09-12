document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });

  const isHost = sessionStorage.getItem("isHost") === "true";
  console.log("Is Host:", isHost);

  const btn = document.getElementById("messageActionBtn");
  const text = document.getElementById("messageActionText");
  const sendIcon = document.getElementById("sendIcon");

   const navLinks = document.getElementById("navLinks");

    if (isHost) {
      navLinks.insertAdjacentHTML("beforeend", `
        <li class="nav-item">
          <a class="nav-link px-3 text-white" href="inbox.html">Inbox</a>
        </li>
      `);
    }

  if (isHost) {
    // Change text
    text.textContent = "View Messages";

    // Remove modal trigger
    btn.removeAttribute("data-bs-toggle");
    btn.removeAttribute("data-bs-target");

    // Change destination
    btn.setAttribute("href", "inbox.html");

    // Swap icon (optional: keep same icon if you prefer)
    sendIcon.outerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#60A5FA" class="bi bi-envelope-fill">
      <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Z"/>
    </svg>`;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/media");
    const media = await res.json();

    // Filter out items with 0 or undefined reactions
    const filtered = media.filter(item => item.reactions && item.reactions > 0);

    // Sort by reactions descending and take first 7 to match your layout/dots
    const sorted = filtered
      .sort((a, b) => b.reactions - a.reactions)
      .slice(0, 7);

    // Rearrange items: center first (position 3), then alternate left-right
    // Positions: [0, 1, 2, 3, 4, 5, 6] (7 slides total)
    // Order: [2nd, 4th, 6th, 1st, 3rd, 5th, 7th] (center=1st, then alternate)
    const positionMap = [3, 2, 4, 1, 5, 0, 6]; // Where each sorted item should go
    const arrangedItems = new Array(7);
    
    sorted.forEach((item, index) => {
      if (index < positionMap.length) {
        arrangedItems[positionMap[index]] = item;
      }
    });

    const slides = document.querySelectorAll("#swiperWrapper .swiper-slide");

    slides.forEach((slide, i) => {
    const card = slide.querySelector(".card-content");
    if (!card) return;

    // ensure overlay positioning works
    card.classList.add("position-relative");

    // clear existing media
    card.innerHTML = "";

    const item = arrangedItems[i];
    // Remove the early return - let the logic flow to create placeholder if no item

    let el;
    if (item) {
      // create media element
      if (/mp4|mov|webm/i.test(item.format)) {
        el = document.createElement("video");
        el.src = item.media_link;
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
      } else {
        el = document.createElement("img");
        el.src = item.media_link;
        el.alt = item.cloudinary_id || "featured";
      }
    } else {
      // Enhanced placeholder with icon (this will now run when item is undefined)
      el = document.createElement("div");
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.background = "rgba(128, 128, 128, 0.2)"; // Gray transparent
      el.style.border = "2px dashed rgba(128, 128, 128, 0.4)";
      el.style.borderRadius = "8px";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "rgba(128, 128, 128, 0.7)";
      el.style.fontSize = "14px";
      el.style.fontFamily = "system-ui, -apple-system, sans-serif";
      
      // Create camera icon using SVG
      const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      iconSvg.setAttribute("width", "48");
      iconSvg.setAttribute("height", "48");
      iconSvg.setAttribute("viewBox", "0 0 24 24");
      iconSvg.setAttribute("fill", "none");
      iconSvg.setAttribute("stroke", "currentColor");
      iconSvg.setAttribute("stroke-width", "1.5");
      iconSvg.style.marginBottom = "12px";
      iconSvg.style.opacity = "0.6";
      
      const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      iconPath.setAttribute("d", "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z");
      
      const iconCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      iconCircle.setAttribute("cx", "12");
      iconCircle.setAttribute("cy", "13");
      iconCircle.setAttribute("r", "4");
      
      iconSvg.appendChild(iconPath);
      iconSvg.appendChild(iconCircle);
      
      // Create text element
      const textEl = document.createElement("span");
      textEl.textContent = "No featured photo";
      textEl.style.textAlign = "center";
      textEl.style.opacity = "0.7";
      
      el.appendChild(iconSvg);
      el.appendChild(textEl);
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

document.getElementById("messageForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const sender = document.getElementById("sender").value.trim();
  const message = document.getElementById("messageText").value.trim();

  if (!sender || !message) return;

  const res = await fetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, message })
  });

  const data = await res.json();
  if (data.success) {
    e.target.reset();
  } else {
    alert("❌ Failed to save message");
  }

   e.preventDefault(); // stop default form submit

  // simulate successful send
  const messageModal = bootstrap.Modal.getInstance(document.getElementById("messageModal"));
  messageModal.hide();

  // after a short delay, show confirmation modal
  setTimeout(() => {
    const successModal = new bootstrap.Modal(document.getElementById("messageSuccessModal"));
    successModal.show();
  }, 300);
});



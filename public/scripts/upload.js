  const startSharingBtns = document.querySelectorAll(".btn.btn-gradient");
  const fileInput = document.getElementById("fileUpload");
  const confirmBtn = document.getElementById("confirmUploadBtn");
  const previewContainer = document.getElementById("filePreviewContainer");
  let selectedFiles = [];

  // open file picker
  startSharingBtns.forEach(btn => {
    btn.addEventListener("click", () => fileInput.click());
  });

  // handle file selection
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    if (files.length === 0) return;

    if (files.length > 20) {
      alert("You can only upload up to 20 files at once.");
      fileInput.value = "";
      return;
    }

    // store temporarily
    selectedFiles = files;

    // build preview
    previewContainer.innerHTML = "";
    files.forEach(file => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 text-center";
      col.innerHTML = `
  <div class="preview-box border rounded-3 bg-black bg-opacity-25 d-flex flex-column align-items-center p-2">
    ${file.type.startsWith("image/") 
      ? `<img src="${URL.createObjectURL(file)}" class="preview-img rounded mb-2">` 
      : `<div class="preview-video bg-secondary text-white d-flex align-items-center justify-content-center rounded mb-2">Video</div>`
    }
    <small class="d-block text-truncate w-100 text-center">${file.name}</small>
  </div>
`;

      previewContainer.appendChild(col);
    });

    // show modal
    const modal = new bootstrap.Modal(document.getElementById("uploadConfirmModal"));
    modal.show();
  });

  // confirm upload
  confirmBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) return;

    const sigRes = await fetch("/get-signature");
    const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

    for (const file of selectedFiles) {
      if (file.size > 100 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 100MB allowed.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      console.log("Uploaded:", data);
    }

    alert("✅ Upload complete!");
    fileInput.value = "";
    selectedFiles = [];
    bootstrap.Modal.getInstance(document.getElementById("uploadConfirmModal")).hide();
  });
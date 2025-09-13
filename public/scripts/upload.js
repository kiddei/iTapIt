const startSharingBtns = document.querySelectorAll(".start-sharing-btn");
const fileInput = document.getElementById("fileUpload");
const confirmBtn = document.getElementById("confirmUploadBtn");
const previewContainer = document.getElementById("filePreviewContainer");
let selectedFiles = [];
let isProcessingUpload = false;

// Remove the original file input change listener to prevent conflicts
// We'll handle file selection manually

// open file picker - only use click events, no file input change events
startSharingBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't open file picker if we're already processing
        if (isProcessingUpload) return;
        
        // Clear any existing file input state
        fileInput.value = "";
        
        // Add one-time event listener for this specific file selection
        const handleFiles = (event) => {
            // Remove this listener immediately to prevent multiple triggers
            fileInput.removeEventListener('change', handleFiles);
            
            const files = Array.from(event.target.files);
            if (files.length === 0) {
                return;
            }

            if (files.length > 20) {
                alert("You can only upload up to 20 files at once.");
                fileInput.value = ""; // Clear input
                return;
            }

            // Store files and show preview
            selectedFiles = files;
            showPreview(files);
        };
        
        // Add the one-time listener
        fileInput.addEventListener('change', handleFiles);
        
        // Trigger file picker
        fileInput.click();
    });
});

// Function to show file preview
function showPreview(files) {
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

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("uploadConfirmModal"));
    modal.show();
}

// confirm upload
confirmBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedFiles.length === 0 || isProcessingUpload) return;

    isProcessingUpload = true;
    confirmBtn.disabled = true;

    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Uploading...";

    try {
        const sigRes = await fetch("/get-signature");
        const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

        for (const file of selectedFiles) {
            if (file.size > 100 * 1024 * 1024) {
                alert(`${file.name} is too large. Max 100MB allowed.`);
                continue;
            }

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);
            formData.append("folder", folder);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                { method: "POST", body: formData }
            );

            const data = await uploadRes.json();
            console.log("✅ Uploaded to Cloudinary:", data);

            // 🔥 Save uploaded media metadata into MongoDB
            await fetch("/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        }

        if (typeof loadGallery === "function") {
    loadGallery();
}

    } catch (error) {
        console.error("❌ Upload error:", error);
        alert("❌ Upload failed. Please try again.");
    } finally {
        cleanupUploadState();
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
});

// Cleanup function to reset all state
function cleanupUploadState() {
    // Clear file input
    fileInput.value = "";
    
    // Clear selected files
    selectedFiles = [];
    
    // Reset button state
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm";
    
    // Hide modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById("uploadConfirmModal"));
    if (modalInstance) {
        modalInstance.hide();
    }
    
    // Clear preview container
    previewContainer.innerHTML = "";
    
    // Reset processing flag
    isProcessingUpload = false;
}

// Handle modal close events - always cleanup when modal closes
const modal = document.getElementById("uploadConfirmModal");
modal.addEventListener("hidden.bs.modal", () => {
    // Always cleanup when modal closes, regardless of upload state
    if (!isProcessingUpload) {
        fileInput.value = "";
        selectedFiles = [];
        previewContainer.innerHTML = "";
    }
});

// Cancel button handler
const cancelBtn = modal.querySelector('[data-bs-dismiss="modal"]');
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        if (!isProcessingUpload) {
            cleanupUploadState();
        }
    });
}
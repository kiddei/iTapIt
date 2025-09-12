document.addEventListener("DOMContentLoaded", async () => {
  const inboxContainer = document.getElementById("inboxContainer");

  try {
    const res = await fetch("/messages");
    const data = await res.json();

    if (!data.success) {
      inboxContainer.innerHTML = `<p class="text-white">❌ Failed to load messages</p>`;
      return;
    }

    if (data.messages.length === 0) {
      inboxContainer.innerHTML = `<p class="text-white">📭 No messages yet</p>`;
      return;
    }

    data.messages.forEach(msg => {
      const date = new Date(msg.datesent).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      const noteHTML = `
        <div class="col">
          <div class="sticky-note">
            <h6 class="note-title">From: ${msg.sender}</h6>
            <p class="note-message">${msg.message}</p>
            <span class="note-date">${date}</span>
          </div>
        </div>
      `;

      inboxContainer.insertAdjacentHTML("beforeend", noteHTML);
    });

  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    inboxContainer.innerHTML = `<p class="text-white">⚠️ Error loading messages</p>`;
  }
});
document.getElementById("eventForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const passcode = document.getElementById("passcode").value.trim();

  if (passcode === "1234") {
    window.location.href = "media-collection.html"; 
  } else {
    alert("Invalid passcode. Please try again.");
  }
});

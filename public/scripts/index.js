document.getElementById("eventForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const passcode = document.getElementById("passcode").value.trim();

  if (passcode === "1234") {
    // Guest login
    sessionStorage.setItem("isHost", "false");
    window.location.href = "home.html"; 
  } 
  else if (passcode === "5678") {
    // Host login
    sessionStorage.setItem("isHost", "true");
    window.location.href = "home.html"; 
  } 
  else {
    alert("Invalid passcode. Please try again.");
  }
});

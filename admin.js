// -------------------------------
// Set welcome message dynamically
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const adminName = localStorage.getItem("adminName") || "Admin";
  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText) {
    welcomeText.textContent = `Welcome, ${adminName}`;
  }
});

// -------------------------------
// Toast function
// -------------------------------
function showToast(message, duration = 3000) {
  // Create toast element if it doesn't exist
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// -------------------------------
// Logout function with toast
// -------------------------------
function logout() {
  // Show toast message
  showToast("Logging out...", 2000);

  // Wait 2 seconds, then clear session and redirect
  setTimeout(() => {
    localStorage.removeItem("adminName");
    window.location.href = "admin-login.html";
  }, 2000);
}

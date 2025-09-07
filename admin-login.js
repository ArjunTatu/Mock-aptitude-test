const adminLoginForm = document.getElementById("adminLoginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

adminLoginForm.addEventListener("submit", function(e) {
  e.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = "Checking...";

  const username = document.getElementById("adminUsername").value.trim().toLowerCase();
  const password = document.getElementById("adminPassword").value.trim();

  // Fetch admin data from admin.json
  fetch("admin.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load admin data");
      return response.json();
    })
    .then(admins => {
      const admin = admins.find(a => a.username.toLowerCase() === username && a.password === password);

      if (admin) {
        localStorage.setItem("adminName", admin.name);
        localStorage.setItem("adminEmail", admin.username);
        localStorage.setItem("role", "admin");
        window.location.href = "admin.html";
      } else {
        showError("❌ Invalid email or password.");
      }
    })
    .catch(err => {
      console.error("Error loading admin.json:", err);
      showError("⚠️ Unable to verify login. Please try again later.");
    })
    .finally(() => {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    });
});

function showError(message) {
  errorMsg.style.display = "block";
  errorMsg.textContent = message;
}

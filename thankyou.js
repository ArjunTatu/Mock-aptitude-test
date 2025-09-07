document.addEventListener("DOMContentLoaded", () => {
  console.log("Thank You page loaded successfully.");

  // Clear session to prevent returning to quiz
  sessionStorage.clear();

  // Prevent back button navigation to quiz
  history.replaceState(null, null, location.href);
  window.addEventListener('popstate', () => {
    // Redirect to login if user tries to go back
    window.location.href = "index.html";
  });

  // Countdown redirect
  let countdown = 5; // 5 seconds countdown
  const countdownElement = document.getElementById("countdown");

  const timer = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(timer);
      window.location.href = "index.html"; // Redirect to home
    }
  }, 1000);
});

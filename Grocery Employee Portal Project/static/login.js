const loginForm = document.getElementById("loginForm");
const messageEl = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
        messageEl.textContent = data.message || "Login failed.";
        return;
    }

    window.location.href = data.redirect;
});

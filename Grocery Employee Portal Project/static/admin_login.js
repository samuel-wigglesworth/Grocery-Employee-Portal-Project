const adminForm = document.getElementById("adminLoginForm");
const adminMessage = document.getElementById("message");

adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    adminMessage.textContent = "";

    const password = document.getElementById("adminPassword").value;

    const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (!response.ok) {
        adminMessage.textContent = data.message || "Admin login failed.";
        return;
    }

    window.location.href = data.redirect;
});

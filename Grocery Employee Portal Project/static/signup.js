const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("message");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    signupMessage.textContent = "";

    const payload = {
        username: document.getElementById("username").value.trim(),
        gender: document.getElementById("gender").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
        phone: document.getElementById("phone").value.trim()
    };

    const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    signupMessage.textContent = data.message;
    signupMessage.style.color = response.ok ? "#1f8f4e" : "#c0392b";

    if (response.ok) {
        signupForm.reset();
    }
});

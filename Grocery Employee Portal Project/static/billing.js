const billForm = document.getElementById("billForm");
const billTableBody = document.querySelector("#billTable tbody");
const grandTotalEl = document.getElementById("grandTotal");
const resetBtn = document.getElementById("resetBtn");
const printBtn = document.getElementById("printBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

let billRows = [];

function renderBillTable() {
    billTableBody.innerHTML = "";
    let grandTotal = 0;

    billRows.forEach((row) => {
        const lineTotal = row.quantity * row.price;
        grandTotal += lineTotal;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.item}</td>
            <td>${row.quantity}</td>
            <td>${row.price.toFixed(2)}</td>
            <td>${row.clientName}</td>
            <td>${lineTotal.toFixed(2)}</td>
        `;
        billTableBody.appendChild(tr);
    });

    grandTotalEl.textContent = grandTotal.toFixed(2);
}

billForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const item = document.getElementById("item").value.trim();
    const quantity = Number(document.getElementById("quantity").value);
    const price = Number(document.getElementById("price").value);
    const clientName = document.getElementById("clientName").value.trim();

    if (!item || !clientName || quantity <= 0 || price < 0) {
        alert("Please fill valid bill details.");
        return;
    }

    billRows.push({ item, quantity, price, clientName });
    renderBillTable();
    billForm.reset();
});

resetBtn.addEventListener("click", () => {
    billRows = [];
    renderBillTable();
    billForm.reset();
});

printBtn.addEventListener("click", () => {
    window.print();
});

adminLogoutBtn.addEventListener("click", async () => {
    const response = await fetch("/admin-logout", { method: "POST" });
    const data = await response.json();
    window.location.href = data.redirect;
});

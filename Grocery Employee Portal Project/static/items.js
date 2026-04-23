const itemsTableBody = document.querySelector("#itemsTable tbody");
const itemLogoutBtn = document.getElementById("logoutBtn");

function categorySelect(selectedValue = "") {
    const categories = ["Grocery", "Dairy", "Produce", "Beverage", "Bakery", "Frozen"];
    return `
        <select>
            <option value="">Select category</option>
            ${categories
                .map(
                    (category) =>
                        `<option value="${category}" ${selectedValue === category ? "selected" : ""}>${category}</option>`
                )
                .join("")}
        </select>
    `;
}

function createItemRow(item) {
    const row = document.createElement("tr");
    row.dataset.id = item.id;
    row.innerHTML = `
        <td><input type="text" value="${item.item_name || ""}"></td>
        <td><input type="text" value="${item.item_id || ""}"></td>
        <td><input type="number" min="0" value="${item.quantity ?? ""}"></td>
        <td><input type="number" min="0" step="0.01" value="${item.price ?? ""}"></td>
        <td>${categorySelect(item.category || "")}</td>
        <td>
            <div class="row-actions">
                <button class="save-btn">Save</button>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </td>
    `;
    return row;
}

function setItemRowEditable(row, editable) {
    row.querySelectorAll("input, select").forEach((el) => {
        el.disabled = !editable;
    });
}

function readItemRowData(row) {
    const inputs = row.querySelectorAll("input");
    const category = row.querySelector("select");
    return {
        item_name: inputs[0].value.trim(),
        item_id: inputs[1].value.trim(),
        quantity: Number(inputs[2].value),
        price: Number(inputs[3].value),
        category: category.value
    };
}

async function loadItems() {
    const response = await fetch("/api/items");
    const items = await response.json();
    itemsTableBody.innerHTML = "";

    const emptyRow = createItemRow({
        id: "",
        item_name: "",
        item_id: "",
        quantity: "",
        price: "",
        category: ""
    });
    setItemRowEditable(emptyRow, true);
    itemsTableBody.appendChild(emptyRow);

    items.forEach((item) => {
        const row = createItemRow(item);
        setItemRowEditable(row, false);
        itemsTableBody.appendChild(row);
    });
}

itemsTableBody.addEventListener("click", async (event) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement)) return;
    const row = button.closest("tr");
    if (!row) return;

    if (button.classList.contains("edit-btn")) {
        setItemRowEditable(row, true);
        return;
    }

    if (button.classList.contains("save-btn")) {
        const payload = readItemRowData(row);
        const rowId = row.dataset.id;
        const isNew = !rowId;

        const response = await fetch(isNew ? "/api/items" : `/api/items/${rowId}`, {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Could not save item.");
            return;
        }
        await loadItems();
        return;
    }

    if (button.classList.contains("delete-btn")) {
        const rowId = row.dataset.id;
        if (!rowId) {
            row.remove();
            return;
        }
        const response = await fetch(`/api/items/${rowId}`, { method: "DELETE" });
        if (response.ok) {
            await loadItems();
        }
    }
});

itemLogoutBtn.addEventListener("click", async () => {
    const response = await fetch("/logout", { method: "POST" });
    const data = await response.json();
    window.location.href = data.redirect;
});

loadItems();

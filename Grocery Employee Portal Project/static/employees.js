const employeesTableBody = document.querySelector("#employeesTable tbody");
const logoutBtn = document.getElementById("logoutBtn");

function createEmployeeRow(employee) {
    const row = document.createElement("tr");
    row.dataset.id = employee.id;
    row.innerHTML = `
        <td><input type="text" value="${employee.name || ""}"></td>
        <td><input type="text" value="${employee.employee_id || ""}"></td>
        <td><input type="text" value="${employee.phone || ""}"></td>
        <td><input type="text" value="${employee.address || ""}"></td>
        <td><input type="text" value="${employee.password || ""}"></td>
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

function readRowData(row) {
    const inputs = row.querySelectorAll("input");
    return {
        name: inputs[0].value.trim(),
        employee_id: inputs[1].value.trim(),
        phone: inputs[2].value.trim(),
        address: inputs[3].value.trim(),
        password: inputs[4].value
    };
}

function setRowEditable(row, editable) {
    row.querySelectorAll("input").forEach((input) => {
        input.disabled = !editable;
    });
}

async function loadEmployees() {
    const response = await fetch("/api/employees");
    const employees = await response.json();
    employeesTableBody.innerHTML = "";

    const emptyRow = createEmployeeRow({
        id: "",
        name: "",
        employee_id: "",
        phone: "",
        address: "",
        password: ""
    });
    setRowEditable(emptyRow, true);
    employeesTableBody.appendChild(emptyRow);

    employees.forEach((employee) => {
        const row = createEmployeeRow(employee);
        setRowEditable(row, false);
        employeesTableBody.appendChild(row);
    });
}

employeesTableBody.addEventListener("click", async (event) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement)) return;
    const row = button.closest("tr");
    if (!row) return;

    if (button.classList.contains("edit-btn")) {
        setRowEditable(row, true);
        return;
    }

    if (button.classList.contains("save-btn")) {
        const payload = readRowData(row);
        const rowId = row.dataset.id;
        const isNew = !rowId;

        const response = await fetch(isNew ? "/api/employees" : `/api/employees/${rowId}`, {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Could not save employee.");
            return;
        }
        await loadEmployees();
        return;
    }

    if (button.classList.contains("delete-btn")) {
        const rowId = row.dataset.id;
        if (!rowId) {
            row.remove();
            return;
        }
        const response = await fetch(`/api/employees/${rowId}`, { method: "DELETE" });
        if (response.ok) {
            await loadEmployees();
        }
    }
});

logoutBtn.addEventListener("click", async () => {
    const response = await fetch("/logout", { method: "POST" });
    const data = await response.json();
    window.location.href = data.redirect;
});

loadEmployees();

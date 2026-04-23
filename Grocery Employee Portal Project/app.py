from flask import Flask, jsonify, redirect, render_template, request, session, url_for
import sqlite3
from pathlib import Path


app = Flask(__name__)
app.secret_key = "grocery-employee-portal-secret"
DB_PATH = Path(__file__).parent / "portal.db"
ADMIN_PASSWORD = "admin123"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            gender TEXT NOT NULL,
            password TEXT NOT NULL,
            phone TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            password TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            item_id TEXT UNIQUE NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


@app.before_request
def create_tables_if_needed():
    init_db()


@app.route("/")
def index():
    if session.get("user"):
        return redirect(url_for("employees_page"))
    if session.get("admin"):
        return redirect(url_for("billing_page"))
    return redirect(url_for("login_page"))


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/signup")
def signup_page():
    return render_template("signup.html")


@app.route("/admin-login")
def admin_login_page():
    return render_template("admin_login.html")


@app.route("/employees")
def employees_page():
    if not session.get("user"):
        return redirect(url_for("login_page"))
    return render_template("employees.html", username=session.get("user"))


@app.route("/items")
def items_page():
    if not session.get("user"):
        return redirect(url_for("login_page"))
    return render_template("items.html", username=session.get("user"))


@app.route("/billing")
def billing_page():
    if not session.get("admin"):
        return redirect(url_for("admin_login_page"))
    return render_template("billing.html")


@app.post("/api/signup")
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    gender = (data.get("gender") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or ""
    phone = (data.get("phone") or "").strip()

    if not all([username, gender, password, confirm_password, phone]):
        return jsonify({"ok": False, "message": "All signup fields are required."}), 400

    if password != confirm_password:
        return jsonify({"ok": False, "message": "Passwords do not match."}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (username, gender, password, phone) VALUES (?, ?, ?, ?)",
            (username, gender, password, phone),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "message": "Username already exists."}), 409

    conn.close()
    return jsonify({"ok": True, "message": "Signup successful."})


@app.post("/api/login")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()
    conn.close()

    if user is None:
        return jsonify({"ok": False, "message": "Invalid username or password."}), 401

    session.clear()
    session["user"] = username
    return jsonify({"ok": True, "redirect": url_for("employees_page")})


@app.post("/api/admin-login")
def admin_login():
    data = request.get_json() or {}
    password = data.get("password") or ""
    if password != ADMIN_PASSWORD:
        return jsonify({"ok": False, "message": "Invalid admin password."}), 401

    session.clear()
    session["admin"] = True
    return jsonify({"ok": True, "redirect": url_for("billing_page")})


@app.get("/api/employees")
def get_employees():
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    rows = conn.execute(
        "SELECT id, name, employee_id, phone, address, password FROM employees ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.post("/api/employees")
def create_employee():
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    employee_id = (data.get("employee_id") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()
    password = data.get("password") or ""

    if not all([name, employee_id, phone, address, password]):
        return jsonify({"ok": False, "message": "All employee fields are required."}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO employees (name, employee_id, phone, address, password)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, employee_id, phone, address, password),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "message": "Employee ID already exists."}), 409

    conn.close()
    return jsonify({"ok": True, "message": "Employee saved."})


@app.put("/api/employees/<int:row_id>")
def update_employee(row_id):
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    employee_id = (data.get("employee_id") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()
    password = data.get("password") or ""

    if not all([name, employee_id, phone, address, password]):
        return jsonify({"ok": False, "message": "All employee fields are required."}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            """
            UPDATE employees
            SET name = ?, employee_id = ?, phone = ?, address = ?, password = ?
            WHERE id = ?
            """,
            (name, employee_id, phone, address, password, row_id),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "message": "Employee ID already exists."}), 409

    conn.close()
    return jsonify({"ok": True, "message": "Employee updated."})


@app.delete("/api/employees/<int:row_id>")
def delete_employee(row_id):
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    conn.execute("DELETE FROM employees WHERE id = ?", (row_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "Employee deleted."})


@app.get("/api/items")
def get_items():
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    rows = conn.execute(
        "SELECT id, item_name, item_id, quantity, price, category FROM items ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.post("/api/items")
def create_item():
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    data = request.get_json() or {}
    item_name = (data.get("item_name") or "").strip()
    item_id = (data.get("item_id") or "").strip()
    quantity = data.get("quantity")
    price = data.get("price")
    category = (data.get("category") or "").strip()

    if not all([item_name, item_id, category]) or quantity is None or price is None:
        return jsonify({"ok": False, "message": "All item fields are required."}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO items (item_name, item_id, quantity, price, category)
            VALUES (?, ?, ?, ?, ?)
            """,
            (item_name, item_id, int(quantity), float(price), category),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "message": "Item ID already exists."}), 409

    conn.close()
    return jsonify({"ok": True, "message": "Item saved."})


@app.put("/api/items/<int:row_id>")
def update_item(row_id):
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    data = request.get_json() or {}
    item_name = (data.get("item_name") or "").strip()
    item_id = (data.get("item_id") or "").strip()
    quantity = data.get("quantity")
    price = data.get("price")
    category = (data.get("category") or "").strip()

    if not all([item_name, item_id, category]) or quantity is None or price is None:
        return jsonify({"ok": False, "message": "All item fields are required."}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            """
            UPDATE items
            SET item_name = ?, item_id = ?, quantity = ?, price = ?, category = ?
            WHERE id = ?
            """,
            (item_name, item_id, int(quantity), float(price), category, row_id),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"ok": False, "message": "Item ID already exists."}), 409

    conn.close()
    return jsonify({"ok": True, "message": "Item updated."})


@app.delete("/api/items/<int:row_id>")
def delete_item(row_id):
    if not session.get("user"):
        return jsonify({"ok": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    conn.execute("DELETE FROM items WHERE id = ?", (row_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "message": "Item deleted."})


@app.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True, "redirect": url_for("login_page")})


@app.post("/admin-logout")
def admin_logout():
    session.clear()
    return jsonify({"ok": True, "redirect": url_for("admin_login_page")})


if __name__ == "__main__":
    init_db()
    app.run(debug=True)

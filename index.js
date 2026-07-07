// backend/server/index.js

// ==========================================
// Import required packages
// ==========================================
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

// ==========================================
// Create Express app
// ==========================================
const app = express();
const PORT = 5000;

// ==========================================
// Enable CORS and JSON parsing
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// Connect to SQLite database
// ==========================================
const db = new Database("data.db");

// ==========================================
// Create patients table if it doesn't exist
// ==========================================
db.prepare(`
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    disease TEXT NOT NULL,
    doctor TEXT NOT NULL,
    admission_date TEXT DEFAULT CURRENT_TIMESTAMP
)
`).run();

// ==========================================
// Root Route
// ==========================================
app.get("/", (req, res) => {
    res.send("Hospital Management API Running");
});

// ==========================================
// POST /patients
// Register a new patient
// ==========================================
app.post("/patients", (req, res) => {

    const {
        name,
        age,
        gender,
        phone,
        email,
        disease,
        doctor
    } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !disease || !doctor) {
        return res.status(400).json({
            message: "Missing required fields."
        });
    }

    // Check duplicate email
    if (email) {
        const existing = db
            .prepare("SELECT * FROM patients WHERE email = ?")
            .get(email);

        if (existing) {
            return res.status(409).json({
                message: "Email already exists."
            });
        }
    }

    // Insert patient
    const result = db.prepare(`
        INSERT INTO patients
        (name, age, gender, phone, email, disease, doctor)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        name,
        age,
        gender,
        phone || null,
        email || null,
        disease,
        doctor
    );

    // Return inserted patient
    const patient = db
        .prepare("SELECT * FROM patients WHERE id=?")
        .get(result.lastInsertRowid);

    res.status(201).json(patient);
});

// ==========================================
// GET /patients
// Get all patients
// Supports:
// Pagination
// Search
// ==========================================
app.get("/patients", (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const offset = (page - 1) * limit;

    const search = req.query.search
        ? `%${req.query.search.toLowerCase()}%`
        : null;

    let data;
    let total;

    if (search) {

        total = db.prepare(`
            SELECT COUNT(*) AS total
            FROM patients
            WHERE
            LOWER(name) LIKE ?
            OR LOWER(doctor) LIKE ?
            OR LOWER(disease) LIKE ?
        `).get(search, search, search).total;

        data = db.prepare(`
            SELECT *
            FROM patients
            WHERE
            LOWER(name) LIKE ?
            OR LOWER(doctor) LIKE ?
            OR LOWER(disease) LIKE ?
            ORDER BY id DESC
            LIMIT ?
            OFFSET ?
        `).all(
            search,
            search,
            search,
            limit,
            offset
        );

    } else {

        total = db.prepare(`
            SELECT COUNT(*) AS total
            FROM patients
        `).get().total;

        data = db.prepare(`
            SELECT *
            FROM patients
            ORDER BY id DESC
            LIMIT ?
            OFFSET ?
        `).all(limit, offset);
    }

    res.json({
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    });

});

// ==========================================
// GET /patients/:id
// Return one patient
// ==========================================
app.get("/patients/:id", (req, res) => {

    const patient = db.prepare(`
        SELECT *
        FROM patients
        WHERE id=?
    `).get(req.params.id);

    if (!patient) {
        return res.status(404).json({
            message: "Patient not found."
        });
    }

    res.json(patient);

});

// ==========================================
// PUT /patients/:id
// Update patient
// ==========================================
app.put("/patients/:id", (req, res) => {

    const id = req.params.id;

    const existing = db.prepare(`
        SELECT *
        FROM patients
        WHERE id=?
    `).get(id);

    if (!existing) {
        return res.status(404).json({
            message: "Patient not found."
        });
    }

    const {
        name,
        age,
        gender,
        phone,
        email,
        disease,
        doctor
    } = req.body;

    // Check duplicate email if changed
    if (email) {

        const duplicate = db.prepare(`
            SELECT *
            FROM patients
            WHERE email=? AND id!=?
        `).get(email, id);

        if (duplicate) {
            return res.status(409).json({
                message: "Email already exists."
            });
        }

    }

    db.prepare(`
        UPDATE patients
        SET
            name=?,
            age=?,
            gender=?,
            phone=?,
            email=?,
            disease=?,
            doctor=?
        WHERE id=?
    `).run(
        name,
        age,
        gender,
        phone || null,
        email || null,
        disease,
        doctor,
        id
    );

    const updated = db.prepare(`
        SELECT *
        FROM patients
        WHERE id=?
    `).get(id);

    res.json(updated);

});

// ==========================================
// DELETE /patients/:id
// Delete patient
// ==========================================
app.delete("/patients/:id", (req, res) => {

    const patient = db.prepare(`
        SELECT *
        FROM patients
        WHERE id=?
    `).get(req.params.id);

    if (!patient) {
        return res.status(404).json({
            message: "Patient not found."
        });
    }

    db.prepare(`
        DELETE FROM patients
        WHERE id=?
    `).run(req.params.id);

    res.json({
        message: "Patient deleted successfully."
    });

});

// ==========================================
// Start server
// ==========================================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
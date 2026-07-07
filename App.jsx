// frontend/hospitalDemo/src/App.jsx

// ==========================================
// Import React Hooks
// ==========================================
import { useEffect, useState } from "react";
import "./App.css";

// ==========================================
// Backend URL
// ==========================================
const API = "http://localhost:5000";

// ==========================================
// App Component
// ==========================================
function App() {
  // -----------------------------
  // Theme
  // -----------------------------
  const [darkMode, setDarkMode] = useState(false);

  // -----------------------------
  // Form State
  // -----------------------------
  const initialForm = {
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    disease: "",
    doctor: "",
  };

  const [form, setForm] = useState(initialForm);

  // -----------------------------
  // Patient Data
  // -----------------------------
  const [patients, setPatients] = useState([]);

  // -----------------------------
  // Edit Mode
  // -----------------------------
  const [editingId, setEditingId] = useState(null);

  // -----------------------------
  // Search & Pagination
  // -----------------------------
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 5;

  const [totalPages, setTotalPages] = useState(1);

  // -----------------------------
  // Loading
  // -----------------------------
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Error Message
  // -----------------------------
  const [error, setError] = useState("");

  // -----------------------------
  // Last Updated
  // -----------------------------
  const [lastUpdated, setLastUpdated] = useState("");

  // ==========================================
  // Load Patients
  // ==========================================
  const loadPatients = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/patients?page=${page}&limit=${limit}&search=${search}`
      );

      const data = await res.json();

      setPatients(data.data);
      setTotalPages(data.totalPages || 1);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [page, search]);

  // ==========================================
  // Update Form
  // ==========================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // Submit Form
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !form.name ||
      !form.age ||
      !form.gender ||
      !form.disease ||
      !form.doctor
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const url = editingId
      ? `${API}/patients/${editingId}`
      : `${API}/patients`;

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      setForm(initialForm);
      setEditingId(null);
      loadPatients();
    } catch {
      setError("Unable to connect to server.");
    }
  };

  // ==========================================
  // Edit Patient
  // ==========================================
  const editPatient = (patient) => {
    setEditingId(patient.id);

    setForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone || "",
      email: patient.email || "",
      disease: patient.disease,
      doctor: patient.doctor,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // Delete Patient
  // ==========================================
  const deletePatient = async (id) => {
    if (!window.confirm("Delete this patient?")) return;

    await fetch(`${API}/patients/${id}`, {
      method: "DELETE",
    });

    loadPatients();
  };

  // ==========================================
  // Avatar Initials
  // ==========================================
  const initials = (name) => {
    return name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // ==========================================
  // Theme Class
  // ==========================================
  return (
    <div className={darkMode ? "app dark" : "app"}>
      <div className="container">
        <h1>🏥 Hospital Management System</h1>

        <button
          className="themeBtn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="form">
          <h2>
            {editingId
              ? "Update Patient"
              : "Register Patient"}
          </h2>

          <label>Patient Name *</label>

          <input
            type="text"
            maxLength="40"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <div className="counter">
            {form.name.length}/40
          </div>

          <label>Age *</label>

          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
          />

          <label>Gender *</label>

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <label>Phone</label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <label>Disease *</label>

          <input
            type="text"
            name="disease"
            value={form.disease}
            onChange={handleChange}
          />

          <label>Doctor *</label>

          <input
            type="text"
            name="doctor"
            value={form.doctor}
            onChange={handleChange}
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">
            {editingId ? "Update Patient" : "Register Patient"}
          </button>

          {editingId && (
            <button
              type="button"
              className="cancelBtn"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              Cancel
            </button>
          )}
        </form>

        {/* Search */}
        <div className="searchArea">
          <input
            type="text"
            placeholder="Search by name, doctor or disease..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status */}
        {loading && <p className="loading">Loading...</p>}

        {!loading && (
          <p className="updated">
            Last Updated : {lastUpdated}
          </p>
        )}

        {/* Patient Cards */}
        <div className="cardContainer">
          {patients.map((patient) => (
            <div key={patient.id} className="card">
              <div className="avatar">
                {initials(patient.name)}
              </div>

              <h3>{patient.name}</h3>

              <p>
                <strong>Age:</strong> {patient.age}
              </p>

              <p>
                <strong>Gender:</strong> {patient.gender}
              </p>

              <p>
                <strong>Disease:</strong> {patient.disease}
              </p>

              <p>
                <strong>Doctor:</strong> {patient.doctor}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {patient.phone || "-"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {patient.email || "-"}
              </p>

              <p>
                <strong>Admission:</strong>{" "}
                {patient.admission_date}
              </p>

              <div className="actions">
                <button
                  onClick={() => editPatient(patient)}
                >
                  Edit
                </button>

                <button
                  className="deleteBtn"
                  onClick={() =>
                    deletePatient(patient.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
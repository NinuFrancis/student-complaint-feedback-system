const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(helmet());
app.use(cors({ origin: allowedOrigin === "*" ? true : allowedOrigin.split(",").map(v => v.trim()) }));
app.use(express.json({ limit: "20kb" }));

let complaints = [
  {
    id: "CMP-DEMO-001",
    studentName: "Aarav Nair",
    studentId: "CSE2026-001",
    category: "Laboratory",
    title: "Lab system requires maintenance",
    description: "A few computers in the programming laboratory are not starting properly. Kindly arrange an inspection.",
    status: "In Progress",
    adminResponse: "The issue has been forwarded to the technical support team.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "CMP-DEMO-002",
    studentName: "Diya Thomas",
    studentId: "CSE2026-008",
    category: "Library",
    title: "Request for additional reference books",
    description: "Please consider adding more copies of the recommended data structures textbook.",
    status: "Resolved",
    adminResponse: "Additional copies have been requested.",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "CMP-DEMO-003",
    studentName: "Ishaan Kumar",
    studentId: "CSE2026-014",
    category: "Classroom",
    title: "Projector display is unclear",
    description: "The projector in the assigned classroom has a blurred display and is difficult to read from the back rows.",
    status: "Submitted",
    adminResponse: "",
    createdAt: new Date().toISOString()
  }
];

const validCategories = ["Academics", "Classroom", "Laboratory", "Library", "Hostel", "Transport", "Canteen", "Other"];
const validStatuses = ["Submitted", "In Progress", "Resolved"];

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "student-complaint-backend", timestamp: new Date().toISOString() });
});

app.get("/api/complaints", (req, res) => {
  const { status, category } = req.query;
  let result = [...complaints];
  if (status) result = result.filter(c => c.status === status);
  if (category) result = result.filter(c => c.category === category);
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ count: result.length, complaints: result });
});

app.get("/api/complaints/:id", (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });
  res.json({ complaint });
});

app.post("/api/complaints", (req, res) => {
  const { studentName, studentId, category, title, description } = req.body || {};
  if (![studentName, studentId, category, title, description].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!validCategories.includes(category)) return res.status(400).json({ message: "Invalid complaint category." });
  if (studentName.trim().length > 80 || studentId.trim().length > 30 || title.trim().length > 100 || description.trim().length > 1000) {
    return res.status(400).json({ message: "One or more fields exceed the allowed length." });
  }
  if (title.trim().length < 4 || description.trim().length < 10) {
    return res.status(400).json({ message: "Title must be at least 4 characters and description at least 10 characters." });
  }
  const complaint = {
    id: `CMP-${randomUUID().slice(0, 8).toUpperCase()}`,
    studentName: studentName.trim(),
    studentId: studentId.trim(),
    category,
    title: title.trim(),
    description: description.trim(),
    status: "Submitted",
    adminResponse: "",
    createdAt: new Date().toISOString()
  };
  complaints.unshift(complaint);
  res.status(201).json({ message: "Complaint submitted successfully.", complaint });
});

app.put("/api/complaints/:id", (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });
  const { status, adminResponse } = req.body || {};
  if (status !== undefined) {
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid complaint status." });
    complaint.status = status;
  }
  if (adminResponse !== undefined) {
    if (typeof adminResponse !== "string" || adminResponse.length > 500) {
      return res.status(400).json({ message: "Admin response must be text with a maximum of 500 characters." });
    }
    complaint.adminResponse = adminResponse.trim();
  }
  res.json({ message: "Complaint updated successfully.", complaint });
});

app.delete("/api/complaints/:id", (req, res) => {
  const index = complaints.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Complaint not found." });
  const [deleted] = complaints.splice(index, 1);
  res.json({ message: "Complaint deleted successfully.", complaint: deleted });
});

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Backend listening on port ${PORT}`));

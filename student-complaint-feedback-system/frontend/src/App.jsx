import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, CheckCircle2, ClipboardList, Filter, Plus,
  RefreshCw, Search, Send, ShieldCheck, Trash2, X
} from "lucide-react";

const categories = ["Academics", "Classroom", "Laboratory", "Library", "Hostel", "Transport", "Canteen", "Other"];
const statusOptions = ["Submitted", "In Progress", "Resolved"];

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function App() {
  const [complaints, setComplaints] = useState([]);
  const [view, setView] = useState("student");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ studentName: "", studentId: "", category: "Academics", title: "", description: "" });
  const [replyDrafts, setReplyDrafts] = useState({});

  async function loadComplaints() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/complaints");
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComplaints(); }, []);

  const stats = useMemo(() => ({
    total: complaints.length,
    submitted: complaints.filter(c => c.status === "Submitted").length,
    progress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length
  }), [complaints]);

  const visible = useMemo(() => complaints.filter(c => {
    const statusMatch = filter === "All" || c.status === filter;
    const text = `${c.title} ${c.studentName} ${c.studentId} ${c.category}`.toLowerCase();
    return statusMatch && text.includes(query.toLowerCase());
  }), [complaints, filter, query]);

  async function submitComplaint(event) {
    event.preventDefault();
    setNotice(""); setError("");
    try {
      await api("/complaints", { method: "POST", body: JSON.stringify(form) });
      setForm({ studentName: "", studentId: "", category: "Academics", title: "", description: "" });
      setNotice("Your complaint has been submitted successfully.");
      await loadComplaints();
    } catch (err) { setError(err.message); }
  }

  async function updateComplaint(id, updates) {
    setError(""); setNotice("");
    try {
      await api(`/complaints/${id}`, { method: "PUT", body: JSON.stringify(updates) });
      setNotice("Complaint updated.");
      await loadComplaints();
    } catch (err) { setError(err.message); }
  }

  async function deleteComplaint(id) {
    if (!window.confirm("Delete this complaint? This action cannot be undone.")) return;
    try {
      await api(`/complaints/${id}`, { method: "DELETE" });
      setNotice("Complaint deleted.");
      await loadComplaints();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Activity size={22} /></div>
          <div><strong>Campus Voice</strong><span>STUDENT GRIEVANCE PORTAL</span></div>
        </div>
        <div className="top-actions">
          <span className="system-status"><span className="status-dot" /> Service online</span>
          <button className="icon-button" onClick={loadComplaints} title="Refresh"><RefreshCw size={17} /></button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">YOUR VOICE MATTERS</div>
            <h1>Make campus <em>better.</em></h1>
            <p>Share an issue, track its progress, and help improve the student experience.</p>
          </div>
          <div className="hero-icon"><ShieldCheck size={58} strokeWidth={1.3} /></div>
        </section>

        <nav className="tabs" aria-label="Application views">
          <button className={view === "student" ? "tab active" : "tab"} onClick={() => setView("student")}> <Plus size={16}/> Submit a complaint</button>
          <button className={view === "admin" ? "tab active" : "tab"} onClick={() => setView("admin")}> <ClipboardList size={16}/> Admin dashboard</button>
        </nav>

        {error && <div className="alert error"><AlertCircle size={18}/>{error}<button onClick={() => setError("")}><X size={16}/></button></div>}
        {notice && <div className="alert success"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice("")}><X size={16}/></button></div>}

        <section className="stats-grid">
          <Stat label="Total complaints" value={stats.total} icon={<ClipboardList/>} />
          <Stat label="Submitted" value={stats.submitted} icon={<AlertCircle/>} />
          <Stat label="In progress" value={stats.progress} icon={<Activity/>} />
          <Stat label="Resolved" value={stats.resolved} icon={<CheckCircle2/>} />
        </section>

        {view === "student" ? (
          <div className="content-grid">
            <section className="panel form-panel">
              <div className="section-heading"><div><span className="eyebrow">STUDENT SERVICES</span><h2>Submit a complaint</h2></div><span className="step-number">01</span></div>
              <p className="muted">Please provide enough detail so the concerned team can understand and address the issue.</p>
              <form onSubmit={submitComplaint} className="complaint-form">
                <div className="field-row">
                  <Field label="Student name"><input required maxLength="80" value={form.studentName} onChange={e => setForm({...form, studentName:e.target.value})} placeholder="e.g. Ananya Menon"/></Field>
                  <Field label="Student ID / Roll number"><input required maxLength="30" value={form.studentId} onChange={e => setForm({...form, studentId:e.target.value})} placeholder="e.g. CSE2026-014"/></Field>
                </div>
                <Field label="Complaint category"><select value={form.category} onChange={e => setForm({...form, category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Complaint title"><input required minLength="4" maxLength="100" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="Briefly describe the issue"/></Field>
                <Field label="Description"><textarea required minLength="10" maxLength="1000" rows="5" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Explain what happened, where it happened, and any relevant details..."/></Field>
                <button className="primary-button" type="submit"><Send size={16}/> Submit complaint</button>
                <p className="form-footnote">Demo application: data is stored in backend memory and resets when the backend restarts.</p>
              </form>
            </section>
            <section className="panel tracking-panel">
              <div className="section-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Track complaints</h2></div><span className="count-pill">{complaints.length} records</span></div>
              <ComplaintList items={complaints.slice(0, 5)} empty="No complaints submitted yet." />
              <button className="text-button" onClick={() => setView("admin")}>View all complaints <span>→</span></button>
            </section>
          </div>
        ) : (
          <section className="panel admin-panel">
            <div className="section-heading admin-heading">
              <div><span className="eyebrow">MANAGEMENT CONSOLE</span><h2>Complaint overview</h2><p className="muted">Review submissions and update their status or response.</p></div>
              <span className="admin-tag"><ShieldCheck size={15}/> Admin view (demo)</span>
            </div>
            <div className="toolbar">
              <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, student or category"/></div>
              <div className="filter-box"><Filter size={16}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            {loading ? <p className="muted">Loading complaints...</p> : visible.length === 0 ? <div className="empty-state">No complaints match your search.</div> : (
              <div className="admin-list">{visible.map(c => (
                <article className="admin-card" key={c.id}>
                  <div className="admin-card-top">
                    <div><div className="record-meta">{c.category} <span>•</span> {c.id}</div><h3>{c.title}</h3><p className="muted">{c.studentName} · {c.studentId} · {new Date(c.createdAt).toLocaleString()}</p></div>
                    <Status status={c.status}/>
                  </div>
                  <p className="description">{c.description}</p>
                  <div className="admin-controls">
                    <label>Status <select value={c.status} onChange={e => updateComplaint(c.id, {status:e.target.value})}>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></label>
                    <label className="response-input">Admin response <input value={replyDrafts[c.id] ?? c.adminResponse ?? ""} onChange={e => setReplyDrafts({...replyDrafts, [c.id]:e.target.value})} placeholder="Write an update for the student"/></label>
                    <button className="small-button" onClick={() => updateComplaint(c.id, {adminResponse:replyDrafts[c.id] ?? c.adminResponse ?? ""})}>Save response</button>
                    <button className="delete-button" onClick={() => deleteComplaint(c.id)} title="Delete complaint"><Trash2 size={16}/></button>
                  </div>
                  {c.adminResponse && <div className="response-note"><strong>Current response:</strong> {c.adminResponse}</div>}
                </article>
              ))}</div>
            )}
          </section>
        )}
        <footer><span>Campus Voice · DevOps Internship Project</span><span>React · Node.js · Docker · GitHub Actions</span></footer>
      </main>
    </div>
  );
}

function Stat({label, value, icon}) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}
function Field({label, children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Status({status}) {
  const cls = status === "Resolved" ? "resolved" : status === "In Progress" ? "progress" : "submitted";
  return <span className={`status-badge ${cls}`}><i/> {status}</span>;
}
function ComplaintList({items, empty}) {
  if (!items.length) return <div className="empty-state">{empty}</div>;
  return <div className="recent-list">{items.map(c => <article className="recent-item" key={c.id}><div className="recent-marker"/><div className="recent-content"><div className="recent-title-row"><strong>{c.title}</strong><Status status={c.status}/></div><span>{c.category} · {c.id}</span><small>{new Date(c.createdAt).toLocaleDateString()}</small></div></article>)}</div>;
}

export default App;

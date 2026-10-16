
"use client";

import { useMemo, useState } from "react";

type Student = {
  id: number;
  name: string;
  course: string;
  year: string;
  status: "Present" | "Absent" | "Late";
};

const initialStudents: Student[] = [
  { id: 1, name: "Alex Santos", course: "BSIT", year: "3rd Year", status: "Present" },
  { id: 2, name: "Maria Reyes", course: "BSIT", year: "2nd Year", status: "Late" },
  { id: 3, name: "John Cruz", course: "BSCS", year: "1st Year", status: "Absent" },
  { id: 4, name: "Angela Garcia", course: "BSIT", year: "4th Year", status: "Present" },
  { id: 5, name: "Mark Dela Cruz", course: "BSCS", year: "3rd Year", status: "Present" },
];

export default function Home() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("BSIT");
  const [year, setYear] = useState("1st Year");
  const [notice, setNotice] = useState("");

  const today = new Date().toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const counts = {
    total: students.length,
    present: students.filter((s) => s.status === "Present").length,
    absent: students.filter((s) => s.status === "Absent").length,
    late: students.filter((s) => s.status === "Late").length,
  };

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.course.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filter === "All" || student.status === filter;
        return matchesSearch && matchesStatus;
      }),
    [students, search, filter]
  );

  function updateStatus(id: number, status: Student["status"]) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, status } : student
      )
    );
    setNotice("Attendance status updated.");
  }

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    setStudents((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((s) => s.id)) + 1,
        name: name.trim(),
        course,
        year,
        status: "Absent",
      },
    ]);
    setName("");
    setCourse("BSIT");
    setYear("1st Year");
    setShowForm(false);
    setNotice("Student added successfully.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">SM</div>
          <div>
            <strong>StudentTrack</strong>
            <span>Monitoring System</span>
          </div>
        </div>

        <p className="nav-label">MENU</p>
        <a className="nav-item active" href="#dashboard">▦ <span>Dashboard</span></a>
        <a className="nav-item" href="#students">♙ <span>Students</span></a>
        <a className="nav-item" href="#attendance">✓ <span>Attendance</span></a>

        <div className="sidebar-bottom">
          <div className="profile-avatar">AD</div>
          <div className="profile-info">
            <strong>Administrator</strong>
            <span>School Admin</span>
          </div>
        </div>
      </aside>

      <section className="main-area" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">SCHOOL MANAGEMENT</p>
            <h1>Student Dashboard</h1>
            <p className="subtitle">Monitor student records and daily attendance.</p>
          </div>
          <div className="date-chip">▦ {today}</div>
        </header>

        <section className="welcome-panel">
          <div>
            <p className="welcome-small">WELCOME BACK!</p>
            <h2>Keep your students on track.</h2>
            <p>View student information and manage attendance in one place.</p>
          </div>
          <div className="welcome-symbol">▤</div>
        </section>

        <section className="stats-grid" aria-label="Attendance summary">
          <article className="stat-card">
            <div className="stat-top"><span>Total Students</span><span className="stat-icon blue">♙</span></div>
            <strong>{counts.total}</strong>
            <small>Registered students</small>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Present</span><span className="stat-icon green">✓</span></div>
            <strong>{counts.present}</strong>
            <small>Marked present today</small>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Absent</span><span className="stat-icon red">×</span></div>
            <strong>{counts.absent}</strong>
            <small>Marked absent today</small>
          </article>
          <article className="stat-card">
            <div className="stat-top"><span>Late</span><span className="stat-icon orange">◷</span></div>
            <strong>{counts.late}</strong>
            <small>Arrived late today</small>
          </article>
        </section>

        <section className="student-panel" id="students">
          <div className="panel-heading">
            <div>
              <h2>Student Records</h2>
              <p>Search students and update their attendance status.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(!showForm)}>
              + Add Student
            </button>
          </div>

          {notice && <p className="notice" role="status">{notice}</p>}

          {showForm && (
            <form className="student-form" onSubmit={addStudent}>
              <label>
                Student name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" required />
              </label>
              <label>
                Course
                <select value={course} onChange={(e) => setCourse(e.target.value)}>
                  <option>BSIT</option>
                  <option>BSCS</option>
                  <option>BSIS</option>
                  <option>BSEd</option>
                </select>
              </label>
              <label>
                Year level
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </label>
              <button className="primary-button" type="submit">Save Student</button>
            </form>
          )}

          <div className="toolbar" id="attendance">
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="⌕  Search by student or course..."
              aria-label="Search students"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter attendance">
              <option>All</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>COURSE</th>
                  <th>YEAR LEVEL</th>
                  <th>ATTENDANCE</th>
                  <th>UPDATE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-name">
                        <span className="student-avatar">{student.name.charAt(0).toUpperCase()}</span>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td>{student.course}</td>
                    <td>{student.year}</td>
                    <td><span className={`status ${student.status.toLowerCase()}`}>{student.status}</span></td>
                    <td>
                      <select
                        className="status-select"
                        value={student.status}
                        onChange={(e) => updateStatus(student.id, e.target.value as Student["status"])}
                        aria-label={`Update attendance for ${student.name}`}
                      >
                        <option>Present</option>
                        <option>Absent</option>
                        <option>Late</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No students found. Try another search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="table-footer">Showing {filteredStudents.length} of {students.length} students</p>
        </section>

        <footer className="footer">
          <span>StudentTrack · Student Monitoring System</span>
          <span>Dashboard demo · {new Date().getFullYear()}</span>
        </footer>
      </section>
    </main>
  );
          }


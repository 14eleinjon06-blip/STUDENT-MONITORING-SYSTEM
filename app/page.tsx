"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Student = { id: string; name: string; section: string; status: "Present" | "Absent" };
type RecordEntry = { studentId: string; date: string; status: "Present" | "Absent" };

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [panel, setPanel] = useState<"students" | "attendance" | "report" | null>(null);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [section, setSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [status, setStatus] = useState<"Present" | "Absent">("Present");
  const [date, setDate] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    try {
      setStudents(JSON.parse(localStorage.getItem("sms_students") || "[]"));
      setRecords(JSON.parse(localStorage.getItem("sms_records") || "[]"));
    } catch {
      setStudents([]);
      setRecords([]);
    }
  }, []);

  const todayRecords = records.filter((record) => record.date === date);
  const reportRecords = useMemo(
    () => records.filter((record) => !date || record.date === date).slice().reverse(),
    [records, date]
  );

  function persist(nextStudents: Student[], nextRecords: RecordEntry[]) {
    setStudents(nextStudents);
    setRecords(nextRecords);
    localStorage.setItem("sms_students", JSON.stringify(nextStudents));
    localStorage.setItem("sms_records", JSON.stringify(nextRecords));
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = studentId.trim();
    if (!id || !studentName.trim() || students.some((student) => student.id.toLowerCase() === id.toLowerCase())) return;
    persist([...students, { id, name: studentName.trim(), section: section.trim(), status: "Absent" }], records);
    setStudentId("");
    setStudentName("");
    setSection("");
  }

  function saveAttendance() {
    if (!selectedStudent || !date) return;
    const next = records.filter((record) => !(record.studentId === selectedStudent && record.date === date));
    next.push({ studentId: selectedStudent, date, status });
    persist(students.map((student) => student.id === selectedStudent ? { ...student, status } : student), next);
  }

  return (
    <main className="phone">
      <div className="status-bar"><span className="clock">12:30</span><span aria-hidden="true">◆ ◕ ▰</span></div>
      <header className="app-bar"><h1>Screen1</h1><button className="menu-button" aria-label="About" onClick={() => setPanel(null)}>⋮</button></header>
      <div className="screen-content">
        <div className="screen-heading">STUDENT MONITORING SYSTEM</div>
        <section className="summary" aria-live="polite">
          <p>TOTAL STUDENTS: <strong>{students.length}</strong></p>
          <p>PRESENT: <strong>{todayRecords.filter((record) => record.status === "Present").length}</strong></p>
          <p>ABSENT: <strong>{todayRecords.filter((record) => record.status === "Absent").length}</strong></p>
        </section>
        <div className="image-placeholder" aria-hidden="true">
          <svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="3" fill="currentColor"/><circle cx="27" cy="13" r="4" fill="#f5f4ee"/><path d="M5 32 15 20l6 7 5-5 9 10Z" fill="#f5f4ee"/></svg>
        </div>
        <nav className="home-actions" aria-label="Student monitoring">
          <button onClick={() => setPanel(panel === "students" ? null : "students")}>STUDENT INFORMATION</button>
          <button onClick={() => setPanel(panel === "attendance" ? null : "attendance")}>RECORD ATTENDANCE</button>
          <button onClick={() => setPanel(panel === "report" ? null : "report")}>VIEW ATTENDANCE REPORT</button>
        </nav>
        {panel === "students" && <section className="detail-panel">
          <h2>Student Information</h2>
          <form onSubmit={addStudent}>
            <label>Student ID<input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="e.g. 2026-001" required /></label>
            <label>Full Name<input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Enter full name" required /></label>
            <label>Course / Section<input value={section} onChange={(event) => setSection(event.target.value)} placeholder="e.g. BSIT-3A" /></label>
            <button className="primary-action" type="submit">ADD STUDENT</button>
          </form>
          <h3>Registered Students</h3>
          {students.length ? students.map((student) => <div className="list-row" key={student.id}><span><strong>{student.name}</strong><small>{student.id} · {student.section || "No section"}</small></span><span>{student.status}</span></div>) : <p className="empty-message">No students added yet.</p>}
        </section>}
        {panel === "attendance" && <section className="detail-panel">
          <h2>Record Attendance</h2>
          <label>Select Student<select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.id})</option>)}</select></label>
          <label>Attendance Status<select value={status} onChange={(event) => setStatus(event.target.value as "Present" | "Absent")}><option>Present</option><option>Absent</option></select></label>
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="primary-action" onClick={saveAttendance}>SAVE ATTENDANCE</button>
        </section>}
        {panel === "report" && <section className="detail-panel">
          <h2>Attendance Report</h2>
          <label>Filter by date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          {reportRecords.length ? reportRecords.map((record, index) => {
            const student = students.find((item) => item.id === record.studentId);
            return <div className="list-row" key={record.studentId + record.date + index}><span><strong>{student?.name || record.studentId}</strong><small>{record.date}</small></span><span>{record.status}</span></div>;
          }) : <p className="empty-message">No attendance records for this date.</p>}
          <button className="secondary-action" onClick={() => setDate("")}>SHOW ALL RECORDS</button>
        </section>}
        <footer>Student Monitoring System</footer>
      </div>
    </main>
  );
}

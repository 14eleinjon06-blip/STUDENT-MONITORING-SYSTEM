"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type AttendanceStatus = "Present" | "Absent";
type Student = {
  id: number;
  name: string;
  studentNo: string;
  course: string;
  year: string;
  photo: string;
};
type AttendanceRecord = {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  status: AttendanceStatus;
};

const STUDENTS_KEY = "student-monitoring-students-v2";
const ATTENDANCE_KEY = "student-monitoring-attendance-v2";

function todayString() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState("students");
  const [search, setSearch] = useState("");
  const [reportDate, setReportDate] = useState(todayString());
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [course, setCourse] = useState("BSIT");
  const [year, setYear] = useState("1st Year");
  const [photo, setPhoto] = useState("");
  const [notice, setNotice] = useState("");
  const [scanMode, setScanMode] = useState<"face" | "id">("id");
  const [scanValue, setScanValue] = useState("");
  const [scanStudentId, setScanStudentId] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    try {
      const savedStudents = localStorage.getItem(STUDENTS_KEY);
      const savedAttendance = localStorage.getItem(ATTENDANCE_KEY);
      if (savedStudents) setStudents(JSON.parse(savedStudents));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    } catch {
      setNotice("Saved data could not be loaded. You can still add student records.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  }, [students, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
  }, [attendance, ready]);

  useEffect(() => {
    if (!cameraOpen) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    async function startCamera() {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError("Camera access was blocked or is unavailable. Allow camera permission and try again.");
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  const today = todayString();
  const todayRecords = attendance.filter((record) => record.date === today);
  const presentCount = todayRecords.filter((record) => record.status === "Present").length;
  const absentCount = todayRecords.filter((record) => record.status === "Absent").length;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) =>
      [student.name, student.studentNo, student.course, student.year].some((value) => value.toLowerCase().includes(query))
    );
  }, [students, search]);

  const reportRecords = attendance
    .filter((record) => record.date === reportDate)
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file for the student picture.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice("Please choose a picture smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    if (students.some((student) => student.studentNo && student.studentNo.toLowerCase() === studentNo.trim().toLowerCase())) {
      setNotice("That student number is already registered.");
      return;
    }
    const student: Student = {
      id: Date.now(),
      name: name.trim(),
      studentNo: studentNo.trim(),
      course,
      year,
      photo,
    };
    setStudents((current) => [...current, student]);
    setName("");
    setStudentNo("");
    setCourse("BSIT");
    setYear("1st Year");
    setPhoto("");
    setFormOpen(false);
    setNotice("Student information saved.");
  }

  function markAttendance(student: Student, status: AttendanceStatus) {
    setAttendance((current) => {
      const existing = current.find((record) => record.studentId === student.id && record.date === today);
      if (existing) {
        return current.map((record) =>
          record.id === existing.id ? { ...record, status, studentName: student.name } : record
        );
      }
      return [...current, {
        id: Date.now() + student.id,
        studentId: student.id,
        studentName: student.name,
        date: today,
        status,
      }];
    });
    setNotice(student.name + " marked " + status.toLowerCase() + " for today.");
  }

  function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = scanValue.trim().toLowerCase();
    if (!query) { setNotice("Enter or scan a student ID first."); return; }
    const student = students.find((item) => item.studentNo.trim().toLowerCase() === query);
    if (!student) { setNotice("Student ID not found. Register the student first or check the ID number."); return; }
    markAttendance(student, "Present");
    setScanValue("");
  }

  function confirmFaceMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const student = students.find((item) => String(item.id) === scanStudentId);
    if (!student) { setNotice("Select the registered student that matches the person in the camera."); return; }
    markAttendance(student, "Present");
    setScanStudentId("");
  }

  function deleteStudent(student: Student) {
    if (!window.confirm("Delete " + student.name + " and their attendance records?")) return;
    setStudents((current) => current.filter((item) => item.id !== student.id));
    setAttendance((current) => current.filter((item) => item.studentId !== student.id));
    setNotice("Student record deleted.");
  }

  function navTo(section: string) {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={() => setActiveSection("students")} aria-label="Student Monitoring System home">
          <span className="brand-mark">SM</span>
          <span className="brand-name">Student Monitoring System<small>STUDENT RECORDS & ATTENDANCE</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeSection === "students" ? "nav-link active" : "nav-link"} onClick={() => navTo("students")}>Student Information</button>
          <button className={activeSection === "record" ? "nav-link active" : "nav-link"} onClick={() => navTo("record")}>Record Attendance</button>
          <button className={activeSection === "reports" ? "nav-link active" : "nav-link"} onClick={() => navTo("reports")}>View Attendance Report</button>
        </nav>
      </header>

      <div className="page-content" id="top">
        <section className="intro">
          <div>
            <p className="eyebrow">STUDENT OVERVIEW</p>
            <h1>Student Monitoring System</h1>
            <p className="intro-text">Manage student profiles, record daily attendance, and review attendance reports in one place.</p>
          </div>
          <div className="date-pill"><span className="date-dot" /> {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</div>
        </section>

        {notice && <div className="notice" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

        <section className="stats-grid" aria-label="Student attendance summary">
          <article className="stat-card total-card">
            <div className="stat-label"><span className="stat-symbol">♙</span>Total Student</div>
            <strong>{students.length}</strong>
            <p>Registered student records</p>
          </article>
          <article className="stat-card present-card">
            <div className="stat-label"><span className="stat-symbol">✓</span>Present</div>
            <strong>{presentCount}</strong>
            <p>Marked present today</p>
          </article>
          <article className="stat-card absent-card">
            <div className="stat-label"><span className="stat-symbol">×</span>Absent</div>
            <strong>{absentCount}</strong>
            <p>Marked absent today</p>
          </article>
        </section>

        <section className="content-panel" id="students">
          <div className="section-heading">
            <div><p className="eyebrow">STUDENT DIRECTORY</p><h2>Student Information</h2><p>Student pictures and basic information appear here after you add a student.</p></div>
            <button className="primary-button" onClick={() => { setFormOpen((open) => !open); setActiveSection("students"); }}>
              <span>{formOpen ? "−" : "+"}</span> {formOpen ? "Close Form" : "Add Student"}
            </button>
          </div>

          {formOpen && <form className="student-form" onSubmit={addStudent}>
            <div className="photo-upload">
              {photo ? <img src={photo} alt="Student preview" className="photo-preview" /> : <div className="photo-placeholder">＋<small>Student photo</small></div>}
              <label className="upload-button">Upload picture<input type="file" accept="image/*" onChange={handlePhoto} /></label>
              <small>Image file, max 2 MB</small>
            </div>
            <div className="form-fields">
              <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter student full name" required /></label>
              <label>Student number<input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="Enter student number" /></label>
              <label>Course / Program<select value={course} onChange={(event) => setCourse(event.target.value)}><option>BSIT</option><option>BSCS</option><option>BSIS</option><option>BSEd</option><option>BEEd</option><option>Other</option></select></label>
              <label>Year level<select value={year} onChange={(event) => setYear(event.target.value)}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option></select></label>
              <button type="submit" className="primary-button save-button">Save Student Information</button>
            </div>
          </form>}

          <div className="list-toolbar">
            <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student name, number, or course..." aria-label="Search students" /></label>
            <span className="record-count">{filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}</span>
          </div>

          {filteredStudents.length === 0 ? <div className="empty-state">
            <div className="empty-icon">♙</div><h3>{students.length === 0 ? "No students added yet" : "No matching students"}</h3>
            <p>{students.length === 0 ? "Select “Add Student” to create a profile and upload a student picture." : "Try another search term."}</p>
            {students.length === 0 && <button className="secondary-button" onClick={() => setFormOpen(true)}>＋ Add your first student</button>}
          </div> : <div className="student-grid">
            {filteredStudents.map((student) => <article className="student-card" key={student.id}>
              {student.photo ? <img src={student.photo} alt={student.name} className="student-photo" /> : <div className="student-photo photo-initial">{student.name.charAt(0).toUpperCase()}</div>}
              <div className="student-details"><h3>{student.name}</h3><p>{student.studentNo || "No student number"}</p><div className="student-tags"><span>{student.course}</span><span>{student.year}</span></div></div>
              <button className="delete-button" onClick={() => deleteStudent(student)} aria-label={"Delete " + student.name} title="Delete student">×</button>
            </article>)}
          </div>}
        </section>

        <section className="content-panel" id="scan">
          <div className="section-heading">
            <div><p className="eyebrow">QUICK VERIFICATION</p><h2>Face Scan & Student ID Scan</h2><p>Verify a registered student and mark them present for today.</p></div>
            <span className="today-badge">Attendance scanner</span>
          </div>
          <div className="scanner-panel">
            <div className="scanner-tabs" role="tablist" aria-label="Scan method">
              <button type="button" className={scanMode === "face" ? "scanner-tab active" : "scanner-tab"} onClick={() => { setScanMode("face"); setCameraOpen(false); }}>◉ Face Scan</button>
              <button type="button" className={scanMode === "id" ? "scanner-tab active" : "scanner-tab"} onClick={() => { setScanMode("id"); setCameraOpen(false); }}>▤ Student ID Scan</button>
            </div>
            {scanMode === "id" ? <div className="scanner-content">
              <div className="scanner-icon">▤</div>
              <div className="scanner-copy"><h3>Scan or enter student ID</h3><p>Use a USB barcode/QR scanner that types into the field, or enter the student number printed on the ID card.</p></div>
              <form className="scan-form" onSubmit={submitScan}>
                <label htmlFor="scan-student-id">Student ID number</label>
                <div className="scan-input-row"><input id="scan-student-id" value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Scan or type student ID" autoComplete="off" required /><button type="submit" className="primary-button">Verify & Check In</button></div>
              </form>
              <p className="scanner-note">The ID must match a student number already saved in Student Information.</p>
            </div> : <div className="scanner-content face-scan-content">
              <div className="camera-frame">
                {cameraOpen ? <video ref={videoRef} autoPlay playsInline muted aria-label="Live face scan camera" /> : <div className="camera-placeholder"><span>◉</span><strong>Camera preview</strong><small>Allow camera access to begin</small></div>}
                {cameraOpen && <div className="face-guide" aria-hidden="true" />}
              </div>
              {cameraError && <p className="camera-error" role="alert">{cameraError}</p>}
              <div className="scanner-copy"><h3>Face scan assistance</h3><p>Open the camera, then select the registered student whose face you have verified. This version does not automatically identify faces; it records attendance only after you confirm the match.</p></div>
              {!cameraOpen ? <button type="button" className="primary-button" onClick={() => setCameraOpen(true)}>Open Camera</button> : <button type="button" className="secondary-button" onClick={() => setCameraOpen(false)}>Stop Camera</button>}
              <form className="scan-form" onSubmit={confirmFaceMatch}>
                <label htmlFor="face-student-match">Confirm registered student</label>
                <div className="scan-input-row"><select id="face-student-match" value={scanStudentId} onChange={(event) => setScanStudentId(event.target.value)} required><option value="">Select matching student</option>{students.map((student) => <option key={student.id} value={String(student.id)}>{student.name} — {student.studentNo || "No ID"}</option>)}</select><button type="submit" className="primary-button">Confirm & Check In</button></div>
              </form>
            </div>}
          </div>
        </section>

        <section className="content-panel" id="record">
          <div className="section-heading">
            <div><p className="eyebrow">DAILY CLASS RECORD</p><h2>Record Attendance</h2><p>Choose Present or Absent for each student. You can update the status anytime today.</p></div>
            <span className="today-badge">{new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          {students.length === 0 ? <div className="compact-empty">Add student information first before recording attendance.</div> : <div className="attendance-list">
            {students.map((student) => {
              const record = todayRecords.find((item) => item.studentId === student.id);
              return <div className="attendance-row" key={student.id}>
                {student.photo ? <img src={student.photo} alt="" className="mini-photo" /> : <div className="mini-photo mini-initial">{student.name.charAt(0).toUpperCase()}</div>}
                <div className="attendance-person"><strong>{student.name}</strong><span>{student.studentNo || student.course + " · " + student.year}</span></div>
                <span className={record ? "attendance-status " + record.status.toLowerCase() : "attendance-status unmarked"}>{record?.status || "Not marked"}</span>
                <div className="attendance-actions"><button className={record?.status === "Present" ? "mark-button present selected" : "mark-button present"} onClick={() => markAttendance(student, "Present")}>✓ Present</button><button className={record?.status === "Absent" ? "mark-button absent selected" : "mark-button absent"} onClick={() => markAttendance(student, "Absent")}>× Absent</button></div>
              </div>;
            })}
          </div>}
        </section>

        <section className="content-panel" id="reports">
          <div className="section-heading report-heading">
            <div><p className="eyebrow">ATTENDANCE HISTORY</p><h2>View Attendance Report</h2><p>Choose a date to see attendance records saved for that day.</p></div>
            <label className="date-field">Report date<input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} /></label>
          </div>
          <div className="report-summary">
            <div><span>Records for selected date</span><strong>{reportRecords.length}</strong></div>
            <div><span>Present</span><strong className="report-present">{reportRecords.filter((item) => item.status === "Present").length}</strong></div>
            <div><span>Absent</span><strong className="report-absent">{reportRecords.filter((item) => item.status === "Absent").length}</strong></div>
          </div>
          {reportRecords.length === 0 ? <div className="compact-empty">No attendance records for this date yet.</div> : <div className="report-table-wrap"><table className="report-table"><thead><tr><th>STUDENT</th><th>DATE</th><th>ATTENDANCE</th></tr></thead><tbody>{reportRecords.map((record) => {
            const student = students.find((item) => item.id === record.studentId);
            return <tr key={record.id}><td><div className="report-student">{student?.photo ? <img src={student.photo} alt="" /> : <span className="report-initial">{record.studentName.charAt(0).toUpperCase()}</span>}<strong>{record.studentName}</strong></div></td><td>{record.date}</td><td><span className={"attendance-status " + record.status.toLowerCase()}>{record.status}</span></td></tr>;
          })}</tbody></table></div>}
        </section>

        <footer className="page-footer"><span>Student Monitoring System</span><span>Student information · Attendance · Reports</span></footer>
      </div>
    </main>
  );
}

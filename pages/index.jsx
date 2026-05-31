import { useState, useEffect } from "react";
import Head from "next/head";

const DEFAULT_STAFF = [
  { id: "EMP001", name: "John", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP002", name: "Alex", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP003", name: "David", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP004", name: "Sam", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP005", name: "Maria", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP006", name: "Lisa", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP007", name: "Tom", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP008", name: "Nina", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP009", name: "Omar", morning: 0, evening: 0, night: 0, lastNightWeek: null },
  { id: "EMP010", name: "Peter", morning: 0, evening: 0, night: 0, lastNightWeek: null },
];

const STORAGE_KEY = "duty_mgmt_v3";

function totalPoints(emp) {
  return emp.morning * 1 + emp.evening * 2 + emp.night * 3;
}

function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export default function Home() {
  const [state, setState] = useState({
    staff: JSON.parse(JSON.stringify(DEFAULT_STAFF)),
    week: 0,
    schedules: [],
    log: [],
  });
  const [tab, setTab] = useState("dashboard");
  const [alert, setAlert] = useState(null);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [state, hydrated]);

  function showAlert(msg, type = "success") {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  }

  function getName(id) {
    const e = state.staff.find((s) => s.id === id);
    return e ? e.name : id;
  }

  function runWeek() {
    if (state.staff.length < 10) {
      showAlert("Need at least 10 staff members.", "danger");
      return;
    }
    const week = state.week + 1;
    const staff = state.staff;

    // Night: filter those who haven't had night, else all
    let eligible = staff.filter((e) => e.lastNightWeek === null);
    if (eligible.length === 0) eligible = [...staff];
    eligible.sort(
      (a, b) =>
        totalPoints(a) - totalPoints(b) ||
        (a.lastNightWeek || 0) - (b.lastNightWeek || 0)
    );
    const nightIds = eligible.slice(0, 2).map((e) => e.id);

    // Evening: from remaining, pick lowest 3
    const rem1 = staff.filter((e) => !nightIds.includes(e.id));
    rem1.sort((a, b) => totalPoints(a) - totalPoints(b));
    const eveningIds = rem1.slice(0, 3).map((e) => e.id);

    // Morning: rest
    const morningIds = staff
      .filter((e) => !nightIds.includes(e.id) && !eveningIds.includes(e.id))
      .map((e) => e.id);

    const newStaff = staff.map((emp) => {
      const e = { ...emp };
      if (nightIds.includes(e.id)) { e.night++; e.lastNightWeek = week; }
      else if (eveningIds.includes(e.id)) e.evening++;
      else e.morning++;
      return e;
    });

    const schedule = { week, morning: morningIds, evening: eveningIds, night: nightIds };
    const newLog = [
      ...morningIds.map((id) => ({ week, empId: id, shift: "Morning" })),
      ...eveningIds.map((id) => ({ week, empId: id, shift: "Evening" })),
      ...nightIds.map((id) => ({ week, empId: id, shift: "Night" })),
    ];

    setState((s) => ({
      ...s,
      staff: newStaff,
      week,
      schedules: [...s.schedules, schedule],
      log: [...s.log, ...newLog],
    }));
    showAlert(`Week ${week} schedule generated!`);
  }

  function resetAll() {
    if (!window.confirm("Reset all data and start fresh?")) return;
    setState({
      staff: JSON.parse(JSON.stringify(DEFAULT_STAFF)),
      week: 0,
      schedules: [],
      log: [],
    });
    showAlert("Data reset successfully.");
  }

  function addEmployee() {
    if (!newName.trim() || !newId.trim()) return;
    if (state.staff.find((e) => e.id === newId.trim())) {
      showAlert("ID already exists", "danger");
      return;
    }
    setState((s) => ({
      ...s,
      staff: [
        ...s.staff,
        { id: newId.trim(), name: newName.trim(), morning: 0, evening: 0, night: 0, lastNightWeek: null },
      ],
    }));
    setNewName("");
    setNewId("");
    showAlert(`${newName.trim()} added!`);
  }

  const cur = state.schedules[state.schedules.length - 1];
  const maxPts = Math.max(1, ...state.staff.map((e) => totalPoints(e)));
  const sortedStaff = [...state.staff].sort((a, b) => totalPoints(a) - totalPoints(b));
  const nightDone = state.staff.filter((e) => e.lastNightWeek !== null).length;

  const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "schedule", label: "Schedule history" },
    { key: "staff", label: "Staff & points" },
    { key: "history", label: "Duty log" },
  ];

  return (
    <>
      <Head>
        <title>Staff Duty Management</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #F4F3EF; color: #1a1a18; min-height: 100vh; }
        .app { max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .header { margin-bottom: 2.5rem; }
        .header h1 { font-size: 26px; font-weight: 600; color: #1a1a18; letter-spacing: -0.5px; }
        .header p { font-size: 14px; color: #888780; margin-top: 4px; }
        .tabs { display: flex; gap: 6px; margin-bottom: 2rem; background: #e8e6e0; padding: 4px; border-radius: 10px; width: fit-content; }
        .tab-btn { padding: 7px 18px; border-radius: 8px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; color: #5F5E5A; transition: all 0.15s; font-family: inherit; }
        .tab-btn.active { background: #fff; color: #1a1a18; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .card { background: #fff; border: 0.5px solid #e0ddd6; border-radius: 14px; padding: 1.5rem; margin-bottom: 1rem; }
        .card-title { font-size: 14px; font-weight: 600; color: #1a1a18; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 640px) { .grid3 { grid-template-columns: 1fr; } .grid4 { grid-template-columns: 1fr 1fr; } }
        table { width: 100%; font-size: 13px; border-collapse: collapse; }
        th { text-align: left; padding: 8px 12px; color: #888780; font-weight: 500; border-bottom: 0.5px solid #e8e6e0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
        td { padding: 10px 12px; border-bottom: 0.5px solid #f0ede8; color: #1a1a18; font-size: 13px; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafaf8; }
        .stat-card { background: #F9F8F5; border-radius: 10px; padding: 1.25rem 1rem; }
        .stat-label { font-size: 12px; color: #888780; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
        .stat-value { font-size: 28px; font-weight: 600; color: #1a1a18; letter-spacing: -1px; }
        .btn { padding: 9px 20px; border-radius: 8px; border: 0.5px solid #d3d1c7; font-size: 13px; cursor: pointer; background: #fff; color: #1a1a18; font-weight: 500; font-family: inherit; transition: all 0.12s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover { background: #f4f3ef; }
        .btn-primary { background: #1a1a18; color: #fff; border-color: #1a1a18; }
        .btn-primary:hover { background: #333; }
        .btn-danger { background: #fff; color: #A32D2D; border-color: #f0c0c0; }
        .btn-danger:hover { background: #fdf5f5; }
        .schedule-col { border-radius: 10px; padding: 1rem; }
        .col-morning { background: #FAEEDA55; border: 0.5px solid #EF9F2750; }
        .col-evening { background: #E6F1FB55; border: 0.5px solid #378ADD50; }
        .col-night { background: #EEEDFE55; border: 0.5px solid #7F77DD50; }
        .col-header { font-size: 12px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .col-morning .col-header { color: #854F0B; }
        .col-evening .col-header { color: #185FA5; }
        .col-night .col-header { color: #3C3489; }
        .staff-chip { font-size: 13px; padding: 5px 12px; border-radius: 20px; background: #fff; border: 0.5px solid #e0ddd6; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; color: #1a1a18; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dot-m { background: #EF9F27; }
        .dot-e { background: #378ADD; }
        .dot-n { background: #7F77DD; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .badge-morning { background: #FAEEDA; color: #854F0B; }
        .badge-evening { background: #E6F1FB; color: #185FA5; }
        .badge-night { background: #EEEDFE; color: #3C3489; }
        .points-bar { height: 4px; border-radius: 2px; background: #e8e6e0; overflow: hidden; margin-top: 4px; }
        .points-fill { height: 100%; border-radius: 2px; background: #1a1a18; transition: width 0.4s ease; }
        .alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 1.25rem; font-weight: 500; }
        .alert-success { background: #EAF3DE; color: #27500A; border: 0.5px solid #97C45950; }
        .alert-danger { background: #FCEBEB; color: #A32D2D; border: 0.5px solid #F0959550; }
        .input-row { display: flex; gap: 8px; flex-wrap: wrap; }
        input[type="text"] { flex: 1; min-width: 160px; padding: 9px 14px; border-radius: 8px; border: 0.5px solid #d3d1c7; background: #fafaf8; color: #1a1a18; font-size: 13px; font-family: inherit; outline: none; }
        input[type="text"]:focus { border-color: #888780; background: #fff; }
        .week-tag { font-size: 11px; background: #f0ede8; border-radius: 6px; padding: 2px 8px; color: #5F5E5A; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 0.5rem; }
        .log-item { font-size: 13px; color: #5F5E5A; padding: 8px 0; border-bottom: 0.5px solid #f0ede8; display: flex; align-items: center; gap: 10px; }
        .log-item:last-child { border-bottom: none; }
        .empty-state { text-align: center; padding: 3rem 1rem; color: #888780; font-size: 14px; }
        .rule-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px solid #f0ede8; font-size: 13px; }
        .rule-row:last-child { border-bottom: none; }
        .rank-num { width: 24px; height: 24px; border-radius: 50%; background: #f0ede8; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #5F5E5A; flex-shrink: 0; }
        .section-divider { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888780; margin: 1.5rem 0 0.75rem; }
      `}</style>

      <div className="app">
        <div className="header">
          <h1>Staff duty management</h1>
          <p>Point-based fair shift allocation · Morning 1pt · Evening 2pts · Night 3pts</p>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
        )}

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="grid4" style={{ marginBottom: "1rem" }}>
              <div className="stat-card">
                <div className="stat-label">Total staff</div>
                <div className="stat-value">{state.staff.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Current week</div>
                <div className="stat-value">{state.week}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Had night shift</div>
                <div className="stat-value">{nightDone}/{state.staff.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total schedules</div>
                <div className="stat-value">{state.schedules.length}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <span className="dot dot-n" />
                {cur ? `Week ${cur.week} — current assignment` : "No schedule yet"}
              </div>
              {cur ? (
                <div className="grid3">
                  <div className="schedule-col col-morning">
                    <div className="col-header"><span className="dot dot-m" />Morning ({cur.morning.length})</div>
                    {cur.morning.map((id) => (
                      <div key={id} className="staff-chip"><span className="dot dot-m" />{getName(id)}</div>
                    ))}
                  </div>
                  <div className="schedule-col col-evening">
                    <div className="col-header"><span className="dot dot-e" />Evening ({cur.evening.length})</div>
                    {cur.evening.map((id) => (
                      <div key={id} className="staff-chip"><span className="dot dot-e" />{getName(id)}</div>
                    ))}
                  </div>
                  <div className="schedule-col col-night">
                    <div className="col-header"><span className="dot dot-n" />Night ({cur.night.length})</div>
                    {cur.night.map((id) => (
                      <div key={id} className="staff-chip"><span className="dot dot-n" />{getName(id)}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">Click "Generate next week" to create the first schedule.</div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Point standings (lowest = next priority)</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Total pts</th>
                    <th>Last night</th>
                    <th style={{ width: "120px" }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStaff.map((emp, i) => {
                    const pts = totalPoints(emp);
                    const pct = Math.round((pts / maxPts) * 100);
                    return (
                      <tr key={emp.id}>
                        <td><span className="rank-num">{i + 1}</span></td>
                        <td>
                          <strong>{emp.name}</strong>{" "}
                          <span style={{ fontSize: "11px", color: "#888780" }}>{emp.id}</span>
                        </td>
                        <td><strong>{pts}</strong></td>
                        <td>
                          {emp.lastNightWeek
                            ? <span className="week-tag">Week {emp.lastNightWeek}</span>
                            : <span style={{ fontSize: "12px", color: "#b4b2a9" }}>none yet</span>}
                        </td>
                        <td>
                          <div className="points-bar">
                            <div className="points-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="actions">
              <button className="btn btn-primary" onClick={runWeek}>
                ▶ Generate next week
              </button>
              <button className="btn btn-danger" onClick={resetAll}>
                ↺ Reset all data
              </button>
            </div>
          </>
        )}

        {/* SCHEDULE HISTORY */}
        {tab === "schedule" && (
          <>
            <div className="card">
              <div className="card-title">Shift rules</div>
              <div className="rule-row"><span className="dot dot-m" /><span>Morning — 1 point per week · 5 staff assigned</span></div>
              <div className="rule-row"><span className="dot dot-e" /><span>Evening — 2 points per week · 3 staff assigned</span></div>
              <div className="rule-row"><span className="dot dot-n" /><span>Night — 3 points per week · 2 staff assigned · rotates until everyone has had one</span></div>
            </div>
            {state.schedules.length === 0 ? (
              <div className="card"><div className="empty-state">No schedules generated yet.</div></div>
            ) : (
              [...state.schedules].reverse().map((s) => (
                <div key={s.week} className="card">
                  <div className="card-title">Week {s.week}</div>
                  <div className="grid3">
                    <div className="schedule-col col-morning">
                      <div className="col-header"><span className="dot dot-m" />Morning</div>
                      {s.morning.map((id) => <div key={id} className="staff-chip"><span className="dot dot-m" />{getName(id)}</div>)}
                    </div>
                    <div className="schedule-col col-evening">
                      <div className="col-header"><span className="dot dot-e" />Evening</div>
                      {s.evening.map((id) => <div key={id} className="staff-chip"><span className="dot dot-e" />{getName(id)}</div>)}
                    </div>
                    <div className="schedule-col col-night">
                      <div className="col-header"><span className="dot dot-n" />Night</div>
                      {s.night.map((id) => <div key={id} className="staff-chip"><span className="dot dot-n" />{getName(id)}</div>)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* STAFF */}
        {tab === "staff" && (
          <>
            <div className="card">
              <div className="card-title">Add employee</div>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEmployee()}
                />
                <input
                  type="text"
                  placeholder="EMP ID (e.g. EMP011)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEmployee()}
                />
                <button className="btn btn-primary" onClick={addEmployee}>Add</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title">All staff — {state.staff.length} employees</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Night</th>
                    <th>Total pts</th>
                    <th>Last night</th>
                  </tr>
                </thead>
                <tbody>
                  {state.staff.map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ color: "#888780", fontSize: "12px" }}>{emp.id}</td>
                      <td><strong>{emp.name}</strong></td>
                      <td>{emp.morning}</td>
                      <td>{emp.evening}</td>
                      <td>{emp.night}</td>
                      <td><strong>{totalPoints(emp)}</strong></td>
                      <td>{emp.lastNightWeek ? <span className="week-tag">Week {emp.lastNightWeek}</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div className="card">
            <div className="card-title">Duty log — {state.log.length} records</div>
            {state.log.length === 0 ? (
              <div className="empty-state">No duty records yet.</div>
            ) : (
              [...state.log].reverse().map((l, i) => (
                <div key={i} className="log-item">
                  <span className="week-tag">Week {l.week}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{getName(l.empId)}</span>
                  <span className={`badge badge-${l.shift.toLowerCase()}`}>{l.shift}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

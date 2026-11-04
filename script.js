const KEY = 'sass_data_v2';
const today = () => new Date().toISOString().slice(0, 10);
const plus = (n) => {
    let d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};
const seed = {
    users: [{
        id: 'u1',
        name: 'Alex Student',
        email: 'student@demo.com',
        role: 'Student',
        course: 'BS Information Technology'
    }, {
        id: 'u2',
        name: 'School Administrator',
        email: 'admin@demo.com',
        role: 'Admin',
        course: 'Student Support Office'
    }],
    tasks: [{
            id: 't1',
            title: 'Finish database normalization activity',
            subject: 'Database Management',
            due: plus(1),
            priority: 'High',
            status: 'In Progress',
            notes: 'Review 1NF to 3NF'
        },
        {
            id: 't2',
            title: 'Prepare cybersecurity quiz reviewer',
            subject: 'Information Assurance',
            due: plus(3),
            priority: 'Medium',
            status: 'To Do',
            notes: ''
        },
        {
            id: 't3',
            title: 'Submit UI wireframe',
            subject: 'Application Development',
            due: plus(0),
            priority: 'High',
            status: 'To Do',
            notes: ''
        },
        {
            id: 't4',
            title: 'Read chapter on web APIs',
            subject: 'Web Development',
            due: plus(-2),
            priority: 'Low',
            status: 'Completed',
            notes: ''
        }
    ],
    schedules: [{
        id: 's1',
        title: 'Review Information Assurance',
        date: today(),
        start: '16:00',
        end: '17:00',
        location: 'Home study area'
    }, {
        id: 's2',
        title: 'Work on capstone prototype',
        date: plus(1),
        start: '18:00',
        end: '19:30',
        location: 'Library'
    }],
    concerns: [],
    appointments: [],
    directory: [{
            id: 'd1',
            name: 'Student Affairs Office',
            type: 'Student Support',
            email: 'studentaffairs@school.edu',
            hours: 'Monday–Friday, 8:00 AM–5:00 PM',
            description: 'General student concerns, referrals, and campus support information.'
        },
        {
            id: 'd2',
            name: 'Academic Adviser',
            type: 'Academic Advising',
            email: 'adviser@school.edu',
            hours: 'By appointment',
            description: 'Guidance on academic workload, subject planning, and study strategies.'
        },
        {
            id: 'd3',
            name: 'Guidance Office',
            type: 'Guidance Services',
            email: 'guidance@school.edu',
            hours: 'Monday–Friday, office hours',
            description: 'Confidential support and referrals from designated school personnel.'
        }
    ],
    notifications: []
};

function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || structuredClone(seed)
    } catch (e) {
        return structuredClone(seed)
    }
}
let db = load(),
    session = null,
    page = 'dashboard',
    toastTimer;

function save() {
    localStorage.setItem(KEY, JSON.stringify(db))
}

function esc(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    } [c]))
}

function uid() {
    return Math.random().toString(36).slice(2, 10)
}

function me() {
    return db.users.find(u => u.id === session?.id) || session
}

function isAdmin() {
    return me()?.role === 'Admin'
}

function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        document.body.append(el)
    }
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2800)
}

function dateLabel(d) {
    if (!d) return 'No date';
    return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

function overdue(t) {
    return t.status !== 'Completed' && t.due < today()
}

function navItems() {
    return [
        ['dashboard', '▦', 'Dashboard'],
        ['tasks', '✓', 'Academic Tasks'],
        ['schedule', '◷', 'Study Schedule'],
        ['support', '♡', 'Support Directory'],
        ['concerns', '✉', 'Concerns & Appointments'], ...(isAdmin() ? [
            ['admin', '▤', 'Admin Overview']
        ] : []), ['settings', '⚙', 'Settings']
    ]
}

function shell() {
    return `<div class="app"><aside class="sidebar" id="sidebar"><div class="brand"><div class="logo">S</div><div><strong>StudyWell</strong><small>Academic support hub</small></div></div><div class="nav">${navItems().map(([id,ico,label])=>`<button class="${page===id?'active':''}" onclick="go('${id}')"><span class="ico">${ico}</span>${label}</button>`).join('')}</div><div class="side-note"><b>Small steps count.</b><br>Plan your workload, take breaks, and reach out to designated school support when needed.</div></aside><main class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:12px"><button class="mobile-menu" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button><h2>${navItems().find(x=>x[0]===page)?.[2]||'StudyWell'}</h2></div><div class="top-right"><span class="user-label">${esc(me().name)}</span><div class="avatar">${esc(me().name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><button class="secondary small" onclick="logout()">Log out</button></div></header><section class="content" id="view"></section></main></div><div class="toast hidden"></div>`
}

function render() {
    if (!session) {
        renderLogin();
        return
    }
    document.getElementById('root').innerHTML = shell();
    let v = document.getElementById('view');
    ({
        dashboard: dashboard,
        tasks: tasksPage,
        schedule: schedulePage,
        support: supportPage,
        concerns: concernsPage,
        admin: adminPage,
        settings: settingsPage
    } [page] || dashboard)(v)
}

function renderLogin() {
    document.getElementById('root').innerHTML = `<div class="login-wrap"><div class="login-card"><div class="brand"><div class="logo">S</div><div><strong>StudyWell</strong><small class="muted">Academic support hub</small></div></div><h1>Welcome back</h1><p class="muted">Sign in to organize your academic workload.</p><form onsubmit="login(event)"><div class="field"><label>Email address</label><input id="email" type="email" required placeholder="you@school.edu"></div><div class="field"><label>Password</label><input id="password" type="password" required placeholder="Enter any password for demo"></div><button class="full">Sign in</button></form><div class="demo"><b>Demo access</b><br>Student: student@demo.com<br>Admin: admin@demo.com<br>Password: any text (prototype only)</div><p class="footer-note">Prototype only. Demo sign-in is not production authentication.</p></div></div>`
}

function login(e) {
    e.preventDefault();
    let email = document.getElementById('email').value.toLowerCase();
    let u = db.users.find(x => x.email.toLowerCase() === email);
    if (!u) {
        toast('Demo account not found. Use one of the listed accounts.');
        return
    }
    session = {
        id: u.id
    };
    page = 'dashboard';
    render()
}

function logout() {
    session = null;
    renderLogin()
}

function go(p) {
    page = p;
    render()
}

function stat(label, val, foot, icon) {
    return `<div class="card"><div class="stat-icon">${icon}</div><div class="stat-label">${label}</div><div class="stat-value">${val}</div><div class="stat-foot">${foot}</div></div>`
}

function taskBadge(t) {
    return `<span class="badge ${t.status==='Completed'?'done':overdue(t)?'overdue':t.priority==='High'?'high':''}">${overdue(t)?'Overdue':esc(t.status)}</span>`
}

function taskRows(list, withActions = true) {
    if (!list.length) return `<div class="empty">No tasks here yet. Add an academic requirement to get started.</div>`;
    return list.map(t => `<div class="task-row"><input class="check" type="checkbox" ${t.status==='Completed'?'checked':''} onchange="toggleTask('${t.id}',this.checked)" aria-label="Mark completed"><div class="task-info"><strong>${esc(t.title)}</strong><small>${esc(t.subject||'General')} · Due ${dateLabel(t.due)}</small></div><span class="badge ${t.priority==='High'?'high':''}">${esc(t.priority)}</span>${taskBadge(t)}${withActions?`<button class="secondary small" onclick="editTask('${t.id}')">Edit</button>`:''}</div>`).join('')
}

function dashboard(v) {
    let active = db.tasks.filter(t => t.status !== 'Completed'),
        done = db.tasks.filter(t => t.status === 'Completed'),
        upcoming = active.filter(t => t.due >= today()).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4),
        todaySched = db.schedules.filter(s => s.date === today()).sort((a, b) => a.start.localeCompare(b.start));
    let completion = db.tasks.length ? Math.round(done.length / db.tasks.length * 100) : 0;
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">Your academic workspace</div><h1>Good ${new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, ${esc(me().name.split(' ')[0])} 👋</h1><div class="muted">A clearer plan can make a busy week feel more manageable.</div></div><button onclick="openTaskForm()">＋ Add academic task</button></div><div class="grid stats">${stat('Active tasks',active.length,'Requirements still in progress','✓')}${stat('Due today',active.filter(t=>t.due===today()).length,'Tasks with today’s deadline','◷')}${stat('Completed',done.length,'Tasks marked complete','★')}${stat('Task completion',completion+'%','Based on all saved tasks','↗')}</div><div class="grid two"><div class="card"><div class="section-head"><div><h3>Upcoming academic tasks</h3><p>Keep an eye on your next deadlines.</p></div><button class="secondary small" onclick="go('tasks')">View all</button></div>${taskRows(upcoming,false)}</div><div class="card"><div class="section-head"><div><h3>Today’s study plan</h3><p>${dateLabel(today())}</p></div><button class="secondary small" onclick="go('schedule')">Manage</button></div>${todaySched.length?todaySched.map(s=>`<div class="schedule-item"><div class="timebox">${esc(s.start)}<br>— ${esc(s.end)}</div><div><b>${esc(s.title)}</b><div class="muted" style="font-size:12px">${esc(s.location||'Study session')}</div></div></div>`).join(''):`<div class="empty">No study sessions planned for today.</div>`}</div></div><div class="grid two" style="margin-top:18px"><div class="card"><div class="section-head"><div><h3>Progress overview</h3><p>Progress is based on tasks you mark complete.</p></div><b>${completion}%</b></div><div class="progress"><span style="width:${completion}%"></span></div><p class="muted" style="font-size:12px;margin-bottom:0">${done.length} of ${db.tasks.length} academic tasks completed.</p></div><div class="card"><div class="section-head"><div><h3>Quick actions</h3><p>Shortcuts to common activities.</p></div></div><div class="quick-grid"><button class="quick" onclick="openTaskForm()"><span>📝</span><b>Add task</b><small class="muted">Record a deadline</small></button><button class="quick" onclick="openScheduleForm()"><span>📅</span><b>Plan study time</b><small class="muted">Create a session</small></button><button class="quick" onclick="go('support')"><span>🤝</span><b>Find support</b><small class="muted">View school services</small></button><button class="quick" onclick="go('concerns')"><span>💬</span><b>Request help</b><small class="muted">Concern or appointment</small></button></div></div></div><div class="footer-note">StudyWell is an academic organization and support-access prototype, not a mental-health diagnostic or treatment tool.</div>`
}

function tasksPage(v) {
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">Academic management</div><h1>Academic tasks</h1><div class="muted">Create, prioritize, and track assignments, projects, and examinations.</div></div><button onclick="openTaskForm()">＋ Add task</button></div><div class="toolbar"><input id="taskSearch" placeholder="Search task or subject..." oninput="filterTasks()"><select id="taskStatus" onchange="filterTasks()"><option value="">All statuses</option><option>To Do</option><option>In Progress</option><option>Completed</option></select><select id="taskPriority" onchange="filterTasks()"><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select><select id="taskSort" onchange="filterTasks()"><option value="due">Sort: deadline</option><option value="priority">Sort: priority</option><option value="title">Sort: title</option></select></div><div class="card"><div class="section-head"><div><h3>All academic requirements</h3><p id="taskCount"></p></div></div><div id="taskList"></div></div><div class="footer-note">Task records are stored in this browser using localStorage for prototype demonstration.</div>`;
    filterTasks()
}

function filterTasks() {
    let list = [...db.tasks],
        q = (document.getElementById('taskSearch')?.value || '').toLowerCase(),
        st = document.getElementById('taskStatus')?.value || '',
        pr = document.getElementById('taskPriority')?.value || '',
        sort = document.getElementById('taskSort')?.value || 'due';
    list = list.filter(t => (t.title + ' ' + t.subject).toLowerCase().includes(q) && (!st || t.status === st) && (!pr || t.priority === pr));
    list.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'priority' ? ({
        High: 0,
        Medium: 1,
        Low: 2
    } [a.priority] - {
        High: 0,
        Medium: 1,
        Low: 2
    } [b.priority]) : a.due.localeCompare(b.due));
    let el = document.getElementById('taskList');
    if (el) el.innerHTML = taskRows(list);
    let c = document.getElementById('taskCount');
    if (c) c.textContent = `${list.length} task${list.length===1?'':'s'} found`
}

function toggleTask(id, checked) {
    let t = db.tasks.find(x => x.id === id);
    if (t) {
        t.status = checked ? 'Completed' : 'To Do';
        save();
        render();
        toast(checked ? 'Task marked complete.' : 'Task reopened.')
    }
}

function editTask(id) {
    let t = db.tasks.find(x => x.id === id);
    if (t) openTaskForm(t)
}

function openTaskForm(t = null) {
    modal(`<h3>${t?'Edit academic task':'Add academic task'}</h3><div class="field"><label>Task title *</label><input name="title" required maxlength="120" value="${esc(t?.title||'')}" placeholder="e.g., Submit research chapter"></div><div class="form-grid"><div class="field"><label>Subject / course</label><input name="subject" value="${esc(t?.subject||'')}" placeholder="e.g., Web Development"></div><div class="field"><label>Deadline *</label><input name="due" type="date" required value="${t?.due||today()}"></div><div class="field"><label>Priority</label><select name="priority">${['High','Medium','Low'].map(x=>`<option ${t?.priority===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Status</label><select name="status">${['To Do','In Progress','Completed'].map(x=>`<option ${t?.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field span2"><label>Notes (optional)</label><textarea name="notes">${esc(t?.notes||'')}</textarea></div></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button>${t?`<button type="button" class="danger" onclick="deleteTask('${t.id}')">Delete</button>`:''}<button>Save task</button></div></form>`)
}

async function saveTaskToDatabase(task) {
    try {
        const response = await fetch(
            "api/save_task.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: 1,
                    title: task.title,
                    description: task.description,
                    due_date: task.due_date
                })
            }
        );

        const result = await response.json();

        if (result.success) {
            toast("Task saved successfully!");
        } else {
            toast("Unable to save task.")
        }
    } catch (error) {
        console.error(error);
        toast("Databases connection error.");
    }
    
}

async function saveTask(e, id) {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.target));
    if (id) {
        Object.assign(db.tasks.find(t => t.id === id), f);
    } else {
        let newTask = {
            id: uid(),
            ...f
        };
        db.tasks.push(newTask);
        
        // Sync with backend database via your new function
        await saveTaskToDatabase({
            title: newTask.title,
            description: newTask.notes || '',
            due_date: newTask.due
        });
    }
    save();
    closeModal();
    render();
    toast(id ? 'Task updated.' : 'Academic task saved.');
}

function deleteTask(id) {
    if (!confirm('Delete this academic task?')) return;
    db.tasks = db.tasks.filter(t => t.id !== id);
    save();
    closeModal();
    render();
    toast('Task deleted.')
}

function schedulePage(v) {
    let list = [...db.schedules].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">Study planning</div><h1>Study schedule</h1><div class="muted">Reserve realistic time for learning and project work.</div></div><button onclick="openScheduleForm()">＋ Add study session</button></div><div class="notice">Tip: leave room for breaks and unexpected tasks. This schedule is a planning aid, not a school timetable.</div><div class="card"><div class="section-head"><div><h3>Planned sessions</h3><p>${list.length} session(s) saved</p></div></div>${list.length?list.map(s=>`<div class="task-row"><div class="timebox">${dateLabel(s.date)}<br>${esc(s.start)}–${esc(s.end)}</div><div class="task-info"><strong>${esc(s.title)}</strong><small>${esc(s.location||'No location specified')}</small></div><button class="secondary small" onclick="editSchedule('${s.id}')">Edit</button><button class="danger small" onclick="deleteSchedule('${s.id}')">Delete</button></div>`).join(''):`<div class="empty">No study sessions saved yet.</div>`}</div>`
}

function openScheduleForm(s = null) {
    modal(`<h3>${s?'Edit study session':'Plan a study session'}</h3><form onsubmit="saveSchedule(event,'${s?.id||''}')"><div class="field"><label>Session title *</label><input name="title" required value="${esc(s?.title||'')}" placeholder="e.g., Review for midterm"></div><div class="form-grid"><div class="field"><label>Date *</label><input type="date" name="date" required value="${s?.date||today()}"></div><div class="field"><label>Location</label><input name="location" value="${esc(s?.location||'')}" placeholder="Library / Home"></div><div class="field"><label>Start time *</label><input type="time" name="start" required value="${s?.start||'16:00'}"></div><div class="field"><label>End time *</label><input type="time" name="end" required value="${s?.end||'17:00'}"></div></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button>Save session</button></div></form>`)
}

function editSchedule(id) {
    let s = db.schedules.find(x => x.id === id);
    if (s) openScheduleForm(s)
}

function saveSchedule(e, id) {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.target));
    if (f.end <= f.start) {
        toast('End time must be later than start time.');
        return
    }
    if (id) Object.assign(db.schedules.find(s => s.id === id), f);
    else db.schedules.push({
        id: uid(),
        ...f
    });
    save();
    closeModal();
    render();
    toast('Study schedule saved.')
}

function deleteSchedule(id) {
    if (!confirm('Delete this study session?')) return;
    db.schedules = db.schedules.filter(s => s.id !== id);
    save();
    render();
    toast('Study session deleted.')
}

function supportPage(v) {
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">School support resources</div><h1>Support directory</h1><div class="muted">Connect with designated school personnel for academic or student-support concerns.</div></div></div><div class="notice"><b>Privacy reminder:</b> Share only information needed to explain your request. This prototype does not send messages to real school offices.</div><div class="grid three">${db.directory.map(d=>`<div class="card"><div class="support-card"><div class="support-icon">${d.type.includes('Guidance')?'♡':d.type.includes('Academic')?'📚':'🤝'}</div><div><span class="badge">${esc(d.type)}</span><h3 style="margin-top:10px">${esc(d.name)}</h3><p>${esc(d.description)}</p><div style="font-size:12px;margin-bottom:6px">✉ ${esc(d.email)}</div><div class="muted" style="font-size:12px;margin-bottom:12px">◷ ${esc(d.hours)}</div><button class="secondary small" onclick="newAppointment('${d.id}')">Request appointment</button></div></div></div>`).join('')}</div><div class="footer-note">Directory entries are sample data. Replace them with approved school contact details before any real deployment.</div>`
}

function concernsPage(v) {
    let myC = db.concerns.filter(c => isAdmin() || c.userId === me().id),
        myA = db.appointments.filter(a => isAdmin() || a.userId === me().id);
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">Ask for support</div><h1>Concerns & appointments</h1><div class="muted">Submit a concern or request a meeting with designated school personnel.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="secondary" onclick="openConcernForm()">＋ Submit concern</button><button onclick="newAppointment()">＋ Request appointment</button></div></div><div class="notice">Anonymous concerns hide your name in the concern list, but do not include identifying details in the message if you want to remain anonymous. The prototype does not deliver submissions to real staff.</div><div class="grid two"><div class="card"><div class="section-head"><div><h3>${isAdmin()?'Submitted concerns':'Your concerns'}</h3><p>Concern status and follow-up</p></div></div>${myC.length?myC.map(c=>`<div class="task-row" style="align-items:flex-start"><div class="support-icon">✉</div><div class="task-info"><strong>${esc(c.category)} · ${c.anonymous?'Anonymous':esc(c.name)}</strong><small>${dateLabel(c.created)} · ${esc(c.status)}</small><p style="font-size:13px;margin:8px 0">${esc(c.message)}</p>${isAdmin()?`<select onchange="updateConcern('${c.id}',this.value)" style="padding:6px;border:1px solid #ddd;border-radius:8px"><option ${c.status==='Received'?'selected':''}>Received</option><option ${c.status==='In Review'?'selected':''}>In Review</option><option ${c.status==='Referred'?'selected':''}>Referred</option><option ${c.status==='Closed'?'selected':''}>Closed</option></select>`:''}</div></div>`).join(''):`<div class="empty">No concerns submitted yet.</div>`}</div><div class="card"><div class="section-head"><div><h3>${isAdmin()?'Appointment requests':'Your appointment requests'}</h3><p>Requests are sample records until connected to school staff.</p></div></div>${myA.length?myA.map(a=>`<div class="task-row" style="align-items:flex-start"><div class="timebox">${dateLabel(a.date)}<br>${esc(a.time)}</div><div class="task-info"><strong>${esc(a.person)}</strong><small>${esc(a.topic)} · ${esc(a.status)}</small>${a.note?`<p style="font-size:12px">${esc(a.note)}</p>`:''}${isAdmin()?`<select onchange="updateAppointment('${a.id}',this.value)" style="padding:6px;border:1px solid #ddd;border-radius:8px;margin-top:6px"><option ${a.status==='Pending'?'selected':''}>Pending</option><option ${a.status==='Approved'?'selected':''}>Approved</option><option ${a.status==='Reschedule'?'selected':''}>Reschedule</option><option ${a.status==='Completed'?'selected':''}>Completed</option><option ${a.status==='Declined'?'selected':''}>Declined</option></select>`:''}</div></div>`).join(''):`<div class="empty">No appointment requests yet.</div>`}</div></div>`
}

function openConcernForm() {
    modal(`<h3>Submit a concern</h3><form onsubmit="saveConcern(event)"><div class="field"><label>Concern category *</label><select name="category" required><option>Academic workload</option><option>Study planning</option><option>Access to school support</option><option>Other student concern</option></select></div><div class="field"><label>Describe your concern *</label><textarea name="message" required minlength="8" maxlength="1500" placeholder="Share only the information needed for support."></textarea></div><label style="display:flex;gap:9px;align-items:center;font-size:13px;margin:12px 0"><input type="checkbox" name="anonymous"> Submit anonymously in the concern list</label><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button>Submit concern</button></div></form>`)
}

function saveConcern(e) {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.target));
    db.concerns.unshift({
        id: uid(),
        userId: me().id,
        name: me().name,
        category: f.category,
        message: f.message,
        anonymous: f.anonymous === 'on',
        status: 'Received',
        created: today()
    });
    save();
    closeModal();
    render();
    toast('Concern saved to this prototype.')
}

function newAppointment(directoryId) {
    let d = db.directory.find(x => x.id === directoryId);
    modal(`<h3>Request an appointment</h3><form onsubmit="saveAppointment(event)"><div class="field"><label>School personnel / office *</label><select name="person" required>${db.directory.map(x=>`<option ${d?.id===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="field"><label>Topic *</label><select name="topic"><option>Academic workload planning</option><option>Study schedule guidance</option><option>Student support inquiry</option><option>Other academic concern</option></select></div><div class="form-grid"><div class="field"><label>Preferred date *</label><input type="date" name="date" required min="${today()}" value="${plus(1)}"></div><div class="field"><label>Preferred time *</label><input type="time" name="time" required value="14:00"></div><div class="field span2"><label>Additional note (optional)</label><textarea name="note" maxlength="500" placeholder="Any relevant details for the request"></textarea></div></div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button>Send request</button></div></form>`)
}

function saveAppointment(e) {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.target));
    db.appointments.unshift({
        id: uid(),
        userId: me().id,
        ...f,
        status: 'Pending',
        created: today()
    });
    save();
    closeModal();
    render();
    toast('Appointment request saved.')
}

function updateConcern(id, status) {
    let c = db.concerns.find(x => x.id === id);
    if (c) {
        c.status = status;
        save();
        render();
        toast('Concern status updated.')
    }
}

function updateAppointment(id, status) {
    let a = db.appointments.find(x => x.id === id);
    if (a) {
        a.status = status;
        save();
        render();
        toast('Appointment status updated.')
    }
}

function adminPage(v) {
    if (!isAdmin()) {
        go('dashboard');
        return
    }
    let active = db.tasks.filter(t => t.status !== 'Completed').length,
        done = db.tasks.filter(t => t.status === 'Completed').length;
    let categories = {};
    db.tasks.forEach(t => categories[t.subject || 'Uncategorized'] = (categories[t.subject || 'Uncategorized'] || 0) + 1);
    let max = Math.max(1, ...Object.values(categories));
    v.innerHTML = `<div class="welcome"><div><div class="eyebrow">Administration</div><h1>System overview</h1><div class="muted">A high-level view of prototype records and support activity.</div></div><button class="secondary" onclick="exportCSV()">⇩ Export tasks CSV</button></div><div class="notice">This dashboard uses local browser demo data. It is not a live school-wide reporting system and should not be used for official decisions.</div><div class="grid stats">${stat('Total tasks',db.tasks.length,'Across saved demo records','✓')}${stat('Active tasks',active,'Not yet completed','◷')}${stat('Concerns',db.concerns.length,'Submitted in this browser','✉')}${stat('Appointment requests',db.appointments.length,'Current saved requests','📅')}</div><div class="grid two"><div class="card"><h3>Task distribution by subject</h3><p class="muted" style="font-size:12px">Counts reflect saved academic tasks.</p>${Object.keys(categories).length?Object.entries(categories).map(([k,n])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar"><span style="width:${n/max*100}%"></span></div><b>${n}</b></div>`).join(''):`<div class="empty">No task data available.</div>`}</div><div class="card"><h3>Completion status</h3><p class="muted" style="font-size:12px">Current task records.</p><div style="display:flex;gap:18px;align-items:center;margin-top:22px"><div style="font-size:42px;font-weight:850;color:var(--blue)">${db.tasks.length?Math.round(done/db.tasks.length*100):0}%</div><div><b>${done} completed</b><br><span class="muted">${active} active</span><div class="progress" style="width:180px;margin-top:9px"><span style="width:${db.tasks.length?done/db.tasks.length*100:0}%"></span></div></div></div><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><div class="muted" style="font-size:12px">Users: ${db.users.length} · Support directory entries: ${db.directory.length}</div></div></div><div class="card" style="margin-top:18px"><div class="section-head"><div><h3>Recent support requests</h3><p>Concerns and appointments from local prototype data</p></div><button class="secondary small" onclick="go('concerns')">Manage requests</button></div><div class="table-wrap"><table><thead><tr><th>Type</th><th>Submitted by</th><th>Topic</th><th>Date</th><th>Status</th></tr></thead><tbody>${[...db.concerns.map(c=>({type:'Concern',by:c.anonymous?'Anonymous':c.name,topic:c.category,date:c.created,status:c.status})),...db.appointments.map(a=>({type:'Appointment',by:db.users.find(u=>u.id===a.userId)?.name||'Student',topic:a.topic,date:a.date,status:a.status}))].slice(0,8).map(x=>` < tr > < td > $ {
        x.type
    } < /td><td>${esc(x.by)}</td > < td > $ {
        esc(x.topic)
    } < /td><td>${dateLabel(x.date)}</td > < td > < span class = "badge" > $ {
        esc(x.status)
    } < /span></td > < /tr>`).join('')||'<tr><td colspan="5">No support requests recorded.</td > < /tr>'}</tbody > < /table></div > < /div>`}

    function exportCSV() {
        let rows = [
            ['Title', 'Subject', 'Due date', 'Priority', 'Status', 'Notes'], ...db.tasks.map(t => [t.title, t.subject, t.due, t.priority, t.status, t.notes])
        ];
        let csv = rows.map(r => r.map(x => '"' + String(x || '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
        let a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], {
            type: 'text/csv'
        }));
        a.download = 'studywell-tasks.csv';
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Task CSV exported.')
    }

    function settingsPage(v) {
    v.innerHTML = `
        <div class="welcome">
            <div>
                <div class="eyebrow">Account & prototype controls</div>
                <h1>Settings</h1>

                <div class="card" style="margin-top:18px">
                    <h3>Account Information</h3>

                    <form onsubmit="saveSettings(event)">
                        <div style="margin-top:18px">

                            <div class="field">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value="${esc(me().name)}"
                                    required
                                >
                            </div>

                            <div class="field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value="${esc(me().email)}"
                                    disabled
                                >
                            </div>

                            <div class="field">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value="${esc(me().role)}"
                                    disabled
                                >
                            </div>

                            <div class="field">
                                <label>Affiliation/Course</label>
                                <input
                                    type="text"
                                    name="course"
                                    value="${esc(me().course || '')}"
                                >
                            </div>

                        </div>

                        <p class="muted" style="font-size:12px">
                            Account editing and real password management
                            are not implemented in this prototype.
                        </p>

                        <button type="submit" class="primary">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>

            <div class="card">
                <h3>Local Data Management</h3>

                <p class="muted">
                    Prototype records are stored in this browser only.
                    Clearing them cannot be undone.
                </p>

                <button
                    type="button"
                    class="secondary"
                    onclick="exportCSV()"
                >
                    Export Tasks to CSV
                </button>

                <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">

                <button
                    type="button"
                    class="danger"
                    onclick="resetDemo()"
                >
                    Reset All Demo Data
                </button>

                <p class="footer-note">
                    Do not enter real confidential student information
                    in this prototype.
                </p>
            </div>
        </div>

        <div class="card" style="margin-top:18px">
            <h3>Prototype Implementation Notes</h3>

            <ul class="muted" style="font-size:13px;line-height:1.9">
                <li>Frontend: HTML, CSS, vanilla JavaScript.</li>
                <li>Data persistence: browser localStorage, not a shared database.</li>
                <li>Authentication: demo account selection only; not secure production authentication.</li>
                <li>Notifications: in-app feedback only; no email/SMS/push integration.</li>
                <li>Support requests: saved locally; not transmitted to school personnel.</li>
            </ul>
        </div>
    `;
}

function saveSettings(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const currentUser = me();

    currentUser.name = formData.get('name').trim();
    currentUser.course = formData.get('course').trim();

    save();

    render();

    toast('Account settings updated successfully!');
}

    function resetDemo() {
        if (!confirm('Reset all locally saved demo records to the original sample data?')) return;
        db = structuredClone(seed);
        save();
        render();
        toast('Demo data reset.')
    }

    function modal(inner) {
        document.getElementById('modalHost')?.remove();
        let el = document.createElement('div');
        el.id = 'modalHost';
        el.style = 'position:fixed;inset:0;background:#11182780;z-index:50;display:grid;place-items:center;padding:16px;overflow:auto';
        el.innerHTML = `<div style="width:min(600px,100%);max-height:90vh;overflow:auto;background:white;border-radius:18px;padding:24px;box-shadow:0 20px 70px #11182744"><div style="display:flex;justify-content:flex-end"><button class="secondary small" onclick="closeModal()">✕</button></div>${inner}</div>`;
        document.body.append(el)
    }

    function closeModal() {
        document.getElementById('modalHost')?.remove()
    }
    save();
    render();
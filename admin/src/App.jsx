import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// Set `VITE_API_BASE_URL=` (empty string) only in the Docker/nginx build — same-origin.
// Omit the variable locally so Vite uses `undefined` and we fall back to localhost API.
const rawApi = import.meta.env.VITE_API_BASE_URL;
const trimmed = typeof rawApi === 'string' ? rawApi.trim() : '';

const API_BASE =
  trimmed !== ''
    ? trimmed.replace(/\/$/, '')
    : typeof rawApi === 'string'
      ? ''
      : 'http://localhost:4000';
const TOKEN_KEY = 'civic_admin_token';

const api = axios.create({ baseURL: API_BASE });

function mediaUrl(p) {
  if (!p) return '';
  if (typeof p !== 'string') return '';
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('data:')) return p;
  return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
}

function formatAxiosError(err) {
  const payload = err?.response?.data;
  if (payload?.error) return payload.error;
  if (payload?.errors) return JSON.stringify(payload.errors);
  return err?.message || 'Request failed';
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

function App() {
  const [token, setTokenState] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [tab, setTab] = useState('complaints');
  const [error, setError] = useState('');

  const [mobile, setMobile] = useState('9999999999');
  const [password, setPassword] = useState('admin123');

  const [complaints, setComplaints] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rep, setRep] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newUpdate, setNewUpdate] = useState({ title: '', description: '', type: 'announcement' });
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    location_text: '',
    status: 'in_progress',
    progress_percent: 0,
    budget: '',
    contractor: '',
    start_date: '',
    expected_completion_date: '',
    image_url: '',
  });
  const [newEmergency, setNewEmergency] = useState({
    department_name: '',
    phone: '',
    description: '',
    icon: '',
    priority: 0,
  });

  useEffect(() => {
    if (token) {
      setToken(token);
      refreshAll();
    }
  }, [token]);

  async function login(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { mobile, password });
      setTokenState(data.token);
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  function logout() {
    setToken('');
    setTokenState('');
    setComplaints([]);
    setUpdates([]);
    setUsers([]);
    setRep(null);
  }

  async function refreshAll() {
    setLoading(true);
    setError('');
    try {
      const [cRes, uRes, usersRes, projectsRes, repRes] = await Promise.all([
        api.get('/api/complaints'),
        api.get('/api/updates'),
        api.get('/api/users'),
        api.get('/api/projects'),
        api.get('/api/representative'),
      ]);
      setComplaints(cRes.data.complaints || []);
      setUpdates(uRes.data.updates || []);
      setUsers(usersRes.data.users || []);
      setProjects(projectsRes.data.projects || []);
      setRep(repRes.data.representative || null);
    } catch (err) {
      setError(formatAxiosError(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateComplaintStatus(id, status, assignedOfficerName) {
    try {
      setError('');
      await api.put(`/api/complaints/${id}/status`, {
        status,
        assigned_officer_name: assignedOfficerName || null,
      });
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function createUpdate(e) {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/updates', newUpdate);
      setNewUpdate({ title: '', description: '', type: 'announcement' });
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function saveUpdate(row) {
    try {
      setError('');
      await api.put(`/api/updates/${row.id}`, row);
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function deleteUpdate(id) {
    try {
      setError('');
      await api.delete(`/api/updates/${id}`);
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function saveUser(user) {
    try {
      setError('');
      await api.put(`/api/users/${user.id}`, user);
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function saveRep(e) {
    e.preventDefault();
    try {
      setError('');
      await api.put('/api/representative', rep);
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function uploadRepPhoto(file) {
    if (!file) return;
    try {
      setError('');
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post('/api/representative/photo', form);
      setRep((prev) => (prev ? { ...prev, photo_url: data.photo_url } : prev));
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function createProject(e) {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/projects', {
        ...newProject,
        progress_percent: Number(newProject.progress_percent) || 0,
      });
      setNewProject({
        title: '',
        description: '',
        location_text: '',
        status: 'in_progress',
        progress_percent: 0,
        budget: '',
        contractor: '',
        start_date: '',
        expected_completion_date: '',
        image_url: '',
      });
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function saveProject(row) {
    try {
      setError('');
      await api.put(`/api/projects/${row.id}`, {
        ...row,
        progress_percent: Number(row.progress_percent) || 0,
      });
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  async function deleteProject(id) {
    try {
      setError('');
      await api.delete(`/api/projects/${id}`);
      await refreshAll();
    } catch (err) {
      setError(formatAxiosError(err));
    }
  }

  const stats = useMemo(
    () => ({
      complaints: complaints.length,
      pending: complaints.filter((c) => ['registered', 'assigned', 'in_progress'].includes(c.status)).length,
      users: users.length,
      updates: updates.length,
    }),
    [complaints, updates, users]
  );

  if (!token) {
    return (
      <main className="login-wrap">
        <form className="card login-card" onSubmit={login}>
          <h1>Civic Pulse CRM</h1>
          <p>Admin login</p>
          <label>Mobile</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Login</button>
          {error ? <div className="error">{error}</div> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="layout">
      <aside className="sidebar">
        <h2>Civic Pulse CRM</h2>
        <button className={tab === 'complaints' ? 'active' : ''} onClick={() => setTab('complaints')}>Complaints</button>
        <button className={tab === 'updates' ? 'active' : ''} onClick={() => setTab('updates')}>Updates</button>
        <button className={tab === 'works' ? 'active' : ''} onClick={() => setTab('works')}>Works</button>
        <button className={tab === 'profiles' ? 'active' : ''} onClick={() => setTab('profiles')}>Profiles</button>
        <button className={tab === 'representative' ? 'active' : ''} onClick={() => setTab('representative')}>Representative</button>
        <button onClick={logout}>Logout</button>
      </aside>

      <section className="content">
        <header className="stats">
          <div className="card">Complaints: {stats.complaints}</div>
          <div className="card">Pending: {stats.pending}</div>
          <div className="card">Users: {stats.users}</div>
          <div className="card">Updates: {stats.updates}</div>
        </header>

        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="card">Loading...</div> : null}

        {tab === 'complaints' ? (
          <div className="list">
            {complaints.map((c) => (
              <div className="card" key={c.id}>
                <h3>{c.title}</h3>
                <p>{c.description || '-'}</p>
                <p><strong>{c.complaint_no}</strong> · {c.user?.full_name || c.user?.mobile || 'User'}</p>
                {c.image_url ? (
                  <img
                    src={mediaUrl(c.image_url)}
                    alt=""
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb' }}
                    onError={(e) => {
                      // Avoid broken-image icon; keep card clean.
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="row">
                  <select defaultValue={c.status} onChange={(e) => updateComplaintStatus(c.id, e.target.value, c.assigned_officer_name)}>
                    <option value="registered">registered</option>
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <input
                    placeholder="Assigned officer"
                    defaultValue={c.assigned_officer_name || ''}
                    onBlur={(e) => updateComplaintStatus(c.id, c.status, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'updates' ? (
          <div className="list">
            <form className="card" onSubmit={createUpdate}>
              <h3>Create update</h3>
              <input
                placeholder="Title"
                value={newUpdate.title}
                onChange={(e) => setNewUpdate((s) => ({ ...s, title: e.target.value }))}
                required
              />
              <textarea
                placeholder="Description"
                value={newUpdate.description}
                onChange={(e) => setNewUpdate((s) => ({ ...s, description: e.target.value }))}
              />
              <input
                placeholder="Type"
                value={newUpdate.type}
                onChange={(e) => setNewUpdate((s) => ({ ...s, type: e.target.value }))}
              />
              <button type="submit">Create</button>
            </form>
            {updates.map((u) => (
              <EditableUpdate key={u.id} value={u} onSave={saveUpdate} onDelete={deleteUpdate} />
            ))}
          </div>
        ) : null}

        {tab === 'works' ? (
          <div className="list">
            <form className="card" onSubmit={createProject}>
              <h3>Create work (project)</h3>
              <input
                placeholder="Title"
                value={newProject.title}
                onChange={(e) => setNewProject((s) => ({ ...s, title: e.target.value }))}
                required
              />
              <textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) => setNewProject((s) => ({ ...s, description: e.target.value }))}
              />
              <input
                placeholder="Location"
                value={newProject.location_text}
                onChange={(e) => setNewProject((s) => ({ ...s, location_text: e.target.value }))}
              />
              <div className="row">
                <select value={newProject.status} onChange={(e) => setNewProject((s) => ({ ...s, status: e.target.value }))}>
                  <option value="not_started">not_started</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                </select>
                <input
                  placeholder="% Completed"
                  type="number"
                  min="0"
                  max="100"
                  value={newProject.progress_percent}
                  onChange={(e) => setNewProject((s) => ({ ...s, progress_percent: e.target.value }))}
                />
              </div>
              <div className="row">
                <input placeholder="Budget" value={newProject.budget} onChange={(e) => setNewProject((s) => ({ ...s, budget: e.target.value }))} />
                <input placeholder="Contractor" value={newProject.contractor} onChange={(e) => setNewProject((s) => ({ ...s, contractor: e.target.value }))} />
              </div>
              <div className="row">
                <input placeholder="Start date (YYYY-MM-DD)" value={newProject.start_date} onChange={(e) => setNewProject((s) => ({ ...s, start_date: e.target.value }))} />
                <input placeholder="Expected completion (YYYY-MM-DD)" value={newProject.expected_completion_date} onChange={(e) => setNewProject((s) => ({ ...s, expected_completion_date: e.target.value }))} />
              </div>
              <input placeholder="Image URL (optional)" value={newProject.image_url} onChange={(e) => setNewProject((s) => ({ ...s, image_url: e.target.value }))} />
              <button type="submit">Create</button>
            </form>

            {projects.map((p) => (
              <EditableProject key={p.id} value={p} onSave={saveProject} onDelete={deleteProject} />
            ))}
          </div>
        ) : null}

        {tab === 'profiles' ? (
          <div className="list">
            {users.map((u) => (
              <EditableUser key={u.id} value={u} onSave={saveUser} />
            ))}
          </div>
        ) : null}

        {tab === 'representative' && rep ? (
          <form className="card list" onSubmit={saveRep}>
            <h3>Representative</h3>
            {rep.photo_url ? (
              <img
                src={mediaUrl(rep.photo_url)}
                alt=""
                style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12, border: '1px solid #e5e7eb' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div className="row">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadRepPhoto(e.target.files?.[0])}
              />
            </div>
            <input value={rep.name || ''} onChange={(e) => setRep((s) => ({ ...s, name: e.target.value }))} placeholder="Name" />
            <input value={rep.title || ''} onChange={(e) => setRep((s) => ({ ...s, title: e.target.value }))} placeholder="Title" />
            <textarea value={rep.bio || ''} onChange={(e) => setRep((s) => ({ ...s, bio: e.target.value }))} placeholder="Bio" />
            <textarea value={rep.vision || ''} onChange={(e) => setRep((s) => ({ ...s, vision: e.target.value }))} placeholder="Vision" />
            <input value={rep.email || ''} onChange={(e) => setRep((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
            <input value={rep.phone || ''} onChange={(e) => setRep((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" />
            <button type="submit">Save representative</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function EditableUpdate({ value, onSave, onDelete }) {
  const [row, setRow] = useState(value);
  useEffect(() => setRow(value), [value]);
  return (
    <div className="card">
      <input value={row.title || ''} onChange={(e) => setRow((s) => ({ ...s, title: e.target.value }))} />
      <textarea value={row.description || ''} onChange={(e) => setRow((s) => ({ ...s, description: e.target.value }))} />
      <div className="row">
        <input value={row.type || ''} onChange={(e) => setRow((s) => ({ ...s, type: e.target.value }))} />
        <button onClick={() => onSave(row)}>Save</button>
        <button className="danger" onClick={() => onDelete(row.id)}>Delete</button>
      </div>
    </div>
  );
}

function EditableUser({ value, onSave }) {
  const [row, setRow] = useState(value);
  useEffect(() => setRow(value), [value]);
  return (
    <div className="card">
      <h3>{row.mobile}</h3>
      <input value={row.full_name || ''} onChange={(e) => setRow((s) => ({ ...s, full_name: e.target.value }))} placeholder="Full name" />
      <input value={row.email || ''} onChange={(e) => setRow((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
      <input value={row.ward_no || ''} onChange={(e) => setRow((s) => ({ ...s, ward_no: e.target.value }))} placeholder="Ward" />
      <input value={row.city || ''} onChange={(e) => setRow((s) => ({ ...s, city: e.target.value }))} placeholder="City" />
      <select value={row.role || 'citizen'} onChange={(e) => setRow((s) => ({ ...s, role: e.target.value }))}>
        <option value="citizen">citizen</option>
        <option value="admin">admin</option>
      </select>
      <button onClick={() => onSave(row)}>Save profile</button>
    </div>
  );
}

function EditableProject({ value, onSave, onDelete }) {
  const [row, setRow] = useState(value);
  useEffect(() => setRow(value), [value]);
  return (
    <div className="card">
      <input value={row.title || ''} onChange={(e) => setRow((s) => ({ ...s, title: e.target.value }))} />
      <textarea value={row.description || ''} onChange={(e) => setRow((s) => ({ ...s, description: e.target.value }))} />
      <input value={row.location_text || ''} onChange={(e) => setRow((s) => ({ ...s, location_text: e.target.value }))} placeholder="Location" />
      <div className="row">
        <select value={row.status || 'in_progress'} onChange={(e) => setRow((s) => ({ ...s, status: e.target.value }))}>
          <option value="not_started">not_started</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
        </select>
        <input
          type="number"
          min="0"
          max="100"
          value={row.progress_percent ?? 0}
          onChange={(e) => setRow((s) => ({ ...s, progress_percent: e.target.value }))}
          placeholder="% Completed"
        />
      </div>
      <div className="row">
        <input value={row.budget || ''} onChange={(e) => setRow((s) => ({ ...s, budget: e.target.value }))} placeholder="Budget" />
        <input value={row.contractor || ''} onChange={(e) => setRow((s) => ({ ...s, contractor: e.target.value }))} placeholder="Contractor" />
      </div>
      <div className="row">
        <input value={row.start_date || ''} onChange={(e) => setRow((s) => ({ ...s, start_date: e.target.value }))} placeholder="Start date" />
        <input value={row.expected_completion_date || ''} onChange={(e) => setRow((s) => ({ ...s, expected_completion_date: e.target.value }))} placeholder="Expected completion" />
      </div>
      <input value={row.image_url || ''} onChange={(e) => setRow((s) => ({ ...s, image_url: e.target.value }))} placeholder="Image URL" />
      <div className="row">
        <button onClick={() => onSave(row)}>Save</button>
        <button className="danger" onClick={() => onDelete(row.id)}>Delete</button>
      </div>
    </div>
  );
}

export default App;

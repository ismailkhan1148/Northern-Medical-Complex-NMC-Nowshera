import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 📊 Real Database Stats State
  const [stats, setStats] = useState({
    totalDoctors: 0,
    registeredPatients: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Admin session not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(
        response.data || {
          totalDoctors: 0,
          registeredPatients: 0,
          todayAppointments: 0
        }
      );
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to sync live data stream.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById('dashboard-premium-fonts')) {
      const link = document.createElement('link');
      link.id = 'dashboard-premium-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }

    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  const navigationItems = [
    { id: 'dashboard', label: 'Overview Control', icon: '📊' },
    { id: 'doctors', label: 'Doctor Management', icon: '👨‍⚕️' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'patients', label: 'Patient Data Control', icon: '🏥' },
    { id: 'appointments', label: 'Appointments & Scheduling', icon: '📅' },
    { id: 'billing', label: 'Billing & Finance', icon: '💳' },
    { id: 'inventory', label: 'Inventory & Pharmacy', icon: '📦' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
    { id: 'maintenance', label: 'System Maintenance', icon: '⚙️' },
  ];

  const currentNavItem = navigationItems.find((item) => item.id === activeTab);

  // Doctor management states
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    fullName: '', email: '', password: '', phone: '', gender: '', dob: '', address: '',
    specialization: '', qualification: '', experienceYears: '', consultationFee: '', availabilityStatus: 'Available', availableHours: ''
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const viewDoctorAppointments = async (doctor) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/doctors/${doctor.DoctorID}/appointments`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedDoctor({ info: doctor, appointments: Array.isArray(res.data) ? res.data : [] });
      setIsViewModalOpen(true);
    } catch (err) {
      console.error('Error loading doctor appointments:', err);
      alert('Failed to load appointments');
    }
  };

  const fetchDoctors = useCallback(async (q = '') => {
    const token = localStorage.getItem('token');
    setDoctorsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/doctors${q ? `?q=${encodeURIComponent(q)}` : ''}` , {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching doctors list:', err);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctors();
    }
  }, [activeTab, fetchDoctors]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(searchQuery);
  };

  const handleDeleteDoctor = async (doctorID) => {
    if (!confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/doctors/${doctorID}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchDoctors(searchQuery);
      fetchDashboardStats();
      alert('Doctor deleted');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const handleNewDoctorChange = (e) => {
    setNewDoctorForm({ ...newDoctorForm, [e.target.name]: e.target.value });
  };

  const submitNewDoctor = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/admin/doctors', newDoctorForm, { headers: { Authorization: `Bearer ${token}` } });
      closeAddModal();
      setNewDoctorForm({ fullName: '', email: '', password: '', phone: '', gender: '', dob: '', address: '', specialization: '', qualification: '', experienceYears: '', consultationFee: '', availabilityStatus: 'Available', availableHours: '' });
      fetchDoctors();
      fetchDashboardStats();
      alert('Doctor added');
    } catch (err) {
      console.error('Add doctor error:', err);
      alert(err.response?.data?.message || 'Failed to add doctor');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-lg shadow-md shadow-blue-500/20">⚡</div>
            <div>
              <span className="font-extrabold text-white text-sm block tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NMC Admin Portal</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Root Supervisor Node</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10 font-extrabold' : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="font-medium">Secure Session Active</span>
            <span className="text-blue-400 font-bold">Admin Tier-1</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
          >
            <span>🚪</span><span>Secure System Sign-Out</span>
          </button>
        </div>
      </div>

      {/* RIGHT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Hospital Node</span><span>/</span>
            <span className="text-blue-600">{currentNavItem?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`w-2.5 h-2.5 rounded-full ${error ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {error ? 'Sync Interrupted' : 'Live Environment'}
            </span>
          </div>
        </header>

        <main className="p-8 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Overview Command Center</h1>
                <p className="text-slate-500 text-xs mt-0.5">Real-time digital analytics of Northern Medical Complex Nowshera.</p>
              </div>

              {/* Error Callout if Backend fails */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-700 font-semibold">
                  ⚠️ {error} - Showing fallback system cache. Please configure backend endpoints.
                </div>
              )}

              {/* Grid Metrics Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Doctors Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Doctors</h3>
                    {loading ? (
                      <div className="h-8 w-12 bg-slate-200 animate-pulse rounded mt-2"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {stats.totalDoctors}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">👨‍⚕️</div>
                </div>

                {/* Patients Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</h3>
                    {loading ? (
                      <div className="h-8 w-12 bg-slate-200 animate-pulse rounded mt-2"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {stats.registeredPatients}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">🩹</div>
                </div>

                {/* Appointments Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Appointments</h3>
                    {loading ? (
                      <div className="h-8 w-12 bg-slate-200 animate-pulse rounded mt-2"></div>
                    ) : (
                      <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {stats.todayAppointments}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">📅</div>
                </div>

              </div>
            </div>
          )}

          {/* Doctor Management Tab */}
          {activeTab === 'doctors' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Doctor Management</h2>
                  <p className="text-slate-400 text-xs mt-1">Search, add, view and remove doctors from the system.</p>
                </div>
                <div className="flex items-center gap-3">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <input value={searchQuery} onChange={handleSearchChange} placeholder="Search doctors by name or email..." className="px-3 py-2 rounded-xl border bg-slate-50 text-sm" />
                    <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm">Search</button>
                  </form>
                  <button onClick={openAddModal} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Add New Doctor</button>
                </div>
              </div>

              {doctorsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No doctors found.</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/70 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="py-3 pl-4">Name</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Specialization</th>
                        <th className="py-3">Fee</th>
                        <th className="py-3">Appointments</th>
                        <th className="py-3 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm bg-white divide-y divide-slate-200">
                      {doctors.map((d) => (
                        <tr key={d.DoctorID} className="hover:bg-slate-50">
                          <td className="py-3 pl-4 font-bold">{d.FullName}</td>
                          <td className="py-3">{d.Email}</td>
                          <td className="py-3">{d.Specialization}</td>
                          <td className="py-3">Rs. {d.ConsultationFee}</td>
                          <td className="py-3">{d.AppointmentCount}</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => viewDoctorAppointments(d)} className="text-blue-600 text-sm font-bold">View</button>
                              <button onClick={() => handleDeleteDoctor(d.DoctorID)} className="text-rose-600 text-sm font-bold">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View Modal */}
              {isViewModalOpen && selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-lg">{selectedDoctor.info.FullName}</h3>
                        <p className="text-sm text-slate-500">{selectedDoctor.info.Email} • {selectedDoctor.info.Specialization}</p>
                      </div>
                      <button onClick={() => { setIsViewModalOpen(false); setSelectedDoctor(null); }} className="text-slate-600">✕</button>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-bold mb-2">Appointments</h4>
                      {selectedDoctor.appointments.length === 0 ? (
                        <div className="text-slate-400">No appointments found for this doctor.</div>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedDoctor.appointments.map((a) => (
                            <li key={a.AppointmentID} className="border-b py-2">
                              <div className="flex justify-between">
                                <div>
                                  <div className="font-bold">{a.PatientName}</div>
                                  <div className="text-xs text-slate-500">{a.AppointmentDate} • {a.AppointmentTime}</div>
                                </div>
                                <div className="text-sm font-bold">{a.Status}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="mt-6 text-right">
                      <button onClick={() => { setIsViewModalOpen(false); setSelectedDoctor(null); }} className="px-4 py-2 bg-slate-800 text-white rounded-xl">Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Doctor Modal */}
              {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-extrabold text-lg">Add New Doctor</h3>
                      <button onClick={closeAddModal} className="text-slate-600">✕</button>
                    </div>
                    <form onSubmit={submitNewDoctor} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input name="fullName" value={newDoctorForm.fullName} onChange={handleNewDoctorChange} placeholder="Full Name" className="px-3 py-2 border rounded-xl" required />
                        <input name="email" value={newDoctorForm.email} onChange={handleNewDoctorChange} placeholder="Email" type="email" className="px-3 py-2 border rounded-xl" required />
                        <input name="password" value={newDoctorForm.password} onChange={handleNewDoctorChange} placeholder="Password" type="password" className="px-3 py-2 border rounded-xl" required />
                        <input name="phone" value={newDoctorForm.phone} onChange={handleNewDoctorChange} placeholder="Phone" className="px-3 py-2 border rounded-xl" />
                        <input name="gender" value={newDoctorForm.gender} onChange={handleNewDoctorChange} placeholder="Gender" className="px-3 py-2 border rounded-xl" />
                        <input name="dob" value={newDoctorForm.dob} onChange={handleNewDoctorChange} placeholder="DOB" type="date" className="px-3 py-2 border rounded-xl" />
                        <input name="address" value={newDoctorForm.address} onChange={handleNewDoctorChange} placeholder="Address" className="px-3 py-2 border rounded-xl col-span-2" />
                      </div>
                      <hr />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input name="specialization" value={newDoctorForm.specialization} onChange={handleNewDoctorChange} placeholder="Specialization" className="px-3 py-2 border rounded-xl" required />
                        <input name="qualification" value={newDoctorForm.qualification} onChange={handleNewDoctorChange} placeholder="Qualification" className="px-3 py-2 border rounded-xl" required />
                        <input name="experienceYears" value={newDoctorForm.experienceYears} onChange={handleNewDoctorChange} placeholder="Experience Years" type="number" className="px-3 py-2 border rounded-xl" />
                        <input name="consultationFee" value={newDoctorForm.consultationFee} onChange={handleNewDoctorChange} placeholder="Consultation Fee" type="number" className="px-3 py-2 border rounded-xl" />
                        <input name="availableHours" value={newDoctorForm.availableHours} onChange={handleNewDoctorChange} placeholder="Available Hours" className="px-3 py-2 border rounded-xl" />
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={closeAddModal} className="px-4 py-2 rounded-xl border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Create Doctor</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placeholders for other tabs remain organized */}
          {activeTab !== 'dashboard' && activeTab !== 'doctors' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60">
              <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {currentNavItem?.label}
              </h2>
              <div className="mt-6 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 text-xs font-semibold">
                Workspaces Module Interface Coming Soon.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

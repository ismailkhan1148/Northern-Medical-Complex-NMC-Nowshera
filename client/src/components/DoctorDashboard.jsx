import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

function DoctorDashboard({ onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ today: 0, pending: 0, total: 0 });
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 🔒 SECURITY PROTECTION
  const loggedInDoctorID = Number(localStorage.getItem('activeDoctorID'));

  // 🗓️ POPUP DIALOGUE MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDoctorName, setModalDoctorName] = useState('');
  const [modalAppointments, setModalAppointments] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const allDoctorsList = [
    { id: 8, name: 'Dr. Muhammad Ismail' },
    { id: 9, name: 'Dr. Ayesha Khan' },
    { id: 10, name: 'Dr. Anees Khan' },
    { id: 11, name: 'Dr. Tahir Ali Shah' },
    { id: 13, name: 'Dr. Muhammad Ramzan' },
  ];

  const fetchDashboardData = useCallback(async () => {
    if (!loggedInDoctorID || Number.isNaN(loggedInDoctorID)) {
      setError('Doctor session not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let profileData = null;
      try {
        const profileRes = await axios.get(
          `http://localhost:5000/api/doctor/profile/${loggedInDoctorID}`
        );
        profileData = profileRes.data;
      } catch (profileErr) {
        console.error('Profile load error:', profileErr);
      }
      setDoctorProfile(profileData);

      const appointmentsRes = await axios.get(
        `http://localhost:5000/api/doctor/appointments/${loggedInDoctorID}`
      );
      const appointmentsData = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : [];

      setAppointments(appointmentsData);
      setStats({
        today: appointmentsData.length,
        pending: appointmentsData.filter((app) => app.Status === 'Pending').length,
        total: appointmentsData.filter((app) => app.Status === 'Confirmed').length,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Database connectivity error.');
    } finally {
      setLoading(false);
    }
  }, [loggedInDoctorID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchPatientHistory = async (patientID) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/doctor/patient-history/${patientID}`
      );
      setSelectedHistory(Array.isArray(res.data) ? res.data : []);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('History load error:', err);
      alert('History load nahi ho saki.');
    }
  };

  const handleViewOtherSchedule = async (doctorId, doctorName) => {
    if (!doctorId || doctorId === loggedInDoctorID) return;

    setModalDoctorName(doctorName);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalAppointments([]);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/doctor/appointments/${doctorId}`
      );
      setModalAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching modal appointments:', err);
      setModalAppointments([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentID, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/doctor/update-status/${appointmentID}`,
        { status: newStatus }
      );
      await fetchDashboardData();
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.response?.data?.message || 'Status update fail ho gaya!');
    }
  };

  const formatTime = (timeData) => {
    if (!timeData) return 'N/A';
    try {
      let strTime = String(timeData);
      if (strTime.includes('T')) {
        strTime = strTime.split('T')[1].slice(0, 8);
      }
      const timeParts = strTime.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
      }
      return strTime;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans antialiased text-slate-800 relative selection:bg-blue-500 selection:text-white">
      {/* 🏥 GRAND HOSPITAL BRANDING BLOCK */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-blue-500/10 text-white">
              🏥
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Northern Medical Complex Nowshera
              </h1>
              <p className="text-blue-600 font-extrabold tracking-widest text-xs uppercase mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Enterprise Clinical Dashboard Node
              </p>
            </div>
          </div>
        </div>
      </div>

      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-black mb-4">Patient Medical History</h2>
            <div className="max-h-60 overflow-y-auto">
              {selectedHistory.length > 0 ? (
                selectedHistory.map((rec, i) => (
                  <div key={i} className="mb-4 border-b pb-2">
                    <p className="font-bold text-sm">{rec.Diagnosis}</p>
                    <p className="text-[10px] text-slate-400">
                      {rec.Date ? new Date(rec.Date).toDateString() : 'No date'}
                    </p>
                  </div>
                ))
              ) : (
                <p>Koi history record nahi mila.</p>
              )}
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="mt-6 w-full bg-slate-800 text-white py-2 rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🌟 PREMIUM DOCTOR PROFILE & HEADER CONTROLS */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white border border-white/20 shadow-lg">
              {doctorProfile?.FullName
                ? doctorProfile.FullName.replace('Dr. ', '').charAt(0)
                : 'D'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {doctorProfile?.FullName
                    ? doctorProfile.FullName.startsWith('Dr.')
                      ? doctorProfile.FullName
                      : `Dr. ${doctorProfile.FullName}`
                    : 'Loading Profile...'}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  {doctorProfile?.AvailabilityStatus || 'Available'}
                </span>
              </div>
              <p className="text-blue-50 text-xs font-medium mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-95">
                <span className="font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-lg">
                  {doctorProfile?.Specialization || 'Specialist'}
                </span>
                <span className="text-blue-100/80">•</span>
                <span className="bg-white/5 px-2.5 py-0.5 rounded-lg">
                  {doctorProfile?.Qualification || 'MBBS'}
                </span>
                <span className="text-blue-100/80">•</span>
                <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-400/30">
                  Fee: Rs. {doctorProfile?.ConsultationFee || '1000'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md self-start lg:self-center w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-black tracking-wider uppercase text-blue-50 pl-1">
                Schedule Lookup:
              </span>
              <select
                value=""
                onChange={(e) => {
                  const selectedObj = allDoctorsList.find(
                    (d) => d.id === Number(e.target.value)
                  );
                  if (selectedObj) {
                    handleViewOtherSchedule(selectedObj.id, selectedObj.name);
                  }
                }}
                className="bg-white/20 hover:bg-white/30 border border-white/20 rounded-xl text-xs font-bold px-3 py-2 text-white focus:outline-none cursor-pointer min-w-[150px] w-full sm:w-auto transition-all"
              >
                <option value="" disabled className="text-slate-900 bg-white font-bold">
                  Select Doctor...
                </option>
                {allDoctorsList
                  .filter((d) => d.id !== loggedInDoctorID)
                  .map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-900 bg-white font-semibold">
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="h-6 w-[1px] bg-white/20 hidden sm:block"></div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 text-white text-xs font-black px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer text-center uppercase tracking-wider border border-rose-500/30"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* 📊 VISUAL STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Appointments</p>
          <div className="flex justify-between items-end mt-3">
            <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.today}</p>
            <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl text-xl">📋</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
          <div className="flex justify-between items-end mt-3">
            <p className="text-4xl font-black text-amber-500 tracking-tight">{stats.pending}</p>
            <span className="p-3 bg-amber-50 text-amber-500 rounded-2xl text-xl">⏳</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Confirmed Patients</p>
          <div className="flex justify-between items-end mt-3">
            <p className="text-4xl font-black text-emerald-600 tracking-tight">{stats.total}</p>
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl text-xl">✅</span>
          </div>
        </div>
      </div>

      {/* 🗓️ MAIN PATIENT DATATABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Active Patient Schedule</h2>
          <p className="text-slate-400 text-xs mt-1">Real-time live appointments list synced with system records.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-400">Syncing database...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200/80 rounded-2xl bg-slate-50/50 font-medium">
            <span className="text-4xl block mb-3">📭</span>
            Is doctor ke liye filhal koi appointment booked nahi hay.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/70 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 pl-6">Patient Name</th>
                  <th className="py-4">Date</th>
                  <th className="py-4">Time Slot</th>
                  <th className="py-4">Reason / Complaint</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-xs divide-y divide-slate-200/60 bg-white">
                {appointments.map((app) => (
                  <tr key={app.AppointmentID} className="hover:bg-slate-50 transition-all duration-150 group cursor-pointer">
                    <td className="py-4 pl-6 text-sm font-medium text-slate-700 uppercase">{app.PatientName}</td>
                    <td className="py-4 text-slate-600 font-medium">
                      {app.AppointmentDate ? new Date(app.AppointmentDate).toISOString().split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1 rounded-xl text-[11px] tracking-tight border border-slate-200">
                        {formatTime(app.AppointmentTime)}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 font-medium max-w-xs truncate">
                      {app.Reason || 'General Checkup'}
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-xs ${
                          app.Status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.Status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {app.Status}
                      </span>
                    </td>
                    <td className="py-4 pr-6">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => fetchPatientHistory(app.PatientID)}
                          className="text-blue-600 font-bold text-xs hover:underline"
                        >
                          View History
                        </button>
                        {app.Status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(app.AppointmentID, 'Confirmed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all active:scale-95"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app.AppointmentID, 'Cancelled')}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all active:scale-95"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                            {app.Status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🖼️ INTERACTIVE LOOKUP POPUP DIALOGUE BOX */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200/80 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Schedule Lookup View</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium">
                  Viewing schedule for: <span className="text-blue-600 font-bold">{modalDoctorName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center cursor-pointer shadow-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] bg-white">
              {modalLoading ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold text-slate-400">Loading doctor's book...</span>
                </div>
              ) : modalAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-sm font-medium">
                  Is doctor ke paas filhal koi booked patient nahi hay.
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 pl-4">Patient Name</th>
                        <th className="py-3">Date</th>
                        <th className="py-3">Time Slot</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 text-xs font-medium divide-y divide-slate-100">
                      {modalAppointments.map((app) => (
                        <tr key={app.AppointmentID} className="hover:bg-slate-50/50">
                          <td className="py-3 pl-4 font-bold text-slate-700">{app.PatientName}</td>
                          <td className="py-3 text-slate-500">
                            {app.AppointmentDate ? new Date(app.AppointmentDate).toISOString().split('T')[0] : 'N/A'}
                          </td>
                          <td className="py-3">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg border border-slate-200/20 shadow-sm">
                              {formatTime(app.AppointmentTime)}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                                app.Status === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50'
                                  : app.Status === 'Cancelled'
                                    ? 'bg-rose-50 text-rose-500 border-rose-200/50'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/50'
                              }`}
                            >
                              {app.Status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                ⚠️ Read-only view. Actions are disabled for security.
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer tracking-wide uppercase"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;


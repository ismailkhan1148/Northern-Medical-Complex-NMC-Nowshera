import { useEffect, useState } from 'react';
import axios from 'axios'; // Yeh sahi library hai

function PatientDashboard({ onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });

  const patientName = localStorage.getItem('userName') || 'Patient';
  const patientEmail = localStorage.getItem('userEmail') || 'Not available';

  const patientProfile = {
    FullName: patientName,
    Contact: patientEmail,
    BloodGroup: "O+",
    Age: 24
  };

  useEffect(() => {
    // Injecting a high-end dynamic corporate font link directly for clean rendering
    if (!document.getElementById('premium-font-link')) {
      const link = document.createElement('link');
      link.id = 'premium-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }

    // Backend API se doctors ka real data lekar aana
    axios.get('http://localhost:5000/api/doctor')
      .then(response => {
        setDoctors(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Frontend Fetch Error:", err);
        setError('Doctors ka data load nahi ho saka.');
        setLoading(false);
      });
  }, []);

  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingMessage('');
    setBookingError('');
    setAppointmentForm({
      appointmentDate: '',
      appointmentTime: '',
      reason: ''
    });
  };

  const closeBookingModal = () => {
    if (bookingLoading) return;
    setSelectedDoctor(null);
  };

  const handleAppointmentChange = (e) => {
    setAppointmentForm({ ...appointmentForm, [e.target.name]: e.target.value });
  };

  const submitAppointment = async (e) => {
    e.preventDefault();

    const patientID = Number(localStorage.getItem('activePatientID') || localStorage.getItem('userID'));
    if (!patientID || Number.isNaN(patientID)) {
      setBookingError('Patient session not found. Please login again.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/doctor/appointments', {
        patientID,
        doctorID: selectedDoctor.DoctorID,
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: appointmentForm.appointmentTime,
        reason: appointmentForm.reason
      });

      setBookingMessage(response.data?.message || 'Appointment request submitted successfully.');
      setAppointmentForm({
        appointmentDate: '',
        appointmentTime: '',
        reason: ''
      });
    } catch (err) {
      console.error('Appointment booking error:', err);
      setBookingError(err.response?.data?.message || 'Appointment book nahi ho saki.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div 
      className="p-4 md:p-8 bg-slate-50 min-h-screen antialiased text-slate-800 relative selection:bg-blue-500 selection:text-white"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >
      
      {/* 🏥 GRAND HOSPITAL BRANDING BLOCK */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-blue-500/10 text-white">
              🏥
            </div>
            <div className="flex-1">
              <h1 
                className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Northern Medical Complex Nowshera
              </h1>
              <p className="text-blue-600 font-bold tracking-widest text-xs uppercase mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Enterprise Clinical Dashboard Node
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 PREMIUM PATIENT PROFILE GRADIENT BANNER */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white border border-white/20 shadow-lg">
              {patientProfile.FullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  PATIENT NAME: {patientProfile.FullName}
                </h2>
                <span className="bg-blue-500/30 text-white border border-white/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  Active Portal User
                </span>
              </div>
              <p className="text-blue-50 text-xs font-medium mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-95">
                <span className="font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-lg">Contact: {patientProfile.Contact}</span>
                <span className="text-blue-100/80">•</span>
                <span className="bg-white/5 px-2.5 py-0.5 rounded-lg">Blood Group: {patientProfile.BloodGroup}</span>
                <span className="text-blue-100/80">•</span>
                <span className="text-white font-bold bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">Age: {patientProfile.Age} Years</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center w-full sm:w-auto">
            <button 
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:scale-95 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer text-center uppercase tracking-wider border border-rose-500/30"
            >
              Log Out
            </button>
          </div>

        </div>
      </div>

      {/* 🗓️ MAIN HEADINGS */}
      <div className="mb-6">
        <h2 
          className="text-2xl font-extrabold text-slate-800 tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Our Available Specialists
        </h2>
        <p className="text-slate-400 text-xs mt-1">Select a consultant below to view schedule slots and request your clinical checkup.</p>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading specialists track...</span>
        </div>
      )}
      
      {error && (
        <div className="text-center py-10 text-red-600 font-medium bg-red-50 rounded-xl p-4 max-w-md mx-auto border border-red-200">
          {error}
        </div>
      )}

      {/* Doctors Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.DoctorID} className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 
                    className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {doctor.FullName.startsWith('Dr.') ? doctor.FullName : `Dr. ${doctor.FullName}`}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${
                    doctor.AvailabilityStatus === 'Available' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {doctor.AvailabilityStatus}
                  </span>
                </div>
                
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4 bg-blue-50/60 inline-block px-2.5 py-1 rounded-lg border border-blue-100">
                  {doctor.Specialization} <span className="text-slate-400 font-normal normal-case">({doctor.Qualification})</span>
                </h4>
                
                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-medium">Professional Practice:</span> 
                    <span className="font-semibold text-slate-700">{doctor.ExperienceYears} Years</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-medium">Consultation Fee:</span> 
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Rs. {doctor.ConsultationFee}</span>
                  </p>
                  <p className="flex flex-col gap-1 pt-1">
                    <span className="text-slate-400 font-medium">Available Shifts:</span> 
                    <span className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 text-[11px]">
                      ⏱️ {doctor.AvailableHours || '09:00 AM - 02:00 PM'}
                    </span>
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => openBookingModal(doctor)}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer uppercase tracking-wider border border-blue-500/20"
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Book Appointment</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedDoctor.FullName.startsWith('Dr.') ? selectedDoctor.FullName : `Dr. ${selectedDoctor.FullName}`} - {selectedDoctor.Specialization}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBookingModal}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 font-bold"
              >
                X
              </button>
            </div>

            <form onSubmit={submitAppointment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={appointmentForm.appointmentDate}
                    onChange={handleAppointmentChange}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={appointmentForm.appointmentTime}
                    onChange={handleAppointmentChange}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason</label>
                <textarea
                  name="reason"
                  value={appointmentForm.reason}
                  onChange={handleAppointmentChange}
                  rows="3"
                  placeholder="General checkup, fever, follow-up..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>

              {bookingError && (
                <div className="rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-3 text-sm font-semibold">
                  {bookingError}
                </div>
              )}

              {bookingMessage && (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 text-sm font-semibold">
                  {bookingMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold"
                >
                  {bookingLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboard;

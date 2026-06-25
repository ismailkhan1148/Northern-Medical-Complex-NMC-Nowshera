import { useState, useEffect } from 'react';
import axios from 'axios';
// Naye dashboards import kar rahe hain
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [animate, setAnimate] = useState(false); // Smooth slide/fade effect k liye state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || null;
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Admin'
  });

  const API_URL = 'http://localhost:5000/api/auth';

  useEffect(() => {
    // Injecting professional corporate fonts dynamically
    if (!document.getElementById('app-premium-fonts')) {
      const link = document.createElement('link');
      link.id = 'app-premium-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Tabs toggle trigger for visual smooth transitions
  const handleTabChange = (status) => {
    if (status !== isLogin) {
      setAnimate(true);
      setTimeout(() => {
        setIsLogin(status);
        setMessage('');
        setAnimate(false);
      }, 250);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password
        });

        const loggedUser = res.data.user || {};
        const role = loggedUser.role;

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userID', loggedUser.userID ? String(loggedUser.userID) : '');
        localStorage.setItem('userEmail', loggedUser.email || '');
        localStorage.setItem('userName', loggedUser.fullName || '');

        if (role === 'Doctor' && loggedUser.userID) {
          localStorage.setItem('activeDoctorID', String(loggedUser.userID));
        } else {
          localStorage.removeItem('activeDoctorID');
        }

        if (role === 'Patient' && loggedUser.userID) {
          localStorage.setItem('activePatientID', String(loggedUser.userID));
        } else {
          localStorage.removeItem('activePatientID');
        }

        setMessage('Login Successful!');
        setUserRole(role);
      } else {
        await axios.post(`${API_URL}/register`, formData);
        setMessage('Registration Successful! Please switch to Login tab.');
        setFormData({ fullName: '', email: '', password: '', role: 'Admin' });
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Server connection failed!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userID');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeDoctorID');
    localStorage.removeItem('activePatientID');
    setUserRole(null);
    setMessage('You have been logged out.');
    setIsError(false);
  };

  if (userRole === 'Admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (userRole === 'Doctor') {
    return <DoctorDashboard onLogout={handleLogout} />;
  }

  if (userRole === 'Patient') {
    return <PatientDashboard onLogout={handleLogout} />;
  }

  return (
    <div 
      className="flex min-h-screen bg-slate-50 antialiased overflow-hidden selection:bg-blue-500 selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* 🏥 LEFT COLUMN: CORPORATE BRANDING & FACILITY OVERLAY */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80" 
            alt="Northern Medical Complex Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
        </div>

        {/* Top Content: Branding Tag */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
            🏥
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-lg block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              NMC Enterprise
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block -mt-1">
              Clinical Core Node
            </span>
          </div>
        </div>

        {/* Middle Content: Hospital Core Details */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 backdrop-blur-md">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Nowshera Campus System Active
          </div>
          
          <h1 
            className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Northern Medical Complex Nowshera
          </h1>
          
          <p className="text-slate-300 text-sm leading-relaxed">
            Welcome to the centralized enterprise dashboard. NMC provides advanced emergency assistance, automated specialist booking trackers, and specialized laboratory integrations seamlessly synchronized for healthcare delivery.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Emergency</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">50+</p>
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Specialists</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">100%</p>
              <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Digital Records</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Details */}
        <div className="relative z-10 text-xs text-slate-500 flex justify-between items-center">
          <span>© 2026 Northern Medical Complex Inc.</span>
          <span className="font-semibold text-slate-400">v4.2.1-Prod</span>
        </div>
      </div>

      {/* 🔐 RIGHT COLUMN: CLINICAL LOBBY & PREMIUM DOCTOR BACKGROUND */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 relative bg-slate-100">
        
        {/* Dynamic Professional Doctor Image Background */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80" 
            alt="Clinical Infrastructure Lobby"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Decorative soft gradients to preserve form high-contrast readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-slate-100/70 to-blue-50/50 z-0 pointer-events-none"></div>

        {/* Content Card Panel */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white rounded-3xl shadow-2xl shadow-slate-900/10 p-8 relative z-10 transition-all duration-300">
          
          {/* Header Switch Tabs with indicator styling */}
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl mb-8 border border-slate-200/40 relative">
            <button 
              type="button" 
              onClick={() => handleTabChange(true)} 
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 relative z-10 cursor-pointer ${
                isLogin ? 'text-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isLogin && <span className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10 transition-all duration-300"></span>}
              Sign In Node
            </button>
            <button 
              type="button" 
              onClick={() => handleTabChange(false)} 
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 relative z-10 cursor-pointer ${
                !isLogin ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {!isLogin && <span className="absolute inset-0 bg-white rounded-xl shadow-xs -z-10 transition-all duration-300"></span>}
              Register Node
            </button>
          </div>

          {/* Form wrapper with Visual Shift Effects */}
          <div className={`transition-all duration-300 ease-in-out transform ${
            animate ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-2">
                <h2 
                  className="text-2xl font-extrabold text-slate-900 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {isLogin ? 'Welcome Back Account' : 'Create Access Profile'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">Provide your credentials below to authenticate into your medical tier.</p>
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Muhammad Ismail"
                    className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 placeholder:text-slate-300" 
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="ismail@example.com"
                  className={`w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm transition-all placeholder:text-slate-300 ${
                    isLogin 
                      ? 'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5' 
                      : 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5'
                  } focus:bg-white`} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••"
                  className={`w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm transition-all placeholder:text-slate-300 ${
                    isLogin 
                      ? 'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5' 
                      : 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5'
                  } focus:bg-white`} 
                />
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Portal Role Access</label>
                  <div className="relative">
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange} 
                      className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm appearance-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 text-slate-700 font-medium"
                    >
                      <option value="Admin">Admin Portal</option>
                      <option value="Doctor">Doctor Dashboard</option>
                      <option value="Patient">Patient Portal</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className={`w-full text-white text-xs font-bold p-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-md uppercase tracking-wider cursor-pointer mt-2 ${
                  isLogin 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/10 border border-blue-500/20' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/10 border border-emerald-500/20'
                }`}
              >
                {isLogin ? 'Establish Secure Sign In' : 'Register Secure Profile'}
              </button>
            </form>
          </div>

          {/* Toast Messages Notifications */}
          {message && (
            <div className={`mt-5 p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
              isError 
                ? 'bg-rose-50 text-rose-700 border-rose-200/60' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
            }`}>
              <span>{isError ? '⚠️' : '✅'}</span>
              <span>{message}</span>
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}

export default App;

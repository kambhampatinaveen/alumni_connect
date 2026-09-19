import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { NotificationProvider } from './context/NotificationContext';

// Navigation & Layout
import Sidebar from './components/admin/Sidebar';

// Admin Views
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageAlumni from './pages/admin/ManageAlumni';
import ManageStudents from './pages/admin/ManageStudents';
import PlatformSettings from './pages/admin/PlatformSettings';

// Alumni Views
import AlumniDashboard from './pages/alumni/AlumniDashboard';
import AlumniProfileView from './pages/alumni/AlumniProfileView';

// Student Views
import StudentDashboard from './pages/student/StudentDashboard';
import FindAlumni from './pages/student/FindAlumni';

// Shared Community & Operations Views
import EventsList from './pages/events/EventsList';
import EventDetail from './pages/events/EventDetail';
import MyMentorships from './pages/mentorship/MyMentorships';
import MyReferrals from './pages/referrals/MyReferrals';
import SubmitReferral from './pages/referrals/SubmitReferral';
import ChatPlatform from './pages/chat/ChatPlatform';

// Auth Pages (Image 1 Sign In & Sign Up)
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';

// ─── Main Authenticated Layout ───────────────────────────────────────────────
function MainLayout() {
  const { role } = useAuth();
  
  const getDefaultTab = (r) => {
    if (r === 'alumni') return 'alumni-dashboard';
    if (r === 'student') return 'student-dashboard';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(() => getDefaultTab(role));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(getDefaultTab(role));
  }, [role]);

  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('navigate-tab', handleNavEvent);
    return () => window.removeEventListener('navigate-tab', handleNavEvent);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleBackToOverview = () => setActiveTab(getDefaultTab(role));

  const renderContent = () => {
    // Role protection: Non-admins cannot access admin management views
    const adminOnlyViews = ['dashboard', 'alumni', 'students', 'manage-events', 'settings'];
    if (adminOnlyViews.includes(activeTab) && role !== 'admin') {
      return role === 'alumni' 
        ? <AlumniDashboard onNavigate={(tab) => setActiveTab(tab)} onToggleSidebar={toggleSidebar} />
        : <StudentDashboard onNavigate={(tab) => setActiveTab(tab)} onToggleSidebar={toggleSidebar} />;
    }

    // Role protection: Admin cannot access Live Chat Hub (chat removed from Admin portal)
    if (activeTab === 'chat' && role === 'admin') {
      return <AdminDashboard onToggleSidebar={toggleSidebar} />;
    }

    switch (activeTab) {
      // Admin Views (Full platform management)
      case 'dashboard':        return <AdminDashboard onToggleSidebar={toggleSidebar} />;
      case 'alumni':           return <ManageAlumni onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;
      case 'students':         return <ManageStudents onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;
      case 'manage-events':    return <EventsList onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'settings':         return <PlatformSettings onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;

      // Alumni Views
      case 'alumni-dashboard': return <AlumniDashboard onNavigate={(tab) => setActiveTab(tab)} onToggleSidebar={toggleSidebar} />;
      case 'alumni-profile':   return <AlumniProfileView onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;

      // Student Views
      case 'student-dashboard': return <StudentDashboard onNavigate={(tab) => setActiveTab(tab)} onToggleSidebar={toggleSidebar} />;
      case 'find-alumni':      return <FindAlumni onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} onNavigateToChat={() => setActiveTab('chat')} />;

      // Shared Operations Views
      case 'events':           return <EventsList onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'mentorship':       return <MyMentorships onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;
      case 'referrals':        return <MyReferrals onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'submit-referral':  return <SubmitReferral onBack={() => setActiveTab('referrals')} onToggleSidebar={toggleSidebar} />;
      case 'chat':             return <ChatPlatform onBack={handleBackToOverview} onToggleSidebar={toggleSidebar} />;

      default:                 return role === 'alumni' ? <AlumniDashboard onNavigate={setActiveTab} onToggleSidebar={toggleSidebar} /> : role === 'student' ? <StudentDashboard onNavigate={setActiveTab} onToggleSidebar={toggleSidebar} /> : <AdminDashboard onToggleSidebar={toggleSidebar} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EBF3FA] text-slate-900 antialiased selection:bg-[#0F4C81] selection:text-white relative">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

// ─── Direct Landing Authentication Gate (Displays Image 1 on open) ────────────
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState('signin'); // Directly defaults to Sign In (Image 1)
  const [targetRole, setTargetRole] = useState('admin');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBF3FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F4C81] flex items-center justify-center shadow-lg shadow-[#0F4C81]/30">
            <svg className="w-7 h-7 text-amber-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm font-bold">Loading AlumniConnect…</p>
        </div>
      </div>
    );
  }

  // If unauthenticated: directly show Sign In (Image 1)
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return (
        <SignUp
          initialRole={targetRole}
          onNavigateToSignIn={() => setAuthView('signin')}
          onSignUpSuccess={() => { /* flips to authenticated */ }}
        />
      );
    }

    return (
      <SignIn
        initialRole={targetRole}
        onNavigateToSignUp={(role) => {
          setTargetRole(role || 'student');
          setAuthView('signup');
        }}
        onLoginSuccess={() => { /* flips to authenticated */ }}
      />
    );
  }

  // Once authenticated: load Dashboard
  return <MainLayout />;
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AlumniConnect UI Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('alumniconnect_token');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#EBF3FA] p-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠
            </div>
            <h2 className="text-xl font-black text-slate-900">Application Notice</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              An unexpected render issue occurred: <br />
              <code className="text-[11px] bg-slate-100 p-1.5 rounded-lg text-rose-600 block mt-2 break-words">
                {this.state.error?.message || 'Unknown render error'}
              </code>
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Clear Cache & Re-login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AuthGate />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

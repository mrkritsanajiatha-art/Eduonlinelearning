import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CertificateVerify from './pages/CertificateVerify';
import Payment from './pages/Payment';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetail from './pages/CourseDetail';
import CoursePlayer from './pages/CoursePlayer';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function App() {
  const { token, setToken, user, fetchUser, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check for token in URL (redirected from Google OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setToken]);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header className="app-header">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
              <img src="https://img2.pic.in.th/1111bcdae880aff7e05f.png" alt="Logo" style={{ height: '40px' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: 'var(--color-secondary)' }}>ONLINE LEARNING</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>by สมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย</p>
              </div>
            </Link>
            <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link to="/" className="nav-link">หน้าแรก</Link>
              <Link to="/courses" className="nav-link">คอร์สเรียน</Link>
              <Link to="/verify" className="nav-link">ตรวจสอบเกียรติบัตร</Link>
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    {user?.picture && <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    {user?.name || 'กำลังโหลด...'}
                  </span>
                  <Link to={user?.role === 'super_admin' ? '/admin' : '/dashboard'} className="btn btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Dashboard</Link>
                  <button onClick={logout} className="btn btn-outline" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>ออกจากระบบ</button>
                </div>
              ) : (
                <a href={`${API_URL}/auth/google/login`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>เข้าสู่ระบบ</a>
              )}
            </nav>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/learn/:courseId" element={<CoursePlayer />} />
            <Route path="/verify" element={<CertificateVerify />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        
        <footer style={{ backgroundColor: '#1E293B', color: 'white', padding: '2rem 0', marginTop: 'auto' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p>&copy; 2026 ONLINE LEARNING by สมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

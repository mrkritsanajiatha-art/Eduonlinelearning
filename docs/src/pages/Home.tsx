import React from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const Home: React.FC = () => {
  return (
    <div className="home-page animate-fade-in">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>แพลตฟอร์มการศึกษาออนไลน์ระดับประเทศ</div>
          <h1 className="hero-title">พัฒนาวิชาชีพครูและ<br/>บุคลากรทางการศึกษา</h1>
          <p className="hero-subtitle">
            ยกระดับศักยภาพของคุณด้วยหลักสูตรที่ได้มาตรฐาน รับรองโดยสมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย เรียนรู้ได้ทุกที่ ทุกเวลา
          </p>
          <div className="hero-actions">
            <Link to="/courses" className="btn btn-accent" style={{ fontSize: '1.1rem' }}>
              <i className="lucide-book-open"></i> ดูคอร์สเรียนทั้งหมด
            </Link>
            <a href={`${API_URL}/auth/google/login`} className="btn btn-outline" style={{ fontSize: '1.1rem' }}>
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '6rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)' }}>ระบบของเราให้อะไรบ้าง?</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '1rem' }}>ฟีเจอร์ที่ออกแบบมาเพื่อการเรียนรู้ที่มีประสิทธิภาพ</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-primary-light)' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 4 6.5 6.5-6.5 6.5"/><path d="m8.5 20-6.5-6.5 6.5-6.5"/><path d="M16 4 8 20"/></svg>
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>อบรมออนไลน์ & สด</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>เรียนรู้ได้ทุกที่ ทุกเวลา พร้อมระบบ Live Training ที่ทันสมัย ผ่าน Zoom และ Google Meet</p>
          </div>
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-success)' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 7V2"/><path d="M15 7V2"/><path d="M6 17a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v5H6z"/><path d="M22 13a2 2 0 0 0-2-2h-3"/><path d="M2 13a2 2 0 0 1 2-2h3"/></svg>
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>เกียรติบัตรดิจิทัล</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>รับเกียรติบัตรทันทีเมื่อเรียนจบ พร้อมระบบตรวจสอบความถูกต้องผ่าน QR Code ที่ปลอดภัย</p>
          </div>
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-accent)' }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
            </div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-secondary)' }}>ยกระดับวิทยฐานะ</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>หลักสูตรถูกออกแบบมาเพื่อรองรับการประเมินวิทยฐานะครูและบุคลากรทางการศึกษา</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

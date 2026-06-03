import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/courses/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setCourse(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;
  if (!course) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>ไม่พบข้อมูลคอร์สเรียน</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary-dark) 100%)', color: 'white', padding: '4rem 1rem' }}>
        <div className="container" style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div className="badge" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.2)', color: 'white' }}>คอร์สเรียนออนไลน์</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'white' }}>{course.title}</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.8 }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>ราคา</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent-light)' }}>
                  {course.price === 0 ? 'เรียนฟรี' : `฿${course.price.toLocaleString()}`}
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <button 
                className="btn btn-primary" 
                style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                onClick={() => navigate(`/payment?courseId=${course.id}`)}
              >
                ลงทะเบียนเรียนเลย
              </button>
            ) : (
              <a href={`${API_URL}/auth/google/login`} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                เข้าสู่ระบบเพื่อลงทะเบียน
              </a>
            )}
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ width: '100%', paddingTop: '56.25%', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}></div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '4rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>สิ่งที่คุณจะได้เรียนรู้</h2>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', listStyle: 'none' }}>
            {['พื้นฐานที่สำคัญ', 'การประยุกต์ใช้งานจริง', 'เทคนิคขั้นสูง', 'กรณีศึกษาและตัวอย่าง'].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

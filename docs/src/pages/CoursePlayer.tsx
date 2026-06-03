import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const [activeLesson, setActiveLesson] = useState(0);

  // Mock lessons since database doesn't have it yet
  const lessons = [
    { title: 'บทที่ 1: แนะนำหลักสูตร', duration: '10:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { title: 'บทที่ 2: พื้นฐานที่ควรทราบ', duration: '45:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { title: 'บทที่ 3: การประยุกต์ใช้ในการสอน', duration: '60:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { title: 'แบบทดสอบท้ายบท', duration: '30:00', isQuiz: true },
  ];

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_URL}/api/courses/${courseId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setCourse(data);
      })
      .finally(() => setLoading(false));
  }, [courseId, isAuthenticated]);

  if (!isAuthenticated) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>กรุณาเข้าสู่ระบบ</div>;
  if (loading) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>กำลังโหลด...</div>;
  if (!course) return <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>ไม่พบคอร์สเรียน หรือคุณยังไม่ได้ลงทะเบียน</div>;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 73px)' }}>
      {/* Sidebar for Lessons */}
      <div style={{ width: '320px', background: 'white', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            &larr; กลับไป Dashboard
          </Link>
          <h3 style={{ fontSize: '1.1rem' }}>{course.title}</h3>
          <div style={{ marginTop: '1rem', background: 'var(--color-background)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: '25%', background: 'var(--color-success)', height: '100%' }}></div>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>เรียนจบแล้ว 25%</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {lessons.map((lesson, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveLesson(idx)}
              style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--color-border)', 
                cursor: 'pointer',
                background: activeLesson === idx ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                borderLeft: activeLesson === idx ? '3px solid var(--color-primary)' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: activeLesson === idx ? 600 : 400, color: activeLesson === idx ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                  {lesson.title}
                </div>
                {idx === 0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-success)" stroke="var(--color-success)" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {lesson.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Player Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-background)' }}>
        <div style={{ padding: '2rem', flex: 1 }}>
          {lessons[activeLesson].isQuiz ? (
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'var(--color-accent)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h2>แบบทดสอบท้ายบท</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0 2rem' }}>ทดสอบความรู้ของคุณเพื่อรับเกียรติบัตร</p>
              <button className="btn btn-accent">เริ่มทำแบบทดสอบ</button>
            </div>
          ) : (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: 'black', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                {/* Mock Video Player */}
                <iframe 
                  src={lessons[activeLesson].videoUrl} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                ></iframe>
              </div>
              <h2 style={{ marginTop: '2rem', fontSize: '1.8rem' }}>{lessons[activeLesson].title}</h2>
              <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>รายละเอียดบทเรียน</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                  ในบทเรียนนี้เราจะมาทำความเข้าใจเกี่ยวกับเนื้อหาที่สำคัญ พร้อมกรณีศึกษาที่สามารถนำไปปรับใช้ได้จริงในการทำงาน...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ color: 'var(--color-secondary)', fontSize: '2.5rem', marginBottom: '1rem' }}>คอร์สเรียนทั้งหมด</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>หลักสูตรคุณภาพเพื่อการพัฒนาวิชาชีพของคุณ</p>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>กำลังโหลดข้อมูลคอร์สเรียน...</div>
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>ยังไม่มีคอร์สเรียนในขณะนี้</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {courses.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundColor: '#e2e8f0', backgroundImage: course.thumbnailUrl ? `url(${course.thumbnailUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.9)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  ออนไลน์
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', color: 'var(--color-secondary)', lineHeight: 1.4 }}>{course.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '1.2rem' }}>
                    {course.price === 0 ? 'เรียนฟรี' : `฿${course.price.toLocaleString()}`}
                  </span>
                  <span style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem', fontWeight: 500 }}>
                    ดูรายละเอียด &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;

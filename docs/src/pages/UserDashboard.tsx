import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const { token, user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  
  // VIP Form State
  const [vipOrg, setVipOrg] = useState('');
  const [vipPhone, setVipPhone] = useState('');
  const [vipStatus, setVipStatus] = useState('');

  useEffect(() => {
    if (!token) return;
    
    // Fetch Enrollments
    fetch(`${API_URL}/api/users/enrollments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setEnrollments(data);
    }).catch(console.error);

    // Fetch Certificates
    fetch(`${API_URL}/api/users/certificates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setCertificates(data);
    }).catch(console.error);
  }, [token]);

  const handleVipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setVipStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/api/vip/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ organization: vipOrg, phone: vipPhone })
      });
      if (res.ok) {
        setVipStatus('success');
      } else {
        setVipStatus('error');
      }
    } catch {
      setVipStatus('error');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '2rem' }}>ระบบจัดการผู้เรียน (My Dashboard)</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`btn ${activeTab === 'courses' ? 'btn-primary' : 'btn-outline'}`}
        >
          คอร์สเรียนของฉัน
        </button>
        <button 
          onClick={() => setActiveTab('certificates')}
          className={`btn ${activeTab === 'certificates' ? 'btn-primary' : 'btn-outline'}`}
        >
          เกียรติบัตรของฉัน
        </button>
        <button 
          onClick={() => setActiveTab('vip')}
          className={`btn ${activeTab === 'vip' ? 'btn-primary' : 'btn-outline'}`}
        >
          ขอสิทธิ์ VIP
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'courses' && (
          <div className="card">
            <h3>คอร์สเรียนที่กำลังเรียน</h3>
            {enrollments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                {enrollments.map((e, idx) => (
                  <Link to={`/learn/${e.course?.id}`} key={idx} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', display: 'block', transition: 'var(--transition)' }} className="card">
                    <div style={{ height: '100px', backgroundColor: '#e2e8f0', backgroundImage: e.course?.thumbnailUrl ? `url(${e.course.thumbnailUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', marginBottom: '1rem' }}></div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-secondary)' }}>{e.course?.title || 'คอร์สเรียน'}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'white', backgroundColor: 'var(--color-success)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>กำลังเรียน</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>เข้าเรียน &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>คุณยังไม่ได้ลงทะเบียนคอร์สเรียนใดๆ</p>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="card">
            <h3>เกียรติบัตรของฉัน</h3>
            {certificates.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                {certificates.map((c, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ height: '150px', backgroundColor: '#FEF3C7', borderRadius: '4px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                      🎓 Certificate
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{c.course?.title || 'คอร์สเรียน'}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>ออกเมื่อ: {new Date(c.issuedAt).toLocaleDateString('th-TH')}</p>
                    <a href={`/verify?id=${c.id}`} className="btn btn-outline" style={{ fontSize: '0.8rem', width: '100%' }}>ดูรายละเอียด</a>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>คุณยังไม่มีเกียรติบัตร</p>
            )}
          </div>
        )}

        {activeTab === 'vip' && (
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>ยื่นขอสิทธิ์ VIP (สำหรับบุคลากรทางการศึกษา)</h3>
            
            {user?.isVip ? (
              <div style={{ padding: '1.5rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid var(--color-success)', textAlign: 'center' }}>
                <h4 style={{ color: 'var(--color-success)' }}>✨ คุณเป็นสมาชิก VIP แล้ว</h4>
                <p>คุณสามารถลงทะเบียนเรียนคอร์สต่างๆ ได้ฟรี</p>
              </div>
            ) : status === 'success' ? (
              <div style={{ padding: '1.5rem', backgroundColor: '#EFF6FF', borderRadius: '8px', textAlign: 'center' }}>
                <p>ส่งคำขอเรียบร้อยแล้ว กรุณารอแอดมินตรวจสอบ</p>
              </div>
            ) : (
              <form onSubmit={handleVipRequest}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>ชื่อหน่วยงาน / โรงเรียน</label>
                  <input 
                    type="text" 
                    value={vipOrg}
                    onChange={e => setVipOrg(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="tel" 
                    value={vipPhone}
                    onChange={e => setVipPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-accent" disabled={vipStatus === 'submitting'}>
                  {vipStatus === 'submitting' ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอสิทธิ์ VIP'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

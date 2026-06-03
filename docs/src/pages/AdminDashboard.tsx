import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuthStore();
  
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, pendingPayments: 0 });
  const [payments, setPayments] = useState<any[]>([]);
  const [vips, setVips] = useState<any[]>([]);

  const fetchAdminData = () => {
    if (!token) return;

    fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (!data.error) setStats(data) }).catch(console.error);

    fetch(`${API_URL}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPayments(data) }).catch(console.error);

    fetch(`${API_URL}/api/admin/vip`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVips(data) }).catch(console.error);
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleApprovePayment = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payments/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveVip = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/vip/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: 'overview', label: 'ภาพรวม (Overview)' },
    { id: 'courses', label: 'จัดการคอร์สเรียน' },
    { id: 'payments', label: 'ตรวจสอบการชำระเงิน' },
    { id: 'vip', label: 'อนุมัติสิทธิ์ VIP' },
    { id: 'users', label: 'จัดการผู้ใช้' },
    { id: 'certificates', label: 'ระบบเกียรติบัตร' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--color-primary)', color: 'white', padding: '2rem 0' }}>
        <h3 style={{ padding: '0 1.5rem', marginBottom: '2rem', fontSize: '1.2rem', color: 'var(--color-accent)' }}>Super Admin</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.5rem',
                  backgroundColor: activeTab === tab.id ? '#172554' : 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--color-background)' }}>
        <h2 style={{ marginBottom: '2rem', color: 'var(--color-text-main)' }}>
          {tabs.find(t => t.id === activeTab)?.label}
        </h2>

        <div className="card">
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', backgroundColor: '#EFF6FF', borderRadius: '8px', borderLeft: '4px solid var(--color-secondary)' }}>
                <h4 style={{ color: 'var(--color-text-muted)' }}>ผู้ใช้งานทั้งหมด</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: '0.5rem 0 0 0' }}>{stats.totalUsers}</p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid var(--color-accent)' }}>
                <h4 style={{ color: 'var(--color-text-muted)' }}>รอตรวจสอบชำระเงิน</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#B45309', margin: '0.5rem 0 0 0' }}>{stats.pendingPayments}</p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#F0FDF4', borderRadius: '8px', borderLeft: '4px solid var(--color-success)' }}>
                <h4 style={{ color: 'var(--color-text-muted)' }}>คอร์สเรียนทั้งหมด</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)', margin: '0.5rem 0 0 0' }}>{stats.totalCourses}</p>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3>รายการชำระเงินที่รออนุมัติ</h3>
              {payments.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{p.user?.name} ({p.user?.email})</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>ยอดเงิน: {p.amount} บาท | วันที่: {new Date(p.submittedAt).toLocaleString('th-TH')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href={`${API_URL}${p.slipUrl}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>ดูสลิป</a>
                        <button onClick={() => handleApprovePayment(p.id)} className="btn btn-success" style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.4rem 0.8rem' }}>อนุมัติ</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>ไม่มีรายการค้างอนุมัติ</p>
              )}
            </div>
          )}

          {activeTab === 'vip' && (
            <div>
              <h3>คำขอสิทธิ์ VIP ที่รออนุมัติ</h3>
              {vips.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  {vips.map((v, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{v.user?.name} ({v.user?.email})</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>หน่วยงาน: {v.organization} | โทร: {v.phone}</p>
                      </div>
                      <button onClick={() => handleApproveVip(v.id)} className="btn btn-success" style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.4rem 0.8rem' }}>อนุมัติ VIP</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>ไม่มีคำขอค้างอนุมัติ</p>
              )}
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'payments' && activeTab !== 'vip' && (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem 0' }}>
              กำลังพัฒนาระบบ {tabs.find(t => t.id === activeTab)?.label}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !courseId || !amount) return;

    setStatus('submitting');
    
    // In real app, get token from local storage
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('amount', amount);
    formData.append('slip', file);

    try {
      const res = await fetch(`${API_URL}/api/payments/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--color-primary)', textAlign: 'center', marginBottom: '2rem' }}>ชำระเงินค่าลงทะเบียน</h1>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        <div className="card" style={{ flex: '1 1 300px', textAlign: 'center' }}>
          <h3>ช่องทางการชำระเงิน</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>สแกน QR Code ผ่านแอปธนาคาร</p>
          
          <img 
            src="https://img1.pic.in.th/images/unnamed-1dde43eac40d0e0a1.jpg" 
            alt="Payment QR Code" 
            style={{ width: '100%', maxWidth: '250px', borderRadius: '8px', marginBottom: '1rem' }} 
          />
          
          <div style={{ textAlign: 'left', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '4px' }}>
            <p><strong>ธนาคาร:</strong> ไทยพาณิชย์</p>
            <p><strong>เลขบัญชี:</strong> 4-1016-8624-0</p>
            <p><strong>พร้อมเพย์:</strong> 062-607-8601</p>
            <p><strong>ชื่อบัญชี:</strong> นายยุทธ อัครางกูร</p>
          </div>
        </div>
        
        <div className="card" style={{ flex: '1 1 300px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>แจ้งชำระเงิน</h3>
          
          {status === 'success' ? (
            <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '4px', textAlign: 'center' }}>
              <p>ส่งข้อมูลสำเร็จ! กรุณารอแอดมินตรวจสอบ</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>จำนวนเงินที่โอน (บาท)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>อัปโหลดสลิป</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'กำลังส่งข้อมูล...' : 'ยืนยันการชำระเงิน'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;

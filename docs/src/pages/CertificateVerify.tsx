import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const CertificateVerify: React.FC = () => {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/certificates/verify/${certId}`);
      const data = await res.json();
      
      if (data.valid) {
        setResult(data.certificate);
      } else {
        setError('ไม่พบข้อมูลเกียรติบัตรนี้ในระบบ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการตรวจสอบ');
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>ตรวจสอบเกียรติบัตร</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
          กรุณากรอกรหัสเกียรติบัตร (เช่น TECF-2026-000001)
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="รหัสเกียรติบัตร..."
            style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
            required
          />
          <button type="submit" className="btn btn-primary">ตรวจสอบ</button>
        </form>

        {error && <div style={{ color: 'var(--color-error)', padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '4px' }}>{error}</div>}
        
        {result && (
          <div style={{ padding: '1.5rem', backgroundColor: '#F0FDF4', borderRadius: '4px', border: '1px solid var(--color-success)', textAlign: 'left' }}>
            <h3 style={{ color: 'var(--color-success)', marginBottom: '1rem', textAlign: 'center' }}>✓ เกียรติบัตรถูกต้อง</h3>
            <p><strong>รหัสอ้างอิง:</strong> {result.id}</p>
            <p><strong>วันที่ออก:</strong> {new Date(result.issuedAt).toLocaleDateString('th-TH')}</p>
            <p><strong>สถานะ:</strong> ได้รับการรับรองโดยสมาพันธ์แพลตฟอร์มการศึกษาและอาชีพแห่งประเทศไทย</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerify;

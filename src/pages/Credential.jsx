import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateSHA256Hash, generateMockSignature } from '../utils/crypto';
import { ShieldCheck, Download, ArrowRight, CheckCircle, Award } from 'lucide-react';

export default function Credential() {
  const [credential, setCredential] = useState(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const qrRef = useRef(null);
  
  const navigate = useNavigate();
  const { createCredential } = useAuth();

  useEffect(() => {
    const buildCredential = async () => {
      try {
        const registeredStr = localStorage.getItem('trustid_registered');
        const docsStr = localStorage.getItem('trustid_docs');
        const selfie = localStorage.getItem('trustid_selfie');

        if (!registeredStr || !docsStr) {
          navigate('/register');
          return;
        }

        const registered = JSON.parse(registeredStr);
        const docs = JSON.parse(docsStr);
        const { aadhaar } = docs;

        const mobileHash = await generateSHA256Hash(registered.mobile);
        const faceHash = selfie ? await generateSHA256Hash(selfie.slice(0, 500)) : 'mock_hash';
        const sig = generateMockSignature();

        const cred = {
          id: `vc-${crypto.randomUUID()}`,
          holder_mobile_hash: mobileHash,
          name: aadhaar.name,
          dob: aadhaar.dob,
          pan_verified: true,
          kyc_grade: "A",
          income_band: "verified",
          face_hash: faceHash,
          issued_at: new Date().toISOString(),
          issuer: "TrustID",
          issuer_signature: sig
        };

        setCredential(cred);
        
        // Save using AuthContext helper
        createCredential(cred);

        // Render QR Code
        setTimeout(() => {
          if (qrRef.current) {
            qrRef.current.innerHTML = '';
            new window.QRCode(qrRef.current, {
              text: cred.id,
              width: 100,
              height: 100,
              colorDark: "#16a34a",
              colorLight: "#ffffff",
              correctLevel: window.QRCode.CorrectLevel.H
            });
          }
          setIsGenerating(false);
        }, 1500);

      } catch (err) {
        console.error("Failed to build credential", err);
      }
    };

    buildCredential();
  }, [navigate, createCredential]);

  useEffect(() => {
    if (!isGenerating && credential && displayIndex < Object.keys(credential).length) {
      const timer = setTimeout(() => {
        setDisplayIndex(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, credential, displayIndex]);

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(credential, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `TrustID_${credential.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!credential) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>;
  }

  const entries = Object.entries(credential);
  const displayedEntries = entries.slice(0, displayIndex);
  const isTypewriterDone = displayIndex >= entries.length;

  return (
    <div className="card">
      <h2 className="card-title">Identity Verified</h2>
      <p className="card-subtitle">Your reusable digital identity has been issued securely.</p>

      {isGenerating ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary-color)' }}></div>
          <div style={{ fontWeight: 500, color: 'var(--primary-color)' }}>Cryptographically signing credential...</div>
        </div>
      ) : (
        <>
          <div className="digital-id-card animate-fade-in" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <ShieldCheck size={28} />
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '1px' }}>TrustID</span>
                </div>
                
                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Holder Name</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>
                  {credential.name.split(' ')[0]} {credential.name.split(' ').slice(1).map(n => n[0] + '***').join(' ')}
                </div>

                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>KYC Grade</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700 }}>
                  <Award size={16} /> Grade A
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px' }}>
                <div ref={qrRef}></div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
              <div>
                <div style={{ opacity: 0.8 }}>Issued on</div>
                <div style={{ fontWeight: 600 }}>{new Date(credential.issued_at).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#86efac', fontWeight: 600 }}>
                <CheckCircle size={14} /> Verified by TrustID
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', border: '1px solid var(--border-color)', height: '240px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-main)' }}>
            <div style={{ color: 'var(--primary-color)', marginBottom: '8px', fontWeight: 'bold' }}>{'{'}</div>
            {displayedEntries.map(([key, value]) => (
              <div key={key} className="animate-fade-in" style={{ paddingLeft: '16px', marginBottom: '4px' }}>
                <span style={{ color: '#4338ca' }}>"{key}"</span>: 
                <span style={{ color: typeof value === 'boolean' ? '#b91c1c' : '#059669', wordBreak: 'break-all' }}>
                  {typeof value === 'string' ? `"${value}"` : value.toString()}
                </span>,
              </div>
            ))}
            {isTypewriterDone && <div style={{ color: 'var(--primary-color)', marginTop: '8px', fontWeight: 'bold' }}>{'}'}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-outline" onClick={handleDownload} disabled={!isTypewriterDone}>
              <Download size={18} /> Download Credential (JSON)
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')} disabled={!isTypewriterDone}>
              View my wallet <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

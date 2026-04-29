import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSHA256Hash } from '../utils/crypto';
import { Shield, Info, CheckCircle, XCircle, ArrowRight, Lock, EyeOff } from 'lucide-react';

const REQUESTER = "HDFC Bank";
const PURPOSE = "Savings account opening";
const CLAIMS = [
  { id: "age_above_18", label: "Over 18 years old", value: true },
  { id: "pan_verified", label: "Valid PAN attached", value: true },
  { id: "kyc_grade_A", label: "KYC Grade A verified", value: true },
  { id: "income_above_3L", label: "Income > ₹3L/yr", value: true }
];

export default function Share() {
  const [step, setStep] = useState(1); // 1: Review, 2: Generating, 3: Result
  const [selectedClaims, setSelectedClaims] = useState(
    CLAIMS.reduce((acc, claim) => ({ ...acc, [claim.id]: true }), {})
  );
  const [showZkExplainer, setShowZkExplainer] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [generatingIndex, setGeneratingIndex] = useState(0);
  
  const navigate = useNavigate();

  const handleToggleClaim = (id) => {
    setSelectedClaims(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = () => {
    setStep(2);
  };

  const handleDeny = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (step === 2) {
      const activeClaims = CLAIMS.filter(c => selectedClaims[c.id]);
      
      const generateProofs = async () => {
        const newProofs = [];
        for (let i = 0; i < activeClaims.length; i++) {
          setGeneratingIndex(i);
          // Simulate complex ZK generation time
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const hash = await generateSHA256Hash(activeClaims[i].id + Date.now().toString());
          newProofs.push({
            claim: activeClaims[i].label,
            result: activeClaims[i].value,
            proof: `ZKP_${hash.substring(0, 32)}`,
            timestamp: new Date().toISOString()
          });
          setProofs([...newProofs]);
        }
        
        // Done
        setTimeout(() => {
          setStep(3);
          
          // Save to consent log
          const logEntry = {
            id: `req-${Date.now()}`,
            requester: REQUESTER,
            purpose: PURPOSE,
            timestamp: Date.now(),
            shared_claims: newProofs.map(p => p.claim)
          };
          
          const existingLogs = JSON.parse(localStorage.getItem('trustid_consent_log') || '[]');
          localStorage.setItem('trustid_consent_log', JSON.stringify([logEntry, ...existingLogs]));
          
        }, 1000);
      };
      
      generateProofs();
    }
  }, [step, selectedClaims]);

  return (
    <div className="card">
      {step === 1 && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937' }}>
              H
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary-color)' }}>
              <ArrowRight size={20} />
              <Shield size={16} />
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
              <Shield size={24} />
            </div>
          </div>
          
          <h2 className="card-title" style={{ textAlign: 'center' }}>{REQUESTER}</h2>
          <p className="card-subtitle" style={{ textAlign: 'center', marginBottom: '8px' }}>is requesting your verified details</p>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
            <strong>Purpose:</strong> {PURPOSE}
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Requested Data</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {CLAIMS.map(claim => (
              <div key={claim.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: `1px solid ${selectedClaims[claim.id] ? 'var(--primary-color)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', backgroundColor: selectedClaims[claim.id] ? '#f0fdf4' : 'transparent', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedClaims[claim.id] ? <CheckCircle size={20} color="var(--primary-color)" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />}
                  <span style={{ fontWeight: selectedClaims[claim.id] ? 500 : 400 }}>{claim.label}</span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                  <input type="checkbox" checked={selectedClaims[claim.id]} onChange={() => handleToggleClaim(claim.id)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: selectedClaims[claim.id] ? 'var(--primary-color)' : '#ccc', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: selectedClaims[claim.id] ? '20px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button 
              style={{ width: '100%', padding: '12px', backgroundColor: '#f9fafb', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => setShowZkExplainer(!showZkExplainer)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5' }}><Lock size={18} /> Zero-Knowledge Proofs used</div>
              <Info size={18} color="var(--text-muted)" />
            </button>
            {showZkExplainer && (
              <div style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)', backgroundColor: 'white' }}>
                <p style={{ marginBottom: '8px' }}><strong>They receive a cryptographic proof, not your actual data.</strong></p>
                <p>For example, HDFC will securely verify that you are "Over 18", but they will <strong>never see your Date of Birth or Aadhaar number</strong>.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleDeny}>Deny</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleShare} disabled={!Object.values(selectedClaims).some(Boolean)}>
              Share with Proofs
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px', borderColor: 'rgba(22, 163, 74, 0.2)', borderTopColor: 'var(--primary-color)', marginBottom: '24px' }}></div>
          <h2 className="card-title">Generating Proofs</h2>
          <p className="card-subtitle">Using Zero-Knowledge Cryptography</p>
          
          <div style={{ width: '100%', marginTop: '24px' }}>
            {CLAIMS.filter(c => selectedClaims[c.id]).map((claim, idx) => (
              <div key={claim.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)', opacity: idx > generatingIndex ? 0.3 : 1 }}>
                <span>{claim.label}</span>
                {idx < generatingIndex ? (
                  <CheckCircle size={20} color="var(--success-color)" className="animate-fade-in" />
                ) : idx === generatingIndex ? (
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'var(--primary-color)' }}></div>
                ) : (
                  <div style={{ width: '20px', height: '20px' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
              <CheckCircle size={32} />
            </div>
          </div>
          <h2 className="card-title" style={{ textAlign: 'center' }}>Shared Successfully</h2>
          <p className="card-subtitle" style={{ textAlign: 'center' }}>Your proofs were securely sent to {REQUESTER}</p>
          
          <div style={{ backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', border: '1px dashed var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 600, marginBottom: '12px' }}>
              <EyeOff size={18} /> Privacy Receipt
            </div>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Raw docs shared:</span>
                <span style={{ fontWeight: 600 }}>None</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>PII exposed:</span>
                <span style={{ fontWeight: 600 }}>None</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cryptographic Proofs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proofs.map((p, i) => (
                <div key={i} style={{ padding: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{p.claim}</div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{p.proof}...</div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

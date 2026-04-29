import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Wallet, History, Settings, ShieldCheck, Award, Share2, CheckCircle, ChevronRight, LogOut, Trash2, Download } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [credential, setCredential] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mobile, setMobile] = useState('');
  const qrRefHome = useRef(null);
  const qrRefWallet = useRef(null);
  
  const navigate = useNavigate();
  const { revokeAll, login } = useAuth(); // login function not used here but available

  useEffect(() => {
    const credStr = localStorage.getItem('trustid_credential');
    const logStr = localStorage.getItem('trustid_consent_log');
    const regStr = localStorage.getItem('trustid_registered');
    
    if (credStr) setCredential(JSON.parse(credStr));
    if (logStr) setLogs(JSON.parse(logStr));
    if (regStr) setMobile(JSON.parse(regStr).mobile);
  }, []);

  useEffect(() => {
    // Render QR codes if credential exists
    if (credential) {
      const renderQR = (ref, size) => {
        if (ref.current) {
          ref.current.innerHTML = '';
          new window.QRCode(ref.current, {
            text: credential.id,
            width: size,
            height: size,
            colorDark: "#16a34a",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.H
          });
        }
      };
      
      if (activeTab === 'home') setTimeout(() => renderQR(qrRefHome, 60), 100);
      if (activeTab === 'wallet') setTimeout(() => renderQR(qrRefWallet, 120), 100);
    }
  }, [activeTab, credential]);

  const handleLogout = () => {
    // In a real app, clear session. Here we just redirect or reset isLoggedIn
    localStorage.removeItem('trustid_loggedIn');
    window.location.href = '/login';
  };

  const handleRevoke = () => {
    if (window.confirm("Are you sure you want to revoke your digital identity? This action cannot be undone.")) {
      revokeAll();
      navigate('/register');
    }
  };

  const handleDownloadBackup = () => {
    const backup = {
      credential,
      logs,
      mobile
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `TrustID_Backup_${Date.now()}.json`;
    a.click();
  };

  const renderHome = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Hello, {credential?.name?.split(' ')[0]}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600 }}>
            <Award size={16} /> KYC Grade A
          </div>
        </div>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, fontSize: '1.25rem' }}>
          {credential?.name?.charAt(0)}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #16a34a, #047857)', borderRadius: 'var(--radius-lg)', padding: '20px', color: 'white', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>TrustID Digital ID</div>
          <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '8px' }}>Active & Verified</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Issued {new Date(credential?.issued_at).toLocaleDateString()}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '8px' }}>
          <div ref={qrRefHome}></div>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: '32px' }} onClick={() => navigate('/share')}>
        <Share2 size={18} /> Share My Identity
      </button>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>Verification Status</h3>
      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        {[
          { label: 'Mobile Number', status: 'Verified', time: credential?.issued_at },
          { label: 'Aadhaar Check', status: 'Verified', time: credential?.issued_at },
          { label: 'PAN Verification', status: 'Verified', time: credential?.issued_at },
          { label: 'Video KYC & Face Match', status: 'Verified', time: credential?.issued_at }
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{item.label}</div>
              {item.time && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.time).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600 }}>
              <CheckCircle size={16} /> {item.status}
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Recent Activity</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('history')}>See all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Shared with {log.requester}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleDateString()} • {log.shared_claims.length} claims</div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderWallet = () => (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>My Wallet</h2>
      
      <div className="digital-id-card" style={{ marginBottom: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={32} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px' }}>TrustID</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '16px', fontWeight: 700 }}>
            <Award size={18} /> Grade A
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '12px' }}>
            <div ref={qrRefWallet}></div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Holder Name</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>{credential?.name}</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
            <div>
              <div style={{ opacity: 0.8 }}>Date of Birth</div>
              <div style={{ fontWeight: 600 }}>{credential?.dob}</div>
            </div>
            <div>
              <div style={{ opacity: 0.8 }}>Issued On</div>
              <div style={{ fontWeight: 600 }}>{new Date(credential?.issued_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        This QR code can be scanned by verified institutions to request zero-knowledge proofs of your identity.
      </p>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Consent History</h2>
      
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <History size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No sharing history yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.map((log) => (
            <div key={log.id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{log.requester}</h4>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{log.purpose}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>Claims Shared (ZKP):</div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--success-color)' }}>
                  {log.shared_claims.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Settings</h2>
      
      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0' }}>Account Info</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Mobile Number</span>
          <span style={{ fontWeight: 500 }}>{mobile ? `${mobile.slice(0,6)}XXXX${mobile.slice(-2)}` : 'N/A'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          className="btn btn-outline" 
          onClick={handleDownloadBackup}
          style={{ justifyContent: 'flex-start', padding: '16px', color: '#4f46e5', borderColor: '#e0e7ff' }}
        >
          <Download size={20} /> Download JSON Backup
        </button>
        
        <button 
          className="btn btn-outline" 
          onClick={handleLogout}
          style={{ justifyContent: 'flex-start', padding: '16px' }}
        >
          <LogOut size={20} /> Logout
        </button>

        <button 
          className="btn btn-outline" 
          onClick={handleRevoke}
          style={{ justifyContent: 'flex-start', padding: '16px', color: 'var(--error-color)', borderColor: '#fecaca' }}
        >
          <Trash2 size={20} /> Revoke Credential & Delete Data
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ padding: '0 0 40px 0' }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'wallet' && renderWallet()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      <div className="bottom-tab-bar">
        <button className={`tab-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>Home</span>
        </button>
        <button className={`tab-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
          <Wallet size={24} />
          <span>Wallet</span>
        </button>
        <button className={`tab-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={24} />
          <span>History</span>
        </button>
        <button className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={24} />
          <span>Settings</span>
        </button>
      </div>
    </>
  );
}

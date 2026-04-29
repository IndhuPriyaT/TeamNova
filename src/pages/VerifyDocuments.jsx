import { useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

// Simple Levenshtein distance for name matching
const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const nameMatchPercentage = (name1, name2) => {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  const dist = levenshtein(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  return maxLen === 0 ? 100 : Math.round(((maxLen - dist) / maxLen) * 100);
};

const initialState = {
  step: 1, // 1: Aadhaar, 2: PAN, 3: Review
  aadhaar: null,
  pan: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'NEXT_STEP': return { ...state, step: state.step + 1 };
    case 'PREV_STEP': return { ...state, step: state.step - 1 };
    case 'SET_AADHAAR': return { ...state, aadhaar: action.payload };
    case 'SET_PAN': return { ...state, pan: action.payload };
    default: return state;
  }
}

export default function VerifyDocuments() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(false);
  const [matchWarning, setMatchWarning] = useState('');
  const navigate = useNavigate();

  const handleFileUpload = (type, file) => {
    if (!file) return;
    setLoading(true);
    
    // Mock OCR Delay
    setTimeout(() => {
      setLoading(false);
      if (type === 'aadhaar') {
        dispatch({
          type: 'SET_AADHAAR',
          payload: { 
            name: "Rajesh Kumar", 
            dob: "15-08-1990", 
            gender: "Male", 
            aadhaar_last4: "8421", 
            verified: true 
          }
        });
      } else {
        const panData = { 
          name: "Rajesh Kumar", 
          pan_number: "ABCDE1234F", 
          dob: "15-08-1990", 
          verified: true 
        };
        dispatch({ type: 'SET_PAN', payload: panData });
        
        // Check name match
        const match = nameMatchPercentage(state.aadhaar.name, panData.name);
        if (match < 80) {
          setMatchWarning(`Name match is low (${match}%). Ensure documents belong to the same person.`);
        } else {
          setMatchWarning('');
        }
      }
    }, 2000);
  };

  const handleConfirmAndProceed = () => {
    localStorage.setItem('trustid_docs', JSON.stringify({ aadhaar: state.aadhaar, pan: state.pan }));
    navigate('/verify/video-kyc');
  };

  const renderAadhaarStep = () => (
    <div className="animate-fade-in">
      <h3 className="card-title">Upload Aadhaar</h3>
      <p className="card-subtitle">Please upload a clear photo of your Aadhaar card front.</p>
      
      {!state.aadhaar ? (
        <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            onChange={(e) => handleFileUpload('aadhaar', e.target.files[0])}
            disabled={loading}
          />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="spinner" style={{ borderColor: 'var(--primary-color)' }}></div>
              <p style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Extracting details using OCR...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <Upload size={32} />
              <p>Tap to upload or take a photo</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid var(--success-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 600, marginBottom: '16px' }}>
            <CheckCircle size={20} /> Aadhaar details extracted
          </div>
          <div style={{ display: 'grid', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name</span>
              <span style={{ fontWeight: 500 }}>{state.aadhaar.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aadhaar No.</span>
              <span style={{ fontWeight: 500 }}>XXXX-XXXX-{state.aadhaar.aadhaar_last4}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>DOB</span>
              <span style={{ fontWeight: 500 }}>{state.aadhaar.dob}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-outline" onClick={() => dispatch({ type: 'SET_AADHAAR', payload: null })} style={{ flex: 1, padding: '10px' }}>Retake</button>
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })} style={{ flex: 1, padding: '10px' }}>Looks Good</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPanStep = () => (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => dispatch({ type: 'PREV_STEP' })} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} color="var(--text-main)" />
        </button>
        <h3 className="card-title" style={{ margin: 0 }}>Upload PAN</h3>
      </div>
      <p className="card-subtitle">Now, upload your PAN card for verification.</p>

      {!state.pan ? (
        <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            onChange={(e) => handleFileUpload('pan', e.target.files[0])}
            disabled={loading}
          />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="spinner" style={{ borderColor: 'var(--primary-color)' }}></div>
              <p style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Extracting PAN details...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <Upload size={32} />
              <p>Tap to upload PAN card</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid var(--success-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)', fontWeight: 600, marginBottom: '16px' }}>
            <CheckCircle size={20} /> PAN details extracted
          </div>
          
          {matchWarning && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#b45309', backgroundColor: '#fefce8', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.875rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{matchWarning}</span>
            </div>
          )}

          <div style={{ display: 'grid', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name</span>
              <span style={{ fontWeight: 500 }}>{state.pan.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>PAN No.</span>
              <span style={{ fontWeight: 500 }}>{state.pan.pan_number.slice(0,2)}XX...XX{state.pan.pan_number.slice(-2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-outline" onClick={() => dispatch({ type: 'SET_PAN', payload: null })} style={{ flex: 1, padding: '10px' }}>Retake</button>
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'NEXT_STEP' })} style={{ flex: 1, padding: '10px' }}>Proceed to Review</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => dispatch({ type: 'PREV_STEP' })} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} color="var(--text-main)" />
        </button>
        <h3 className="card-title" style={{ margin: 0 }}>Review Documents</h3>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 calc(50% - 8px)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>Aadhaar <CheckCircle size={14} color="var(--success-color)" /></h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>XXXX-{state.aadhaar.aadhaar_last4}</p>
          </div>
        </div>

        <div style={{ flex: '1 1 calc(50% - 8px)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--success-color)' }}>
            <FileText size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>PAN <CheckCircle size={14} color="var(--success-color)" /></h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{state.pan.pan_number.slice(0,2)}..{state.pan.pan_number.slice(-2)}</p>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleConfirmAndProceed}>
        Confirm and Proceed <ArrowRight size={18} />
      </button>
    </div>
  );

  return (
    <div className="card">
      <div className="progress-container" style={{ marginBottom: '24px' }}>
        <div 
          className="progress-bar" 
          style={{ width: `${(state.step / 3) * 100}%` }}
        ></div>
      </div>

      {state.step === 1 && renderAadhaarStep()}
      {state.step === 2 && renderPanStep()}
      {state.step === 3 && renderReviewStep()}
    </div>
  );
}

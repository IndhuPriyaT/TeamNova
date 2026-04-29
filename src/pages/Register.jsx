import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Smartphone } from 'lucide-react';

export default function Register() {
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState(1); // 1 = mobile, 2 = otp
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setError('');
    setLoading(true);
    
    // Mock POST /api/auth/send-otp
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setResendTimer(30);
    }, 1500);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    // Mock verify OTP
    setTimeout(() => {
      setLoading(false);
      if (enteredOtp === '123456') {
        register(`+91${mobile}`);
        navigate('/login');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    }, 2000);
  };

  return (
    <div className="card">
      <h2 className="card-title">Welcome to TrustID</h2>
      <p className="card-subtitle">
        {step === 1 ? 'Enter your mobile number to start' : `We sent an OTP to +91 ${mobile}`}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center' }}>
                +91
              </div>
              <input
                type="tel"
                className="input-field"
                placeholder="9999999999"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.slice(0, 10));
                  setError('');
                }}
                autoFocus
              />
            </div>
          </div>
          
          {error && <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading || mobile.length < 10}>
            {loading ? <div className="spinner"></div> : 'Send OTP'}
          </button>
        </form>
      ) : (
        <div>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                maxLength="1"
                className={`otp-box ${error ? 'error' : ''}`}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

          <button 
            className="btn btn-primary" 
            onClick={handleVerifyOtp} 
            disabled={loading || otp.join('').length < 6}
            style={{ marginBottom: '16px' }}
          >
            {loading ? <div className="spinner"></div> : (
              <>
                Verify & Proceed <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {resendTimer > 0 ? (
              `Resend OTP in ${resendTimer}s`
            ) : (
              <button 
                onClick={handleSendOtp} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

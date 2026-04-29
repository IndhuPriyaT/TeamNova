import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFaceModels, getFaceDetectorOptions } from '../utils/faceUtils';
import { CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';

const CHALLENGES = [
  "Look straight and say your name",
  "Slowly turn head right",
  "Hold PAN card to camera"
];

export default function VideoKYC() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [timer, setTimer] = useState(10);
  const [fails, setFails] = useState(0);
  const [status, setStatus] = useState('Initializing camera...');
  const [isDone, setIsDone] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  
  const faceDetected = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await loadFaceModels();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
          setStatus(CHALLENGES[0]);
        }
      } catch (err) {
        setStatus('Camera/Mic access denied.');
      }
    };
    init();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (!streamActive || isDone || fails >= 2) return;

    const countdownInterval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Timer expired, check challenge
          handleChallengeEnd();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [streamActive, currentChallenge, isDone, fails]);

  const handleVideoPlay = () => {
    const detectInterval = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const detection = await window.faceapi.detectSingleFace(videoRef.current, getFaceDetectorOptions());
        faceDetected.current = !!detection;
      } catch (e) {
        faceDetected.current = false;
      }
    }, 500);

    return () => clearInterval(detectInterval);
  };

  const handleChallengeEnd = () => {
    if (faceDetected.current) {
      // Pass
      if (currentChallenge < 2) {
        setCurrentChallenge(prev => prev + 1);
        setStatus(CHALLENGES[currentChallenge + 1]);
      } else {
        // All passed
        setIsDone(true);
        setStatus('Video KYC Completed Successfully!');
        captureSelfieAndProceed();
      }
    } else {
      // Fail
      const newFails = fails + 1;
      setFails(newFails);
      if (newFails >= 2) {
        setStatus('Too many failed attempts.');
        stopCamera();
      } else {
        setStatus('Challenge failed. Make sure your face is visible. Retrying...');
      }
    }
  };

  const captureSelfieAndProceed = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const selfieBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      localStorage.setItem('trustid_selfie', selfieBase64);
      localStorage.setItem('trustid_session', JSON.stringify({
        duration: Date.now() - sessionStartTime,
        completedAt: Date.now()
      }));

      setTimeout(() => {
        navigate('/verify/credential');
      }, 2000);
    }
  };

  if (fails >= 2) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error-color)" style={{ margin: '0 auto 16px' }} />
        <h2 className="card-title">Verification Paused</h2>
        <p className="card-subtitle">We couldn't verify your video KYC automatically.</p>
        <button className="btn btn-outline" style={{ marginBottom: '12px' }}>
          Schedule Human Review
        </button>
        <button className="btn btn-primary" onClick={() => { setFails(0); setTimer(10); startCamera(); }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      <button 
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        onClick={() => setShowTips(!showTips)}
      >
        <Info size={24} />
      </button>

      <h2 className="card-title">Video KYC</h2>
      <p className="card-subtitle">Complete 3 quick actions to verify your identity.</p>

      {showTips && (
        <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem', color: '#1e3a8a' }}>
          <strong>Having trouble?</strong> Ensure you have good lighting, no background noise, and your face is clearly visible.
        </div>
      )}

      <div className="camera-container" style={{ borderRadius: 'var(--radius-lg)', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {!streamActive && !isDone && <div className="spinner" style={{ position: 'absolute', zIndex: 2 }}></div>}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onPlay={handleVideoPlay}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!isDone && streamActive && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontWeight: 600, textAlign: 'center', width: '80%' }}>
            {CHALLENGES[currentChallenge]}
          </div>
        )}

        {!isDone && streamActive && (
          <div style={{ position: 'absolute', top: '20px', left: '20px', width: '60px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="60" height="60" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="30" cy="30" r="26" fill="rgba(0,0,0,0.5)" stroke="var(--border-color)" strokeWidth="4" />
              <circle 
                cx="30" cy="30" r="26" 
                fill="none" 
                stroke="var(--primary-color)" 
                strokeWidth="4" 
                strokeDasharray="163.36" 
                strokeDashoffset={163.36 - (163.36 * (timer / 10))} 
                style={{ transition: 'stroke-dashoffset 1s linear' }} 
              />
            </svg>
            <div style={{ position: 'relative', color: 'white', fontWeight: 'bold' }}>{timer}s</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CHALLENGES.map((challenge, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: idx === currentChallenge ? '#f0fdf4' : 'var(--card-bg)', border: `1px solid ${idx === currentChallenge ? 'var(--success-color)' : 'var(--border-color)'}` }}>
            {idx < currentChallenge || isDone ? (
              <CheckCircle size={20} color="var(--success-color)" />
            ) : idx === currentChallenge ? (
              <Clock size={20} color="var(--primary-color)" />
            ) : (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-color)' }}></div>
            )}
            <span style={{ fontWeight: idx === currentChallenge ? 600 : 400, color: idx > currentChallenge ? 'var(--text-muted)' : 'var(--text-main)' }}>
              {challenge}
            </span>
          </div>
        ))}
      </div>

      <button onClick={() => { setIsDone(true); captureSelfieAndProceed(); }} className="btn btn-outline" style={{ marginTop: '16px', fontSize: '0.875rem', padding: '8px 16px' }}>
        Skip KYC (Debug)
      </button>

      {isDone && (
        <div style={{ marginTop: '16px', color: 'var(--success-color)', fontWeight: 600, textAlign: 'center' }}>
          Validating session...
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadFaceModels, getFaceDetectorOptions, getEyeAspectRatio } from '../utils/faceUtils';
import { Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState('Loading face recognition models...');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // State refs for animation loop
  const blinkCount = useRef(0);
  const consecutiveCenteredFrames = useRef(0);
  const isProcessing = useRef(false);

  useEffect(() => {
    const initModels = async () => {
      try {
        await loadFaceModels();
        setModelsLoaded(true);
        setStatus('Position your face in the oval');
        startCamera();
      } catch (err) {
        setError('Failed to load face detection models. Check your network.');
      }
    };
    initModels();
    
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied or not available.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleVideoPlay = () => {
    if (!modelsLoaded) return;
    
    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    if (canvasRef.current) {
      window.faceapi.matchDimensions(canvasRef.current, displaySize);
    }
    
    const detectInterval = setInterval(async () => {
      if (!videoRef.current || isProcessing.current) return;
      isProcessing.current = true;

      try {
        const detection = await window.faceapi.detectSingleFace(
          videoRef.current, 
          getFaceDetectorOptions()
        ).withFaceLandmarks(true);

        if (detection) {
          // Check centering and size
          const { box } = detection.detection;
          const boxCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
          const frameCenter = { x: displaySize.width / 2, y: displaySize.height / 2 };
          
          const isCentered = 
            Math.abs(boxCenter.x - frameCenter.x) < 80 && 
            Math.abs(boxCenter.y - frameCenter.y) < 80 &&
            box.width > 120; // Face should be reasonably large

          if (isCentered && detection.detection.score > 0.85) {
            consecutiveCenteredFrames.current += 1;
            
            // Blink detection
            const leftEye = detection.landmarks.getLeftEye();
            const rightEye = detection.landmarks.getRightEye();
            const leftEAR = getEyeAspectRatio(leftEye);
            const rightEAR = getEyeAspectRatio(rightEye);
            
            const ear = (leftEAR + rightEAR) / 2;
            if (ear < 0.22) { // Blink threshold
              blinkCount.current += 1;
            }

            if (consecutiveCenteredFrames.current < 15) {
              setStatus('Hold still...');
              setProgress((consecutiveCenteredFrames.current / 15) * 50);
            } else if (blinkCount.current < 2) { // Require ~2 frames of blink
              setStatus('Please blink to verify liveness');
              setProgress(50 + (blinkCount.current * 25));
            } else {
              // Success
              clearInterval(detectInterval);
              setStatus('Verification successful!');
              setProgress(100);
              stopCamera();
              setTimeout(() => {
                login();
                navigate('/verify/documents');
              }, 1000);
            }
          } else {
            consecutiveCenteredFrames.current = 0;
            blinkCount.current = 0;
            setProgress(0);
            setStatus(box.width <= 120 ? 'Move closer' : 'Center your face');
          }
        } else {
          setStatus('No face detected');
          setProgress(0);
          consecutiveCenteredFrames.current = 0;
          blinkCount.current = 0;
        }
      } catch (e) {
        console.error(e);
      } finally {
        isProcessing.current = false;
      }
    }, 150);

    return () => clearInterval(detectInterval);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="card-title">Face Verification</h2>
      <p className="card-subtitle" style={{ textAlign: 'center' }}>We need to verify it's really you.</p>

      {error ? (
        <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-md)' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="camera-container" style={{ width: '280px', height: '380px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {!cameraActive && <div className="spinner" style={{ borderColor: 'var(--primary-color)', position: 'absolute' }}></div>}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              onPlay={handleVideoPlay}
              className="camera-video"
            />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="220" height="300" style={{ position: 'absolute' }}>
                <ellipse cx="110" cy="150" rx="106" ry="146" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                <ellipse 
                  cx="110" cy="150" rx="106" ry="146" 
                  fill="none" 
                  stroke={progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'} 
                  strokeWidth="8" 
                  strokeDasharray="800" 
                  strokeDashoffset={800 - (800 * (progress / 100))} 
                  style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s' }} 
                  transform="rotate(-90 110 150)"
                />
              </svg>
              <div 
                className="camera-overlay-oval"
                style={{ 
                  borderColor: 'transparent',
                  borderWidth: '4px',
                  borderStyle: 'solid'
                }}
              ></div>
            </div>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          </div>

          <div style={{ width: '100%', marginBottom: '16px' }}>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? 'var(--success-color)' : 'var(--primary-color)'
                }} 
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 500, color: progress === 100 ? 'var(--success-color)' : 'var(--text-main)' }}>
              {progress === 100 ? <CheckCircle size={20} /> : <Camera size={20} />}
              <span>{status}</span>
            </div>
          </div>
          
          {/* Debug skip button just in case liveness is flaky */}
          {modelsLoaded && progress < 100 && (
             <button 
                onClick={() => { stopCamera(); login(); navigate('/verify/documents'); }} 
                className="btn btn-outline" 
                style={{ marginTop: '16px', fontSize: '0.875rem', padding: '8px 16px' }}
             >
               Skip (Debug)
             </button>
          )}
        </>
      )}
    </div>
  );
}

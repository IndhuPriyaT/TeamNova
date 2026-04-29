// Ensure face-api.js is loaded from CDN
export const loadFaceModels = async () => {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model/';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
};

export const getFaceDetectorOptions = () => {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
};

// Calculate Eye Aspect Ratio (EAR)
const euclideanDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

export const getEyeAspectRatio = (eyePoints) => {
  // Eye points are 6 points: P1 to P6
  // Vertical distances
  const d1 = euclideanDistance(eyePoints[1], eyePoints[5]);
  const d2 = euclideanDistance(eyePoints[2], eyePoints[4]);
  // Horizontal distance
  const d3 = euclideanDistance(eyePoints[0], eyePoints[3]);
  
  return (d1 + d2) / (2.0 * d3);
};

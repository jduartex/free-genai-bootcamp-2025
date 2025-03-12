import * as tf from '@tensorflow/tfjs';

// Enhanced template features for each vowel in LSE
const vowelTemplates = {
  // A: Extended hand with thumb alongside palm
  A: {
    // Higher values indicate more extended fingers
    features: [0.5, 0.8, 0.8, 0.8, 0.8],
    // Angular relationships between fingers (normalized)
    angles: [0.2, 0.1, 0.1, 0.1, 0.1],
    // Description for visualization
    description: "Extended hand with all fingers open"
  },
  // E: Hand closed with thumb across palm
  E: {
    features: [0.4, 0.2, 0.2, 0.2, 0.2],
    angles: [0.8, 0.8, 0.8, 0.8, 0.8],
    description: "Closed fist with all fingers curled in"
  },
  // I: Hand closed with pinky extended
  I: {
    features: [0.3, 0.2, 0.2, 0.2, 0.8],
    angles: [0.7, 0.8, 0.8, 0.8, 0.1],
    description: "Closed hand with only pinky finger extended"
  },
  // O: Fingertips together forming an 'O' shape
  O: {
    features: [0.6, 0.5, 0.5, 0.5, 0.5],
    angles: [0.5, 0.5, 0.5, 0.5, 0.5],
    description: "Fingertips together forming an 'O' shape"
  },
  // U: Hand with index and pinky extended (horns sign)
  U: {
    features: [0.3, 0.8, 0.2, 0.2, 0.8],
    angles: [0.7, 0.1, 0.8, 0.8, 0.1],
    description: "Index and pinky fingers extended, others closed"
  }
};

// Extract features from hand landmarks
const extractFeatures = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return null;
  
  try {
    // Wrist position
    const wrist = landmarks[0];
    
    // Finger tip positions
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Middle joints
    const thumbMid = landmarks[2];
    const indexMid = landmarks[6];
    const middleMid = landmarks[10];
    const ringMid = landmarks[14];
    const pinkyMid = landmarks[18];

    // Calculate finger extensions (distance from wrist to finger tip)
    const thumbExtension = calculateDistance(wrist, thumbTip);
    const indexExtension = calculateDistance(wrist, indexTip);
    const middleExtension = calculateDistance(wrist, middleTip);
    const ringExtension = calculateDistance(wrist, ringTip);
    const pinkyExtension = calculateDistance(wrist, pinkyTip);
    
    // Calculate finger angles (to detect curled fingers)
    const thumbAngle = calculateAngle(wrist, thumbMid, thumbTip);
    const indexAngle = calculateAngle(wrist, indexMid, indexTip);
    const middleAngle = calculateAngle(wrist, middleMid, middleTip);
    const ringAngle = calculateAngle(wrist, ringMid, ringTip);
    const pinkyAngle = calculateAngle(wrist, pinkyMid, pinkyTip);
    
    // Normalize distance values
    const maxDistance = 0.4; // Approximate maximum expected distance
    
    // Extract features: both distances and angles
    const features = [
      Math.min(thumbExtension / maxDistance, 1),
      Math.min(indexExtension / maxDistance, 1),
      Math.min(middleExtension / maxDistance, 1),
      Math.min(ringExtension / maxDistance, 1),
      Math.min(pinkyExtension / maxDistance, 1)
    ];
    
    // Normalize angles (PI is approximately 3.14159)
    const angles = [
      thumbAngle / Math.PI,
      indexAngle / Math.PI,
      middleAngle / Math.PI,
      ringAngle / Math.PI,
      pinkyAngle / Math.PI
    ];
    
    return { features, angles };
  } catch (err) {
    console.error("Feature extraction error:", err);
    return null;
  }
};

// Calculate Euclidean distance between two landmarks
const calculateDistance = (landmark1, landmark2) => {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = (landmark1.z || 0) - (landmark2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Calculate angle between three points
const calculateAngle = (point1, point2, point3) => {
  // Vectors from point2 to points 1 and 3
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: (point1.z || 0) - (point2.z || 0)
  };
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: (point3.z || 0) - (point2.z || 0)
  };
  
  // Dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  
  // Magnitudes
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
  
  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  // Cosine of the angle
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  
  // Angle in radians (clamp to avoid domain errors due to floating point imprecisions)
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
};

// Calculate weighted similarity score
const calculateSimilarity = (extractedData, template) => {
  try {
    return tf.tidy(() => {
      // Create tensors for the extracted features and template
      const featuresTensor = tf.tensor1d(extractedData.features);
      const templateFeaturesTensor = tf.tensor1d(template.features);
      
      // Create tensors for angles
      const anglesTensor = tf.tensor1d(extractedData.angles);
      const templateAnglesTensor = tf.tensor1d(template.angles);
      
      // Calculate cosine similarity for features
      const featuresDotProduct = featuresTensor.mul(templateFeaturesTensor).sum();
      const featuresMagnitude = featuresTensor.norm();
      const templateFeaturesMagnitude = templateFeaturesTensor.norm();
      
      const featuresDiv = featuresMagnitude.mul(templateFeaturesMagnitude);
      const featuresSimilarity = featuresDiv.greater(0)
        ? featuresDotProduct.div(featuresDiv)
        : tf.scalar(0);
      
      // Calculate cosine similarity for angles
      const anglesDotProduct = anglesTensor.mul(templateAnglesTensor).sum();
      const anglesMagnitude = anglesTensor.norm();
      const templateAnglesMagnitude = templateAnglesTensor.norm();
      
      const anglesDiv = anglesMagnitude.mul(templateAnglesMagnitude);
      const anglesSimilarity = anglesDiv.greater(0)
        ? anglesDotProduct.div(anglesDiv)
        : tf.scalar(0);
      
      // Weighted average (70% features, 30% angles)
      const weightedSimilarity = featuresSimilarity.mul(0.7).add(anglesSimilarity.mul(0.3));
      
      return weightedSimilarity.arraySync();
    });
  } catch (err) {
    console.error("Similarity calculation error:", err);
    return 0;
  }
};

// Main function to recognize vowel from landmarks
export const recognizeVowel = (landmarks) => {
  try {
    const extractedData = extractFeatures(landmarks);
    
    if (!extractedData) return { vowel: null, confidence: 0 };
    
    let bestVowel = null;
    let highestConfidence = 0;
    
    // Find the vowel with the highest similarity score
    Object.entries(vowelTemplates).forEach(([vowel, template]) => {
      const similarity = calculateSimilarity(extractedData, template);
      
      if (similarity > highestConfidence) {
        highestConfidence = similarity;
        bestVowel = vowel;
      }
    });
    
    return {
      vowel: bestVowel,
      confidence: highestConfidence
    };
  } catch (err) {
    console.error("Vowel recognition error:", err);
    return { vowel: null, confidence: 0 };
  }
};

// Export vowel templates for use in other components
export const getVowelTemplates = () => vowelTemplates;

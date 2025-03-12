import * as tf from '@tensorflow/tfjs';

// Complete templates for the Spanish Sign Language (LSE) alphabet
const letterTemplates = {
  // Vowels (retain existing templates)
  'A': {
    features: [0.5, 0.8, 0.8, 0.8, 0.8],
    angles: [0.2, 0.1, 0.1, 0.1, 0.1],
    description: "Extended hand with all fingers open",
    category: "vowel"
  },
  'E': {
    features: [0.4, 0.2, 0.2, 0.2, 0.2],
    angles: [0.8, 0.8, 0.8, 0.8, 0.8],
    description: "Closed fist with all fingers curled in",
    category: "vowel"
  },
  'I': {
    features: [0.3, 0.2, 0.2, 0.2, 0.8],
    angles: [0.7, 0.8, 0.8, 0.8, 0.1],
    description: "Closed hand with only pinky finger extended",
    category: "vowel"
  },
  'O': {
    features: [0.6, 0.5, 0.5, 0.5, 0.5],
    angles: [0.5, 0.5, 0.5, 0.5, 0.5],
    description: "Fingertips together forming an 'O' shape",
    category: "vowel"
  },
  'U': {
    features: [0.3, 0.8, 0.2, 0.2, 0.8],
    angles: [0.7, 0.1, 0.8, 0.8, 0.1],
    description: "Index and pinky fingers extended, others closed",
    category: "vowel"
  },

  // Consonants with their specific features in LSE
  'B': {
    features: [0.3, 0.8, 0.8, 0.8, 0.8],
    angles: [0.8, 0.1, 0.1, 0.1, 0.1],
    description: "Four fingers extended upright, thumb tucked",
    category: "consonant"
  },
  'C': {
    features: [0.6, 0.7, 0.7, 0.7, 0.7],
    angles: [0.4, 0.4, 0.4, 0.4, 0.4],
    description: "Curved hand in 'C' shape",
    category: "consonant"
  },
  'D': {
    features: [0.4, 0.8, 0.3, 0.3, 0.3],
    angles: [0.6, 0.1, 0.7, 0.7, 0.7],
    description: "Index finger pointing up, others curved",
    category: "consonant"
  },
  'F': {
    features: [0.5, 0.5, 0.3, 0.3, 0.3],
    angles: [0.4, 0.3, 0.7, 0.7, 0.7],
    description: "Thumb and index fingertips touching, other fingers extended",
    category: "consonant"
  },
  'G': {
    features: [0.4, 0.7, 0.3, 0.3, 0.3],
    angles: [0.5, 0.2, 0.7, 0.7, 0.7],
    description: "Index finger pointing forward, thumb extended",
    category: "consonant"
  },
  'H': {
    features: [0.4, 0.8, 0.8, 0.3, 0.3],
    angles: [0.6, 0.1, 0.1, 0.7, 0.7],
    description: "Index and middle fingers extended together",
    category: "consonant"
  },
  'J': {
    features: [0.4, 0.8, 0.8, 0.3, 0.3],
    angles: [0.5, 0.2, 0.2, 0.7, 0.7],
    description: "Similar to H but with a small motion",
    category: "consonant"
  },
  'K': {
    features: [0.5, 0.8, 0.8, 0.3, 0.3],
    angles: [0.3, 0.1, 0.3, 0.7, 0.7],
    description: "Index and middle fingers extended in a V",
    category: "consonant"
  },
  'L': {
    features: [0.7, 0.8, 0.3, 0.3, 0.3],
    angles: [0.1, 0.1, 0.8, 0.8, 0.8],
    description: "L-shape with thumb and index finger",
    category: "consonant"
  },
  'M': {
    features: [0.3, 0.6, 0.6, 0.6, 0.3],
    angles: [0.8, 0.3, 0.3, 0.3, 0.8],
    description: "Three fingers covering thumb",
    category: "consonant"
  },
  'N': {
    features: [0.3, 0.6, 0.6, 0.3, 0.3],
    angles: [0.8, 0.3, 0.3, 0.7, 0.8],
    description: "Two fingers covering thumb",
    category: "consonant"
  },
  'P': {
    features: [0.5, 0.8, 0.3, 0.3, 0.3],
    angles: [0.3, 0.1, 0.7, 0.7, 0.7],
    description: "Index pointing down, thumb out",
    category: "consonant"
  },
  'Q': {
    features: [0.5, 0.4, 0.3, 0.3, 0.3],
    angles: [0.3, 0.6, 0.7, 0.7, 0.7],
    description: "Thumb and index pointing down",
    category: "consonant"
  },
  'R': {
    features: [0.4, 0.8, 0.8, 0.3, 0.3],
    angles: [0.6, 0.1, 0.1, 0.8, 0.8],
    description: "Index and middle fingers crossed",
    category: "consonant"
  },
  'S': {
    features: [0.4, 0.3, 0.3, 0.3, 0.3],
    angles: [0.6, 0.7, 0.7, 0.7, 0.7],
    description: "Closed fist with thumb over fingers",
    category: "consonant"
  },
  'T': {
    features: [0.3, 0.4, 0.3, 0.3, 0.3],
    angles: [0.7, 0.6, 0.8, 0.8, 0.8],
    description: "Fist with thumb between index and middle finger",
    category: "consonant"
  },
  'V': {
    features: [0.3, 0.8, 0.8, 0.3, 0.3],
    angles: [0.7, 0.1, 0.1, 0.8, 0.8],
    description: "V-shape with index and middle fingers",
    category: "consonant"
  },
  'W': {
    features: [0.3, 0.8, 0.8, 0.8, 0.3],
    angles: [0.7, 0.1, 0.1, 0.1, 0.8],
    description: "Three fingers extended in a W",
    category: "consonant"
  },
  'X': {
    features: [0.3, 0.6, 0.3, 0.3, 0.3],
    angles: [0.7, 0.3, 0.7, 0.7, 0.7],
    description: "Index finger curved in hook shape",
    category: "consonant"
  },
  'Y': {
    features: [0.7, 0.3, 0.3, 0.3, 0.8],
    angles: [0.1, 0.8, 0.8, 0.8, 0.1],
    description: "Thumb and pinky extended (hang loose sign)",
    category: "consonant"
  },
  'Z': {
    features: [0.3, 0.8, 0.3, 0.3, 0.3],
    angles: [0.7, 0.1, 0.8, 0.8, 0.8],
    description: "Index finger extended to draw Z",
    category: "consonant"
  },
  
  // Special Spanish letters
  'Ñ': {
    features: [0.3, 0.6, 0.6, 0.3, 0.3],
    angles: [0.8, 0.3, 0.3, 0.7, 0.8],
    description: "Similar to N with a wiggle motion",
    category: "special"
  },
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
    
    // Base joints (where fingers meet palm)
    const thumbBase = landmarks[1];
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    const ringBase = landmarks[13];
    const pinkyBase = landmarks[17];

    // Calculate finger extensions (distance from wrist to finger tip)
    const thumbExtension = calculateDistance(wrist, thumbTip);
    const indexExtension = calculateDistance(wrist, indexTip);
    const middleExtension = calculateDistance(wrist, middleTip);
    const ringExtension = calculateDistance(wrist, ringTip);
    const pinkyExtension = calculateDistance(wrist, pinkyTip);
    
    // Calculate finger angles (to detect curled fingers)
    const thumbAngle = calculateAngle(thumbBase, thumbMid, thumbTip);
    const indexAngle = calculateAngle(indexBase, indexMid, indexTip);
    const middleAngle = calculateAngle(middleBase, middleMid, middleTip);
    const ringAngle = calculateAngle(ringBase, ringMid, ringTip);
    const pinkyAngle = calculateAngle(pinkyBase, pinkyMid, pinkyTip);
    
    // Calculate finger spread (angles between adjacent fingers)
    const thumbIndexAngle = calculateAngle(thumbTip, wrist, indexTip);
    const indexMiddleAngle = calculateAngle(indexTip, wrist, middleTip);
    const middleRingAngle = calculateAngle(middleTip, wrist, ringTip);
    const ringPinkyAngle = calculateAngle(ringTip, wrist, pinkyTip);
    
    // Normalize distance values
    const maxDistance = 0.4; // Approximate maximum expected distance
    
    // Extract features: distances and angles
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
    
    // Additional features for more complex letter distinctions
    const spread = [
      thumbIndexAngle / Math.PI,
      indexMiddleAngle / Math.PI,
      middleRingAngle / Math.PI,
      ringPinkyAngle / Math.PI
    ];
    
    // Height relationships between fingertips
    const heights = [
      normalizeHeight(thumbTip.y, wrist.y),
      normalizeHeight(indexTip.y, wrist.y),
      normalizeHeight(middleTip.y, wrist.y),
      normalizeHeight(ringTip.y, wrist.y),
      normalizeHeight(pinkyTip.y, wrist.y)
    ];
    
    return { features, angles, spread, heights };
  } catch (err) {
    console.error("Feature extraction error:", err);
    return null;
  }
};

// Normalize height values relative to wrist
const normalizeHeight = (tipY, wristY) => {
  // In the camera view, lower Y values are higher up
  const diff = wristY - tipY;
  // Normalize to approximately 0-1 range
  return Math.max(0, Math.min(1, diff + 0.1));
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

// Calculate similarity score incorporating all features
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
      
      // Weighted average of features for final similarity score
      // Features: 60%, Angles: 40%
      const weightedSimilarity = featuresSimilarity.mul(0.6).add(anglesSimilarity.mul(0.4));
      
      return weightedSimilarity.arraySync();
    });
  } catch (err) {
    console.error("Similarity calculation error:", err);
    return 0;
  }
};

// Main function to recognize letter from landmarks
export const recognizeLetter = (landmarks) => {
  try {
    const extractedData = extractFeatures(landmarks);
    
    if (!extractedData) return { letter: null, confidence: 0 };
    
    let bestLetter = null;
    let highestConfidence = 0;
    
    // Calculate similarity scores for all letters
    Object.entries(letterTemplates).forEach(([letter, template]) => {
      const similarity = calculateSimilarity(extractedData, template);
      
      if (similarity > highestConfidence) {
        highestConfidence = similarity;
        bestLetter = letter;
      }
    });
    
    // Apply minimum confidence threshold
    if (highestConfidence < 0.60) {
      return { letter: null, confidence: 0 };
    }
    
    return {
      letter: bestLetter,
      confidence: highestConfidence
    };
  } catch (err) {
    console.error("Letter recognition error:", err);
    return { letter: null, confidence: 0 };
  }
};

// Get all letters in the specified category
export const getLettersByCategory = (category = null) => {
  if (!category) return Object.keys(letterTemplates);
  
  return Object.entries(letterTemplates)
    .filter(([_, template]) => template.category === category)
    .map(([letter]) => letter);
};

// Get all available categories
export const getCategories = () => {
  const categories = new Set();
  Object.values(letterTemplates).forEach(template => {
    if (template.category) categories.add(template.category);
  });
  return Array.from(categories);
};

// Export letter templates for use in other components
export const getLetterTemplates = () => letterTemplates;

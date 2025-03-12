import * as tf from '@tensorflow/tfjs';

// Template features for each vowel in LSE
// These are simplified representations of hand positions
const vowelTemplates = {
  // In LSE:
  // A: Extended hand with thumb alongside palm
  // E: Hand closed with thumb across palm
  // I: Hand closed with pinky extended
  // O: Fingertips together forming an 'O' shape
  // U: Hand with index and pinky extended (horns sign)
  A: {
    // All fingers extended
    features: [0.7, 0.7, 0.7, 0.7, 0.7]
  },
  E: {
    // All fingers closed
    features: [0.3, 0.1, 0.1, 0.1, 0.1]
  },
  I: {
    // Pinky extended, others closed
    features: [0.3, 0.1, 0.1, 0.1, 0.7]
  },
  O: {
    // Fingers slightly curved forming an O
    features: [0.5, 0.5, 0.5, 0.5, 0.5]
  },
  U: {
    // Index and pinky extended, others closed
    features: [0.3, 0.7, 0.1, 0.1, 0.7]
  }
};

// Extract features from hand landmarks
const extractFeatures = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return null;
  
  try {
    // Calculate finger extensions based on landmark positions
    // This is a simplified approach
    // For real applications, more sophisticated feature extraction is needed
    
    // Thumb extension (distance from wrist to thumb tip)
    const thumbExtension = calculateDistance(landmarks[0], landmarks[4]);
    
    // Index finger extension (distance from palm to index tip)
    const indexExtension = calculateDistance(landmarks[5], landmarks[8]);
    
    // Middle finger extension (distance from palm to middle tip)
    const middleExtension = calculateDistance(landmarks[9], landmarks[12]);
    
    // Ring finger extension (distance from palm to ring tip)
    const ringExtension = calculateDistance(landmarks[13], landmarks[16]);
    
    // Pinky extension (distance from palm to pinky tip)
    const pinkyExtension = calculateDistance(landmarks[17], landmarks[20]);
    
    // Normalize values
    const maxDistance = 0.3; // Approximate maximum expected distance
    
    return [
      Math.min(thumbExtension / maxDistance, 1),
      Math.min(indexExtension / maxDistance, 1),
      Math.min(middleExtension / maxDistance, 1),
      Math.min(ringExtension / maxDistance, 1),
      Math.min(pinkyExtension / maxDistance, 1)
    ];
  } catch (err) {
    console.error("Feature extraction error:", err);
    return null;
  }
};

// Calculate Euclidean distance between two landmarks
const calculateDistance = (landmark1, landmark2) => {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  const dz = (landmark1.z || 0) - (landmark2.z || 0); // Handle potential undefined z values
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Calculate similarity score using cosine similarity
const calculateSimilarity = (features, template) => {
  try {
    return tf.tidy(() => {
      const featuresTensor = tf.tensor1d(features);
      const templateTensor = tf.tensor1d(template);
      
      const dotProduct = featuresTensor.mul(templateTensor).sum();
      const featuresMagnitude = featuresTensor.norm();
      const templateMagnitude = templateTensor.norm();
      
      // Avoid division by zero
      const divisor = featuresMagnitude.mul(templateMagnitude);
      const similarity = tf.where(
        divisor.greater(0),
        dotProduct.div(divisor),
        tf.scalar(0)
      );
      
      return similarity.arraySync();
    });
  } catch (err) {
    console.error("Similarity calculation error:", err);
    return 0;
  }
};

// Main function to recognize vowel from landmarks
export const recognizeVowel = (landmarks) => {
  try {
    const features = extractFeatures(landmarks);
    
    if (!features) return { vowel: null, confidence: 0 };
    
    let bestVowel = null;
    let highestConfidence = 0;
    
    Object.entries(vowelTemplates).forEach(([vowel, template]) => {
      const similarity = calculateSimilarity(features, template.features);
      
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

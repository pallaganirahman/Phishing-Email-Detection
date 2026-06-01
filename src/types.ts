export interface Email {
  id: string;
  subject: string;
  sender: string;
  body: string;
  label: 'phishing' | 'safe';
  isCustom?: boolean;
}

export interface ExtractedFeatures {
  textLength: number;
  hasSuspiciousUrls: boolean;
  hasIpAddresses: boolean;
  hasUrgencyKeywords: boolean;
  hasFormInputs: boolean;
  hasMismatchedSender: boolean;
  urgentPunctuationCount: number;
  senderDomain: string;
  triggeredKeywords: string[];
  phishingHeuristicScore: number; // 0 to 1 based on heuristics
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    truePositive: number;  // Predicted phishing, actually phishing
    falsePositive: number; // Predicted phishing, actually safe
    trueNegative: number;  // Predicted safe, actually safe
    falseNegative: number; // Predicted safe, actually phishing
  };
}

export interface WordFeatureWeight {
  word: string;
  phishingCount: number;
  safeCount: number;
  phishingProb: number;
  safeProb: number;
  ratio: number; // phishingProb / safeProb (higher means more phishing-leaning)
  label: 'phishing' | 'safe' | 'neutral';
}

export interface PredictionResult {
  isPhishing: boolean;
  probability: number; // Probability of being phishing (0 to 1)
  probabilities: {
    phishing: number;
    safe: number;
  };
  features: ExtractedFeatures;
  wordContributions: {
    word: string;
    contribution: number; // positive for phishing, negative/lower for safe
    type: 'phishing' | 'safe' | 'neutral';
  }[];
}

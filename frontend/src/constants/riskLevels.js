export const RISK_THRESHOLDS = {
  HIGH: 0.75,
  SUSPICIOUS: 0.50,
  // below 0.50 = VERIFIED/LICIT
};

export const getRiskLevel = (score) => {
  if (score == null) return 'unknown';
  if (score >= RISK_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_THRESHOLDS.SUSPICIOUS) return 'suspicious';
  return 'verified';
};

export const VERDICT_LABELS = {
  high: 'HIGH RISK',
  suspicious: 'SUSPICIOUS',
  verified: 'VERIFIED',
  unknown: 'UNKNOWN',
};

export const RECOMMENDED_ACTIONS = {
  high: 'Reject - Do not proceed with verification',
  suspicious: 'Manual Review - Flag for human inspection',
  verified: 'Proceed - Verification passed',
  unknown: 'Insufficient data - classification pending',
};

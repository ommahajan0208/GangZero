/**
 * Maps a node's class and risk score to a display color.
 * Used by TransactionGraph (Cytoscape) and chart components.
 */
export const RISK_COLORS = {
  illicit: '#DC2626',    // red-600
  licit: '#16A34A',      // green-600
  suspicious: '#F59E0B', // amber-500
  unknown: '#9CA3AF',    // gray-400
  selected: '#1D4ED8',   // blue-700 (neutral)
};

export const getNodeColor = (trueClass, riskScore) => {
  if (trueClass === 'illicit' || trueClass === '1') return RISK_COLORS.illicit;
  if (trueClass === 'licit' || trueClass === '2') return RISK_COLORS.licit;
  // For unknown nodes, use model prediction
  if (riskScore >= 0.7) return RISK_COLORS.suspicious;
  return RISK_COLORS.unknown;
};

export const CLASS_COLORS = {
  illicit: '#DC2626',
  licit: '#16A34A',
  unknown: '#9CA3AF',
};

/**
 * Format a large number with commas: 203769 - "203,769"
 */
export const formatNumber = (num) => {
  if (num == null) return '-';
  return num.toLocaleString('en-US');
};

/**
 * Format a decimal as percentage: 0.873 - "87.3%"
 */
export const formatPercent = (value, decimals = 1) => {
  if (value == null) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format a metric value: 0.712 - "0.712"
 */
export const formatMetric = (value, decimals = 3) => {
  if (value == null) return '-';
  return value.toFixed(decimals);
};

/**
 * Time step label: 31 - "Step 31"
 */
export const formatTimeStep = (step) => `Step ${step}`;

/**
 * Time step range: (29, 33) - "Step 29-33"
 */
export const formatTimeRange = (min, max) => `Step ${min}-${max}`;

/**
 * Truncate long text with ellipsis
 */
export const truncate = (text, maxLen = 35) => {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '-';
};

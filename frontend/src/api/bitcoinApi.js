import client from './client';

// GET /api/bitcoin/stats
export const fetchBitcoinStats = () => client.get('/api/bitcoin/stats');

// GET /api/bitcoin/transaction/:txId?model=graphsage
export const fetchTransaction = (txId, model = 'graphsage') =>
  client.get(`/api/bitcoin/transaction/${txId}`, { params: { model } });

// GET /api/bitcoin/graph/:txId?depth=1&direction=both&model=graphsage
export const fetchTransactionGraph = (txId, depth = 1, direction = 'both', model = 'graphsage') =>
  client.get(`/api/bitcoin/graph/${txId}`, { params: { depth, direction, model } });

// GET /api/bitcoin/clusters?min_risk=0.7&min_size=5&time_step_min=1&time_step_max=49
export const fetchClusters = (filters = {}) =>
  client.get('/api/bitcoin/clusters', { params: filters });

// GET /api/bitcoin/cluster/:clusterId
export const fetchClusterDetail = (clusterId) =>
  client.get(`/api/bitcoin/cluster/${clusterId}`);

// GET /api/bitcoin/metrics
export const fetchModelMetrics = () => client.get('/api/bitcoin/metrics');

// GET /api/bitcoin/timeseries
export const fetchTimeSeries = () => client.get('/api/bitcoin/timeseries');

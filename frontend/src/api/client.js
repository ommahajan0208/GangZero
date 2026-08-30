import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60s for model inference
  headers: { 'Content-Type': 'application/json' },
});

// Response: unwrap data, normalize errors
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

export default client;

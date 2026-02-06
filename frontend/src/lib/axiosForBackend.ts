import axios from 'axios';

export const axiosForBackend = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000',
  timeout: 15000,
});

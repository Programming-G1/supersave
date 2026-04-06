import axios from 'axios';

export const useMockApi = import.meta.env.VITE_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

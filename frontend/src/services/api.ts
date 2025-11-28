import axios from 'axios';

// Use relative URL for same-origin requests (served from backend on port 5000)
// In development with separate servers, set VITE_API_URL in .env
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (nickname: string, email: string) =>
  api.post('/api/auth/register', { nickname, email });

export const login = (email: string) =>
  api.post('/api/auth/login', { email });

export const verifyToken = (token: string) =>
  api.get(`/api/auth/verify?token=${token}`);

export const getProfile = () =>
  api.get('/api/auth/profile');

// Races
export const getRaces = (season?: number) =>
  api.get('/api/races', { params: { season } });

export const getRace = (id: number) =>
  api.get(`/api/races/${id}`);

export const getNextRace = () =>
  api.get('/api/races/next');

export const getUpcomingRaces = () =>
  api.get('/api/races/upcoming');

export const getRaceResults = (id: number) =>
  api.get(`/api/races/${id}/results`);

export const getQualifyingOrder = (raceId: number) =>
  api.get(`/api/races/${raceId}/qualifying`);

export const syncRaces = () =>
  api.post('/api/races/sync');

// Drivers
export const getDrivers = (season?: number) =>
  api.get('/api/drivers', { params: { season } });

export const getDriver = (id: number) =>
  api.get(`/api/drivers/${id}`);

export const getDriverStandings = (season?: number) =>
  api.get('/api/drivers/standings', { params: { season } });

export const syncDrivers = () =>
  api.post('/api/drivers/sync');

// Predictions
export const submitPrediction = (raceId: number, positions: number[]) =>
  api.post('/api/predictions', { raceId, positions });

export const getPrediction = (raceId: number) =>
  api.get(`/api/predictions/${raceId}`);

export const getUserPredictions = () =>
  api.get('/api/predictions/user');

// Sprint Predictions
export const submitSprintPrediction = (raceId: number, positions: number[]) =>
  api.post('/api/sprint-predictions', { raceId, positions });

export const getSprintPrediction = (raceId: number) =>
  api.get(`/api/sprint-predictions/${raceId}`);

export const getUserSprintPredictions = () =>
  api.get('/api/sprint-predictions');

// Leaderboard
export const getLeaderboard = () =>
  api.get('/api/leaderboard');

export const getTopThree = () =>
  api.get('/api/leaderboard/top-three');

export const getUserRank = () =>
  api.get('/api/leaderboard/rank');

// Upload
export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/api/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAvatar = () =>
  api.delete('/api/upload/avatar');

// Stats
export const getCompletedRaces = (season?: number) =>
  api.get('/api/stats/races', { params: { season } });

export const getSeasonStats = (season?: number) =>
  api.get('/api/stats/summary', { params: { season } });

export const getPracticeResults = (round: number, session: 1 | 2 | 3, season?: number) =>
  api.get(`/api/stats/practice/${round}/${session}`, { params: { season } });

export const getQualifyingResultsStats = (round: number, season?: number) =>
  api.get(`/api/stats/qualifying/${round}`, { params: { season } });

export const getRaceResultsStats = (round: number, season?: number) =>
  api.get(`/api/stats/race/${round}`, { params: { season } });

export const getSprintResultsStats = (round: number, season?: number) =>
  api.get(`/api/stats/sprint/${round}`, { params: { season } });

export default api;

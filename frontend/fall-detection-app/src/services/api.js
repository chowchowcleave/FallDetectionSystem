import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  detectVideo: async (videoFile) => {
    const formData = new FormData();
    formData.append('file', videoFile);
    const response = await axios.post(`${API_BASE_URL}/detect/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadVideo: (fileId, filename) => {
    return `${API_BASE_URL}/download/${fileId}/${filename}`;
  },

  startLiveDetection: async () => {
    const response = await axios.get(`${API_BASE_URL}/live/start`);
    return response.data;
  },

  stopLiveDetection: async () => {
    const response = await axios.get(`${API_BASE_URL}/live/stop`);
    return response.data;
  },

  getLiveFrame: async () => {
    const response = await axios.get(`${API_BASE_URL}/live/frame`);
    return response.data;
  },

  getStreamUrl: async () => {
    const response = await axios.get(`${API_BASE_URL}/live/stream-url`);
    return response.data;
  },

  // Authentication
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, null, {
      params: { username, password }
    });
    return response.data;
  },

  changePassword: async (username, currentPassword, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/auth/change-password`, null, {
      params: {
        username,
        current_password: currentPassword,
        new_password: newPassword
      }
    });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await axios.get(`${API_BASE_URL}/settings`);
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await axios.post(`${API_BASE_URL}/settings/update`, settings);
    return response.data;
  },

  // Logs
  getLogs: async (limit = 100, dateFrom = null, dateTo = null, minConfidence = null) => {
    const params = { limit };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (minConfidence !== null) params.min_confidence = minConfidence;
    const response = await axios.get(`${API_BASE_URL}/logs/list`, { params });
    return response.data;
  },

  deleteAllLogs: async () => {
    const response = await axios.delete(`${API_BASE_URL}/logs/delete-all`);
    return response.data;
  },

  deleteLog: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/logs/delete/${id}`);
    return response.data;
  },

  getImageUrl: (filename) => {
    return `${API_BASE_URL}/images/${filename}`;
  },

  // Analytics
  getAnalyticsSummary: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics/summary`);
    return response.data;
  },

  getFallsPerDay: async (days = 7) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/falls-per-day`, {
      params: { days }
    });
    return response.data;
  },

  getFallsByHour: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics/falls-by-hour`);
    return response.data;
  },

  getConfidenceDistribution: async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics/confidence-distribution`);
    return response.data;
  },

  getRecentDetections: async (limit = 5) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/recent`, {
      params: { limit }
    });
    return response.data;
  },

  getFallsInRange: async (dateFrom, dateTo) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/range`, {
      params: { date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  },
  getReport: (dateFrom, dateTo) => {
  return `${API_BASE_URL}/analytics/report?date_from=${dateFrom}&date_to=${dateTo}`;
},
};
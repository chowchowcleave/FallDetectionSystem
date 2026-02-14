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
};
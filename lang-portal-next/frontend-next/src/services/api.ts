import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const fetchData = async (endpoint: string) => {
  const response = await api.get(endpoint);
  return response.data;
};

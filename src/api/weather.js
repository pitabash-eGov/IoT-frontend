import api from './axios';

export function getWeather(lat, lon, units = 'metric') {
  return api.get('/weather', { params: { lat, lon, units } });
}

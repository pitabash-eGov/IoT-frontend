import api from './axios';

export function getDevices() {
  return api.get('/devices');
}

export function getDevice(id) {
  return api.get(`/devices/${id}`);
}

export function createDevice(data) {
  return api.post('/devices', data);
}

export function updateDevice(id, data) {
  return api.put(`/devices/${id}`, data);
}

export function deleteDevice(id) {
  return api.delete(`/devices/${id}`);
}

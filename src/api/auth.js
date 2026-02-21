import api from './axios';

export function login(email, password) {
  return api.post('/auth/login', { email, password });
}

export function register(name, email, password) {
  return api.post('/auth/register', { name, email, password });
}

export function refresh() {
  return api.post('/auth/refresh');
}

export function getMe() {
  return api.get('/auth/me');
}

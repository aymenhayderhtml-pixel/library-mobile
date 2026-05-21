import { getApiBaseUrl } from './config';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${getApiBaseUrl()}${endpoint}`, options);
  } catch {
    throw new Error(
      'Cannot reach the library server. Start the backend (npm start) and use the same Wi‑Fi as your phone.'
    );
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(res.ok ? 'Invalid server response' : `Server error (${res.status})`);
    }
  }

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export const authAPI = {
  login: (email, password) => request('/auth/login', 'POST', { email, password }),
  register: (name, email, password) => request('/auth/register', 'POST', { name, email, password }),
};

export const booksAPI = {
  getAll: (token, search, category, sort) => {
    let query = '?';
    if (search) query += `search=${encodeURIComponent(search)}&`;
    if (category && category !== 'All') query += `category=${encodeURIComponent(category)}&`;
    if (sort) query += `sort=${sort}`;
    return request(`/books${query}`, 'GET', null, token);
  },
  getOne: (token, id) => request(`/books/${id}`, 'GET', null, token),
  add: (token, book) => request('/books', 'POST', book, token),
  update: (token, id, book) => request(`/books/${id}`, 'PUT', book, token),
  delete: (token, id) => request(`/books/${id}`, 'DELETE', null, token),
};

export const borrowsAPI = {
  getMine: (token) => request('/borrows/mine', 'GET', null, token),
  borrow: (token, bookId) => request('/borrows', 'POST', { bookId }, token),
  approve: (token, id, data) => request(`/borrows/${id}/approve`, 'PATCH', data, token),
  reject: (token, id) => request(`/borrows/${id}/reject`, 'PATCH', null, token),
  requestReturn: (token, id) => request(`/borrows/${id}/request-return`, 'PATCH', null, token),
  confirmReturn: (token, id) => request(`/borrows/${id}/return`, 'PATCH', null, token),
  payFine: (token, id) => request(`/borrows/${id}/fine/pay`, 'PATCH', null, token),
  waiveFine: (token, id) => request(`/borrows/${id}/fine/waive`, 'PATCH', null, token),
  getAll: (token, status) => request(`/borrows/all${status ? '?status=' + status : ''}`, 'GET', null, token),
};

export const usersAPI = {
  getStats: (token) => request('/users/me/stats', 'GET', null, token),
  getAll: (token, search) => request(`/users${search ? '?search=' + search : ''}`, 'GET', null, token),
  add: (token, user) => request('/users', 'POST', user, token),
  update: (token, id, user) => request(`/users/${id}`, 'PUT', user, token),
  delete: (token, id) => request(`/users/${id}`, 'DELETE', null, token),
  getAdminStats: (token) => request('/users/admin/stats', 'GET', null, token),
  changePassword: (token, currentPassword, newPassword) =>
    request('/users/me/password', 'PUT', { currentPassword, newPassword }, token),
};

const BASE_URL = 'http://192.168.137.230:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();
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
    if (search) query += `search=${search}&`;
    if (category && category !== 'All') query += `category=${category}&`;
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
  return: (token, id) => request(`/borrows/${id}/return`, 'PATCH', null, token),
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
  changePassword: (token, currentPassword, newPassword) => request('/users/me/password', 'PUT', { currentPassword, newPassword }, token),
};

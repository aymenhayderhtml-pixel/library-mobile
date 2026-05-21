export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return password.length >= 6;
}

export function validateName(name) {
  return name.trim().length >= 2;
}

let authData = { token: null, user: null };

export async function saveAuth(token, user) {
  authData.token = token;
  authData.user = user;
}

export async function getAuth() {
  return authData;
}

export async function clearAuth() {
  authData = { token: null, user: null };
}

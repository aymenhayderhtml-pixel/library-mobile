let store = { token: null, user: null };

export function setStore(token, user) {
  store.token = token;
  store.user = user;
}

export function getStore() {
  return store;
}

export function clearStore() {
  store = { token: null, user: null };
}

export function saveFormData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function clearStorage(key) {
  localStorage.removeItem(key);
}
import { API_URL } from './config.js';

export function fetchTasks() {
  return fetch(`${API_URL}/api.php`).then(res => res.json());
}

export function fetchTaskById(id) {
  return fetch(`${API_URL}/api.php?id=${id}`).then(res => res.json());
}

export function postTask(data) {
  console.log(data);
  return fetch(`${API_URL}/api.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(res => res.json());  
}

export function updateTask(id, data) {
  return fetch(`${API_URL}/api.php?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(res => res.json());
}

export function deleteTask(id) {
  return fetch(`${API_URL}/api.php?id=${id}`, {
    method: 'DELETE',
  }).then(res => res.json());
}

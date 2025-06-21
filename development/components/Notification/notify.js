import { success, error } from '@pnotify/core';
import '@pnotify/core/dist/PNotify.css';

export function showSuccess(text) {
  success({ text, delay: 3000, addClass: 'pnotify-success' });
}

export function showError(text) {
  error({ text, delay: 3000, addClass: 'pnotify-error' });
}
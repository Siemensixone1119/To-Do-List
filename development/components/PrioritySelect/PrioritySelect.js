import { saveFormData } from '../../utils/storage.js';
import { STORAGE_KEY } from '../../api/config.js';
import { collectFormData } from '../TaskForm/TaskForm.js';

const list = document.querySelector('#priority');

export function handlePriorityClick(e) {
  if (e.target.tagName !== 'LI' || e.target === list.firstElementChild) return;
  const item = e.target;
  list.removeChild(item);
  list.insertBefore(item, list.firstElementChild);
  saveFormData(STORAGE_KEY, collectFormData());
}

export function initPrioritySelect() {
  list.addEventListener('click', handlePriorityClick);
}
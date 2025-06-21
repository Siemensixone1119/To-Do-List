import { fetchTasks, deleteTask } from '../../api/tasks.js';
import { showSuccess, showError } from '../Notification/notify.js';
import { loadTaskForEditing } from '../TaskForm/TaskForm.js';

const refs = {
  tableElement: document.querySelector('table'),
  tableBodyElement: document.querySelector('tbody'),
  allFilterButton: document.querySelector('[data-sort="all"]'),
  processFilterButton: document.querySelector('[data-sort="process"]'),
  completedFilterButton: document.querySelector('[data-sort="completed"]'),
};

export function renderTasks(tasks) {
  if (tasks.length === 0) {
    renderNoTasksMessage();
  } else {
    tasks.forEach(appendTask);
  }
}

export function appendTask({ id, task, description, category, when, priority, fulfillment }) {
  refs.tableBodyElement.insertAdjacentHTML(
    'beforeend',
    `
    <tr data-id="${id}">
      <td>${task}</td>
      <td>${description}</td>
      <td>${category}</td>
      <td>${when}</td>
      <td>${priority}</td>
      <td>${fulfillment}</td>
      <td>
        <button data-btn="edit">
          <img src="./assets/image/edit.svg" alt="">
        </button>
      </td>
      <td>
        <button data-btn="del" data-id="${id}">
          <img src="./assets/image/delete.svg" alt="">
        </button>
      </td>
    </tr>
    `
  );
}

export function renderNoTasksMessage() {
  refs.tableBodyElement.innerHTML = '<p id="noneTask">У вас еще нет задач!</p>';
}

export function handleTableClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = row?.dataset.id;
  if (!id) return;

  if (btn.dataset.btn === 'del') {
    deleteTask(id)
      .then(() => {
        row.remove();
        showSuccess('Задача удалена!');
        const remaining = refs.tableElement.querySelectorAll('tr[data-id]');
        if (remaining.length === 0) {
          renderNoTasksMessage();
        }
      })
      .catch(() => showError('Ошибка при удалении!'));
  } else if (btn.dataset.btn === 'edit') {
    loadTaskForEditing(id);
  }
}

export function filterByStatus(mode) {
  refs.tableBodyElement.innerHTML = '';
  fetchTasks().then(tasks => {
    let filtered;
    if (mode === 'all') {
      filtered = tasks;
      refs.processFilterButton.classList.remove('todo__filter-button--active');
      refs.completedFilterButton.classList.remove('todo__filter-button--active');
      refs.allFilterButton.classList.add('todo__filter-button--active');
    } else if (mode === 'process') {
      refs.processFilterButton.classList.add('todo__filter-button--active');
      refs.completedFilterButton.classList.remove('todo__filter-button--active');
      refs.allFilterButton.classList.remove('todo__filter-button--active');
      filtered = tasks.filter(t => parseInt(t.fulfillment) < 100);
    } else if (mode === 'completed') {
      refs.processFilterButton.classList.remove('todo__filter-button--active');
      refs.completedFilterButton.classList.add('todo__filter-button--active');
      refs.allFilterButton.classList.remove('todo__filter-button--active');
      filtered = tasks.filter(t => parseInt(t.fulfillment) === 100);
    }

    if (filtered.length === 0) {
      renderNoTasksMessage();
    } else {
      filtered.forEach(appendTask);
    }
  });
}

export function initTaskTable() {
  refs.tableElement.addEventListener('click', handleTableClick);
  refs.allFilterButton.addEventListener('click', () => filterByStatus('all'));
  refs.processFilterButton.addEventListener('click', () => filterByStatus('process'));
  refs.completedFilterButton.addEventListener('click', () => filterByStatus('completed'));

  fetchTasks().then(tasks => renderTasks(tasks));
}
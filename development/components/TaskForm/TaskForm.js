import throttle from "../../utils/throttle.js";
import { saveFormData, clearStorage } from "../../utils/storage.js";
import { STORAGE_KEY } from "../../api/config.js";
import { postTask, updateTask, fetchTaskById } from "../../api/tasks.js";
import { showSuccess, showError } from "../Notification/notify.js";
import { appendTask } from "../TaskTable/TaskTable.js";

let editingTaskId = null;

const refs = {
  todoFormSection: document.querySelector(".todo-form"),
  todoSection: document.querySelector(".todo"),
  addButton: document.querySelector("#addBtn"),
  closeButton: document.querySelector("#closeBtn"),
  formElement: document.querySelector("form"),
  priorityListElement: document.querySelector("#priority"),
};

export function openAddForm() {
  refs.todoSection.classList.add("is-hidden");
  refs.todoFormSection.classList.remove("is-hidden");
}

export function closeAddForm() {
  refs.todoSection.classList.remove("is-hidden");
  refs.todoFormSection.classList.add("is-hidden");
}

export function collectFormData() {
  return {
    task: document.querySelector("#name").value.trim(),
    description: document.querySelector("#description").value.trim(),
    category: document.querySelector("#category").value.trim(),
    when: `${refs.formElement.querySelector("#date").value} ${
      refs.formElement.querySelector("#time").value
    }`,
    priority:
      refs.priorityListElement.querySelector("li:first-child").textContent,
    fulfillment: document.querySelector("#fulfillment").value.trim() + "%",
  };
}

export function populateForm({
  task,
  description,
  category,
  when,
  priority,
  fulfillment,
}) {
  const [date, time] = when.split(" ");
  document.querySelector("#name").value = task;
  document.querySelector("#description").value = description;
  document.querySelector("#category").value = category;
  document.querySelector("#date").value = date || "";
  document.querySelector("#time").value = time || "";
  refs.priorityListElement.querySelector("li:first-child").textContent =
    priority;
  document.querySelector("#fulfillment").value = parseInt(fulfillment);
}

export function populateFormFromStorage() {
  const taskData = localStorage.getItem(STORAGE_KEY);
  try {
    populateForm(JSON.parse(taskData));
  } catch {
    return;
  }
}

function submitTask(data) {
  if (document.querySelector("#noneTask")) {
    document.querySelector("#noneTask").innerHTML = "";
    document.querySelector("tbody").insertAdjacentHTML(
      "afterbegin",
      `
        <thead>
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Category</th>
              <th>When</th>
              <th>Priority</th>
              <th>Fulfillment</th>
            </tr>
          </thead>
        `
    );
  }

  if (!data.task || !data.description || !data.category) {
    showError("Заполните все поля!");
  } else {
    postTask(data).then((task) => appendTask(task));
    showSuccess("Задача добавленна!");
    closeAddForm();
  }
}

export function handleFormSubmit(e) {
  e.preventDefault();
  const formData = collectFormData();

  if (!formData.task || !formData.description || !formData.category) {
    showError("Заполните все поля!");
    return;
  }

  if (editingTaskId) {
    return updateTask(editingTaskId, formData).then(() => {
      showSuccess("Задача обновлена!");
      const oldRow = document
        .querySelector("tbody")
        .querySelector(`tr[data-id="${editingTaskId}"]`);
      if (oldRow) oldRow.remove();
      appendTask({ id: editingTaskId, ...formData });
      editingTaskId = null;
      e.target.reset();
      closeAddForm();
      clearStorage(STORAGE_KEY);
    });
  }

  submitTask(formData);
  e.target.reset();
  clearStorage(STORAGE_KEY);
}

export async function loadTaskForEditing(id) {
  editingTaskId = id;
  try {
    const task = await fetchTaskById(id);
    populateForm(task);
    openAddForm();
  } catch {
    showError("Не удалось загрузить задачу для редактирования");
  }
}

export function initTaskForm() {
  refs.addButton.addEventListener("click", openAddForm);
  refs.closeButton.addEventListener("click", closeAddForm);
  refs.formElement.addEventListener("submit", handleFormSubmit);
  refs.formElement.addEventListener(
    "input",
    throttle(() => saveFormData(STORAGE_KEY, collectFormData()), 1000)
  );
  populateFormFromStorage();
}

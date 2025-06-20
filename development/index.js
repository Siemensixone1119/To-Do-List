import "./index.scss";
import { success, error } from "@pnotify/core";
import throttle from "lodash.throttle";
import "@pnotify/core/dist/PNotify.css";

const API_URL = "http://localhost:3000";
const STORAGE_KEY = "task";
let editingTaskId = null;

const refs = {
  todoFormSection: document.querySelector(".todo-form"),
  todoSection: document.querySelector(".todo"),
  addButton: document.querySelector("#addBtn"),
  closeButton: document.querySelector("#closeBtn"),
  saveButton: document.querySelector("#saveBtn"),
  formElement: document.querySelector("form"),
  tableElement: document.querySelector("table"),
  tableBodyElement: document.querySelector("tbody"),
  priorityListElement: document.querySelector("#priority"),
  allFilterButton: document.querySelector('[data-sort="all"]'),
  processFilterButton: document.querySelector('[data-sort="process"]'),
  completedFilterButton: document.querySelector('[data-sort="completed"]'),
};

const successNotifyOptions = {
  text: "Задача добавленна!",
  delay: 3000,
  addClass: "pnotify-success",
};

const errorNotifyOptions = {
  text: "Заполните все поля!",
  delay: 3000,
  addClass: "pnotify-error",
};

refs.addButton.addEventListener("click", openAddForm);
refs.closeButton.addEventListener("click", closeAddForm);
refs.formElement.addEventListener("submit", handleFormSubmit);
refs.formElement.addEventListener(
  "input",
  throttle(() => saveFormData(STORAGE_KEY, collectFormData()), 1000)
);
refs.tableElement.addEventListener("click", handleTableClick);
refs.allFilterButton.addEventListener("click", () => filterByStatus("all"));
refs.processFilterButton.addEventListener("click", () => filterByStatus("process"));
refs.completedFilterButton.addEventListener("click", () => filterByStatus("completed"));

fetchTasks().then((tasks) => renderTasks(tasks));

populateFormFromStorage();

function collectFormData() {
  return {
    task: document.querySelector("#name").value.trim(),
    description: document.querySelector("#description").value.trim(),
    category: document.querySelector("#category").value.trim(),
    when: `${refs.formElement.querySelector("#date").value} ${
      refs.formElement.querySelector("#time").value
    }`,
    priority: refs.priorityListElement.querySelector("li:first-child").textContent,
    fulfillment: document.querySelector("#fulfillment").value.trim() + "%",
  };
}

function populateForm({
  task,
  description,
  category,
  when,
  priority,
  fulfillment,
}) {
  const [date, time] = when.split(" ");
  {
    document.querySelector("#name").value = task;
    document.querySelector("#description").value = description;
    document.querySelector("#category").value = category;
    document.querySelector("#date").value = date || "";
    document.querySelector("#time").value = time || "";
    refs.priorityListElement.querySelector("li:first-child").textContent = priority;
    document.querySelector("#fulfillment").value = parseInt(fulfillment);
  }
}

function renderTasks(tasks) {
  if (tasks.length === 0) {
    renderNoTasksMessage();
  } else {
    tasks.forEach(appendTask);
  }
}

function openAddForm() {
  refs.todoSection.classList.add("is-hidden");
  refs.todoFormSection.classList.remove("is-hidden");
}

function closeAddForm() {
  refs.todoSection.classList.remove("is-hidden");
  refs.todoFormSection.classList.add("is-hidden");
}

function submitTask(data) {
  if (document.querySelector("#noneTask")) {
    document.querySelector("#noneTask").innerHTML = "";
    refs.tableBodyElement.insertAdjacentHTML(
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
    error(errorNotifyOptions);
  } else {
    postTask(data).then((data) => appendTask(data));
    success(successNotifyOptions);
    closeAddForm();
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  const formData = collectFormData();

  if (!formData.task || !formData.description || !formData.category) {
    error(errorNotifyOptions);
    return;
  }

  if (editingTaskId) {
    return updateTaskOnServer(editingTaskId, formData).then(() => {
      success({ text: "Задача обновлена!" });

      const oldRow = refs.tableBodyElement.querySelector(
        `tr[data-id="${editingTaskId}"]`
      );
      if (oldRow) oldRow.remove();

      appendTask({ id: editingTaskId, ...formData });

      editingTaskId = null;
      e.target.reset();
      closeAddForm();
      clearStorage(STORAGE_KEY);
    });
  }

  submitTask(formData); // теперь это выполнится только если editingTaskId === null
  e.target.reset();
  clearStorage(STORAGE_KEY);
}

function appendTask({
  id,
  task,
  description,
  category,
  when,
  priority,
  fulfillment,
}) {
  refs.tableBodyElement.insertAdjacentHTML(
    "beforeend",
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

function postTask(data) {
  return fetch(`${API_URL}/ToDo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
}

function fetchTasks() {
  return fetch(`${API_URL}/ToDo`).then((response) => response.json());
}

function fetchTaskById(id) {
  return fetch(`${API_URL}/ToDo/${id}`).then((response) => response.json());
}

async function loadTaskForEditing(id) {
  editingTaskId = id;

  try {
    const task = await fetchTaskById(id);
    populateForm(task);
    openAddForm();
  } catch {
    error({ text: "Не удалось загрузить задачу для редактирования" });
  }
}

function updateTaskOnServer(id, data) {
  return fetch(`${API_URL}/ToDo/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

function handleTableClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const row = btn.closest("tr");
  const id = row?.dataset.id;
  if (!id) return;

  if (btn.dataset.btn === "del") {
    deleteTaskFromServer(id)
      .then(() => {
        row.remove();
        success({ text: "Задача удалена!" });

        const remainingTasks = refs.tableElement.querySelectorAll("tr[data-id]");
        if (remainingTasks.length === 0) {
          renderNoTasksMessage();
        }
      })
      .catch(() => error({ text: "Ошибка при удалении!" }));
  } else if (btn.dataset.btn === "edit") {
    loadTaskForEditing(id);
  }
}

function deleteTaskFromServer(id) {
  return fetch(`${API_URL}/ToDo/${id}`, {
    method: "DELETE",
  }).then((response) => response.json());
}

function renderNoTasksMessage() {
  refs.tableBodyElement.innerHTML = '<p id="noneTask">У вас еще нет задач!</p>';
}

function clearStorage(STORAGE_KEY) {
  localStorage.removeItem(STORAGE_KEY);
}

function saveFormData(STORAGE_KEY, data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function populateFormFromStorage() {
  const taskData = localStorage.getItem("task");
  try {
    populateForm(JSON.parse(taskData));
  } catch {
    return;
  }
}

refs.priorityListElement.addEventListener("click", handlePriorityClick);

function handlePriorityClick(e) {
  if (
    e.target.tagName !== "LI" ||
    e.target === refs.priorityListElement.firstElementChild
  )
    return;

  const selectedItem = e.target;

  refs.priorityListElement.removeChild(selectedItem);
  refs.priorityListElement.insertBefore(
    selectedItem,
    refs.priorityListElement.firstElementChild
  );

  saveFormData(STORAGE_KEY, collectFormData());
}

function filterByStatus(mode) {
  refs.tableBodyElement.innerHTML = "";

  fetchTasks().then((tasks) => {
    let filtered = null;
    if (mode === "all") {
      filtered = tasks;
      refs.processFilterButton.classList.remove("todo__filter-button--active");
      refs.completedFilterButton.classList.remove("todo__filter-button--active");
      refs.allFilterButton.classList.add("todo__filter-button--active");
    } else if (mode === "process") {
      refs.processFilterButton.classList.add("todo__filter-button--active");
      refs.completedFilterButton.classList.remove("todo__filter-button--active");
      refs.allFilterButton.classList.remove("todo__filter-button--active");
      filtered = tasks.filter((task) => {
        const num = parseInt(task.fulfillment);
        return num < 100;
      });
    } else if (mode === "completed") {
      refs.processFilterButton.classList.remove("todo__filter-button--active");
      refs.completedFilterButton.classList.add("todo__filter-button--active");
      refs.allFilterButton.classList.remove("todo__filter-button--active");
      filtered = tasks.filter((task) => {
        const num = parseInt(task.fulfillment);
        return num == 100;
      });
    }

    if (filtered.length === 0) {
      renderNoTasksMessage();
    } else {
      filtered.forEach(appendTask);
    }
  });
}
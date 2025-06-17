import "./index.scss";
import { success, error } from "@pnotify/core";
import throttle from "lodash.throttle";
import "@pnotify/core/dist/PNotify.css";

const BASE_URL = "http://localhost:3000";
const STORAGE_KEY = "task";
let editingTaskId = null;

const refs = {
  addToDo: document.querySelector(".addToDo"),
  ToDo: document.querySelector(".ToDo"),
  addBtn: document.querySelector("#addBtn"),
  closeBtn: document.querySelector("#closeBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  form: document.querySelector("form"),
  table: document.querySelector("table"),
  tableBody: document.querySelector("tbody"),
  priorityList: document.querySelector("#priority"),
  allBtn: document.querySelector('[data-sort="all"]'),
  procBtn: document.querySelector('[data-sort="process"]'),
  completBtn: document.querySelector('[data-sort="completed"]'),
};

const optionSucces = {
  text: "Задача добавленна!",
  delay: 3000,
  addClass: "pnotify-success",
};

const optionError = {
  text: "Заполните все поля!",
  delay: 3000,
  addClass: "pnotify-error",
};

refs.addBtn.addEventListener("click", onOpenAddToDo);
refs.closeBtn.addEventListener("click", onCloseAddTodo);
refs.form.addEventListener("submit", onSubmitForm);
refs.form.addEventListener(
  "input",
  throttle(() => onSetLocaleStorage(STORAGE_KEY, getFormData()), 1000)
);
refs.table.addEventListener("click", onDeleteTask);
refs.allBtn.addEventListener("click", () => sortByStatus("all"));
refs.procBtn.addEventListener("click", () => sortByStatus("process"));
refs.completBtn.addEventListener("click", () => sortByStatus("completed"));

getTasks().then((tasks) => examDB(tasks));

populateInput();

function getFormData() {
  return {
    task: document.querySelector("#name").value.trim(),
    description: document.querySelector("#description").value.trim(),
    category: document.querySelector("#category").value.trim(),
    when: `${refs.form.querySelector("#date").value} ${
      refs.form.querySelector("#time").value
    }`,
    priority: refs.priorityList.querySelector("li:first-child").textContent,
    fulfillment: document.querySelector("#fulfillment").value.trim() + "%",
  };
}

function setFormData({
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
    refs.priorityList.querySelector("li:first-child").textContent = priority;
    document.querySelector("#fulfillment").value = parseInt(fulfillment);
  }
}

function examDB(tasks) {
  {
    if (tasks.length === 0) {
      textNoneTask();
    } else {
      tasks.map((task) => createTask(task));
    }
  }
}

function onOpenAddToDo() {
  refs.ToDo.classList.add("is-hidden");
  refs.addToDo.classList.remove("is-hidden");
}

function onCloseAddTodo() {
  refs.ToDo.classList.remove("is-hidden");
  refs.addToDo.classList.add("is-hidden");
}

function addTask(data) {
  if (document.querySelector("#noneTask")) {
    document.querySelector("#noneTask").innerHTML = "";
    refs.tableBody.insertAdjacentHTML(
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
    error(optionError);
  } else {
    addTasks(data).then((data) => createTask(data));
    success(optionSucces);
    onCloseAddTodo();
  }
}

function onSubmitForm(e) {
  e.preventDefault();
  const formData = getFormData();

  if (!formData.task || !formData.description || !formData.category) {
    error(optionError);
    return;
  }

  if (editingTaskId) {
    return updateTask(editingTaskId, formData).then(() => {
      success({ text: "Задача обновлена!" });

      const oldRow = refs.tableBody.querySelector(
        `tr[data-id="${editingTaskId}"]`
      );
      if (oldRow) oldRow.remove();

      createTask({ id: editingTaskId, ...formData });

      editingTaskId = null;
      e.target.reset();
      onCloseAddTodo();
      onResetForm(STORAGE_KEY);
    });
  }

  addTask(formData); // теперь это выполнится только если editingTaskId === null
  e.target.reset();
  onResetForm(STORAGE_KEY);
}

function createTask({
  id,
  task,
  description,
  category,
  when,
  priority,
  fulfillment,
}) {
  refs.tableBody.insertAdjacentHTML(
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

function addTasks(data) {
  return fetch(`${BASE_URL}/ToDo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => response.json());
}

function getTasks() {
  return fetch(`${BASE_URL}/ToDo`).then((response) => response.json());
}

function getTaskById(id) {
  return fetch(`${BASE_URL}/ToDo/${id}`).then((response) => response.json());
}

async function changeData(id) {
  editingTaskId = id;

  try {
    const task = await getTaskById(id);
    setFormData(task);
    onOpenAddToDo();
  } catch {
    error({ text: "Не удалось загрузить задачу для редактирования" });
  }
}

function updateTask(id, data) {
  return fetch(`${BASE_URL}/ToDo/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

function onDeleteTask(e) {
  const btn = e.target.closest("button");
  if (!btn) return;

  const row = btn.closest("tr");
  const id = row?.dataset.id;
  if (!id) return;

  if (btn.dataset.btn === "del") {
    deleteTask(id)
      .then(() => {
        row.remove();
        success({ text: "Задача удалена!" });

        const remainingTasks = refs.table.querySelectorAll("tr[data-id]");
        if (remainingTasks.length === 0) {
          textNoneTask();
        }
      })
      .catch(() => error({ text: "Ошибка при удалении!" }));
  } else if (btn.dataset.btn === "edit") {
    changeData(id);
  }
}

function deleteTask(id) {
  return fetch(`${BASE_URL}/ToDo/${id}`, {
    method: "DELETE",
  }).then((response) => response.json());
}

function textNoneTask() {
  refs.tableBody.innerHTML = '<p id="noneTask">У вас еще нет задач!</p>';
}

function onResetForm(STORAGE_KEY) {
  localStorage.removeItem(STORAGE_KEY);
}

function onSetLocaleStorage(STORAGE_KEY, data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function populateInput() {
  const taskData = localStorage.getItem("task");
  try {
    setFormData(JSON.parse(taskData));
  } catch {
    return;
  }
}

refs.priorityList.addEventListener("click", list);

function list(e) {
  if (
    e.target.tagName !== "LI" ||
    e.target === refs.priorityList.firstElementChild
  )
    return;

  const selectedItem = e.target;

  refs.priorityList.removeChild(selectedItem);
  refs.priorityList.insertBefore(
    selectedItem,
    refs.priorityList.firstElementChild
  );

  onSetLocaleStorage(STORAGE_KEY, getFormData());
}

function sortByStatus(mode) {
  refs.tableBody.innerHTML = "";

  getTasks().then((tasks) => {
    let filtered = null;
    if (mode === "all") {
      filtered = tasks;
      refs.procBtn.classList.remove("btn__blue");
      refs.completBtn.classList.remove("btn__blue");
      refs.allBtn.classList.add("btn__blue");
    } else if (mode === "process") {
      refs.procBtn.classList.add("btn__blue");
      refs.completBtn.classList.remove("btn__blue");
      refs.allBtn.classList.remove("btn__blue");
      filtered = tasks.filter((task) => {
        const num = parseInt(task.fulfillment);
        return num < 100;
      });
    } else if (mode === "completed") {
      refs.procBtn.classList.remove("btn__blue");
      refs.completBtn.classList.add("btn__blue");
      refs.allBtn.classList.remove("btn__blue");
      filtered = tasks.filter((task) => {
        const num = parseInt(task.fulfillment);
        return num == 100;
      });
    }

    if (filtered.length === 0) {
      textNoneTask();
    } else {
      filtered.forEach(createTask);
    }
  });
}

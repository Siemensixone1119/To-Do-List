import "./index.scss";
import { success, error } from "@pnotify/core";
import throttle from "lodash.throttle";
import "@pnotify/core/dist/PNotify.css";

const BASE_URL = "http://localhost:3000";
const STORAGE_KEY = "task";

const refs = {
  addToDo: document.querySelector(".addToDo"),
  ToDo: document.querySelector(".ToDo"),
  addBtn: document.querySelector("#addBtn"),
  closeBtn: document.querySelector("#closeBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  form: document.querySelector("form"),
  table: document.querySelector("tbody"),
  priorityList: document.querySelector("#priority"),
};

// const optionSucces = {
//   text: "Готово!",
//   delay: 3000,
//   addClass: "pnotify-success",
// };

// const optionError = {
//   text: "Готово!",
//   delay: 3000,
//   addClass: "pnotify-error",
// };

refs.addBtn.addEventListener("click", onOpenAddToDo);
refs.closeBtn.addEventListener("click", onCloseAddTodo);
refs.form.addEventListener("submit", onSubmitForm);
refs.form.addEventListener(
  "input",
  throttle(() => onSetLocaleStorage(STORAGE_KEY, getFormData()), 1000)
);

getTasks().then((tasks) => examDB(tasks));

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
  if (!data.task || !data.description || !data.category) {
    error("Заполните все поля");
  } else {
    addTasks(data).then((data) => createTask(data));
    success("Задача добавленна");
    onCloseAddTodo();
  }
}

function onSubmitForm(e) {
  e.preventDefault();
  addTask(getFormData());
  e.target.reset();
  onResetForm(STORAGE_KEY);
}

function createTask({
  task,
  description,
  category,
  when,
  priority,
  fulfillment,
}) {
  refs.table.insertAdjacentHTML(
    "afterend",
    `
    <tr>
      <td>${task}</td>
      <td>${description}</td>
      <td>${category}</td>
      <td>${when}</td>
      <td>${priority}</td>
      <td>${fulfillment}</td>
      <td>
        <button>
          <img src="./assets/image/edit.svg" alt="">
        </button>
      </td>
      <td>
        <button>
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

// function changeData(id, changesData){

// }

// function deleteTask(id){

// }

function textNoneTask() {
  refs.table.innerHTML = "<p>У вас еще нет задач!</p>";
}

function onResetForm(STORAGE_KEY) {
  localStorage.removeItem(STORAGE_KEY);
}

function onSetLocaleStorage(STORAGE_KEY, data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// function fillInput(){

// }

refs.priorityList.addEventListener("click", list);

function list(e) {
  if (
    e.target.tagName !== "LI" ||
    e.target === refs.priorityList.firstElementChild
  ) return;

  const selectedItem = e.target;

  refs.priorityList.removeChild(selectedItem);
  refs.priorityList.insertBefore(selectedItem, refs.priorityList.firstElementChild);

  // Обновляем localStorage после изменения приоритета
  onSetLocaleStorage(STORAGE_KEY, getFormData());
}


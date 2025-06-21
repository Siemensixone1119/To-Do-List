<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = "db.json";
$data = json_decode(file_get_contents($dbPath), true);
$tasks = &$data['ToDo'];

$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Получить все задачи
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($tasks, JSON_UNESCAPED_UNICODE);
    exit;
}

// Добавить новую задачу
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $newTask = json_decode(file_get_contents("php://input"), true);
    $newTask['id'] = end($tasks)['id'] + 1; // автоинкремент
    $tasks[] = $newTask;

    file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode($newTask, JSON_UNESCAPED_UNICODE);
    exit;
}

// Удалить задачу по id
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $id !== null) {
    $index = array_search($id, array_column($tasks, 'id'));
    if ($index !== false) {
        array_splice($tasks, $index, 1);
        file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["status" => "deleted"]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Not found"]);
    }
    exit;
}



// Обновить задачу по id
if ($_SERVER['REQUEST_METHOD'] === 'PATCH' && $id !== null) {
    $updates = json_decode(file_get_contents("php://input"), true);
    foreach ($tasks as &$task) {
        if ($task['id'] === $id) {
            $task = array_merge($task, $updates);
            file_put_contents($dbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(["status" => "updated"]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(["error" => "Not found"]);
    exit;
}

// Если метод не поддерживается
http_response_code(405);
echo json_encode(["error" => "Method Not Allowed"]);

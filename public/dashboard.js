const user = JSON.parse(localStorage.getItem("user"));

if (!user) {
  window.location.href = "login.html";
}

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

async function loadTasks() {

  const response = await fetch(`/tasks/${user.email}`);

  const tasks = await response.json();

  const container = document.getElementById("tasks");

  container.innerHTML = "";

  tasks.forEach(task => {

    const div = document.createElement("div");

    div.className = "task";

    const deadline = new Date(task.deadline);

    div.innerHTML = `
      <h3>${task.title}</h3>

      <p>Status:
      ${task.completed ? "✅ Completed" : "⏳ Pending"}
      </p>

      <p>Deadline:
      ${deadline.toLocaleString()}
      </p>

      <p id="countdown-${task.id}"></p>

      <button class="edit"
      onclick="completeTask(${task.id})">
      Complete
      </button>

      <button class="delete"
      onclick="deleteTask(${task.id})">
      Delete
      </button>
    `;

    container.appendChild(div);

    startCountdown(task.id, deadline, task.title);

  });

}

async function addTask() {

  const title =
    document.getElementById("title").value;

  const deadline =
    document.getElementById("deadline").value;

  if (!title || !deadline) {
    alert("Please fill all fields");
    return;
  }

  const response = await fetch("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      deadline,
      userEmail: user.email
    })
  });

  const data = await response.json();

  alert(data.message);

  alert("✅ Email reminder enabled");

  document.getElementById("title").value = "";
  document.getElementById("deadline").value = "";

  loadTasks();

}

async function deleteTask(id) {

  await fetch(`/tasks/${id}`, {
    method: "DELETE"
  });

  alert("Task deleted");

  loadTasks();

}

async function completeTask(id) {

  await fetch(`/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      completed: true
    })
  });

  alert("Task completed");

  loadTasks();

}

function logout() {

  localStorage.removeItem("user");

  window.location.href = "login.html";

}

function startCountdown(id, deadline, title) {

  const interval = setInterval(() => {

    const now = new Date();

    const diff = deadline - now;

    const element =
      document.getElementById(`countdown-${id}`);

    if (diff <= 0) {

      element.innerHTML =
        "⏰ Deadline Reached";

      if (Notification.permission === "granted") {

        new Notification("Task Reminder", {
          body: `${title} deadline reached`
        });

      }

      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
      );

      audio.play()
      .then(() => {
        console.log("Alarm playing");
      })
      .catch(err => {
        console.log(err);
      });

      alert(`${title} deadline reached`);

      clearInterval(interval);

      return;
    }

    const hours =
      Math.floor(diff / 1000 / 60 / 60);

    const minutes =
      Math.floor(diff / 1000 / 60) % 60;

    const seconds =
      Math.floor(diff / 1000) % 60;

    element.innerHTML =
      `${hours}h ${minutes}m ${seconds}s remaining`;

  }, 1000);

}

loadTasks();
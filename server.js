const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const USERS_FILE = "users.json";
const TASKS_FILE = "tasks.json";

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, "[]");

function readData(file) {
  return JSON.parse(fs.readFileSync(file));
}

function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post("/register", (req, res) => {
  const users = readData(USERS_FILE);
  const { name, email, password } = req.body;

  const existing = users.find(u => u.email === email);

  if (existing) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({ name, email, password });
  writeData(USERS_FILE, users);

  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const users = readData(USERS_FILE);
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({
    success: true,
    user
  });
});

app.get("/tasks/:email", (req, res) => {
  const tasks = readData(TASKS_FILE);
  const userTasks = tasks.filter(t => t.userEmail === req.params.email);
  res.json(userTasks);
});

app.post("/tasks", (req, res) => {
  const tasks = readData(TASKS_FILE);

  const newTask = {
    id: Date.now(),
    ...req.body
  };

  tasks.push(newTask);
  writeData(TASKS_FILE, tasks);

  res.json({ success: true });
});

app.put("/tasks/:id", (req, res) => {
  let tasks = readData(TASKS_FILE);

  tasks = tasks.map(task =>
    task.id == req.params.id
      ? { ...task, ...req.body }
      : task
  );

  writeData(TASKS_FILE, tasks);

  res.json({ success: true });
});

app.delete("/tasks/:id", (req, res) => {
  let tasks = readData(TASKS_FILE);

  tasks = tasks.filter(task => task.id != req.params.id);

  writeData(TASKS_FILE, tasks);

  res.json({ success: true });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ntanengladys@gmail.com",
    pass: "njijzeptoiwhbzzq"
  }
});

setInterval(() => {
  const tasks = readData(TASKS_FILE);
  const now = new Date();

  tasks.forEach(task => {
    const deadline = new Date(task.deadline);
    const diff = deadline - now;

    if (
      diff > 0 &&
      diff < 3600000 &&
      !task.reminderSent
    ) {
      transporter.sendMail({
        from: "YOUR_EMAIL@gmail.com",
        to: task.userEmail,
        subject: "Task Reminder",
        text: `Reminder: Your task "${task.title}" is due soon!`
      });

      task.reminderSent = true;
    }
  });

  writeData(TASKS_FILE, tasks);
}, 10000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
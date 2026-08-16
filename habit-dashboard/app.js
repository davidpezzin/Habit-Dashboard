const STORAGE_KEY = "habit-dashboard-state-v1";
const today = new Date().toISOString().slice(0, 10);

const fallbackState = {
  theme: "light",
  habits: [
    { id: "code", name: "Programar", completedDates: [] },
    { id: "move", name: "Movimentar o corpo", completedDates: [] },
    { id: "learn", name: "Aprender algo novo", completedDates: [] },
  ],
};

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallbackState; }
  catch { return fallbackState; }
}
let state = loadState();

const list = document.querySelector("#habit-list");
const dialog = document.querySelector("#habit-dialog");
const announcement = document.querySelector("#announcement");

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function isComplete(habit) { return habit.completedDates.includes(today); }

function streak(habit) {
  const dates = new Set(habit.completedDates);
  let cursor = new Date(`${today}T12:00:00`);
  let total = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    total += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

function render() {
  document.documentElement.dataset.theme = state.theme;
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const completed = state.habits.filter(isComplete).length;
  const percent = state.habits.length ? Math.round((completed / state.habits.length) * 100) : 0;
  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#best-streak").textContent = Math.max(0, ...state.habits.map(streak));
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#progress-track").setAttribute("aria-valuenow", percent);
  document.querySelector("#progress-track span").style.width = `${percent}%`;

  list.replaceChildren(...state.habits.map((habit) => {
    const item = document.createElement("li");
    item.className = `habit-item${isComplete(habit) ? " done" : ""}`;
    item.innerHTML = `<div class="habit-copy"><p class="habit-name">${escapeHtml(habit.name)}</p><p class="habit-meta">${streak(habit)} dia(s) de sequência</p></div>`;
    const checkbox = document.createElement("input");
    checkbox.className = "habit-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = isComplete(habit);
    checkbox.setAttribute("aria-label", `Concluir ${habit.name}`);
    checkbox.addEventListener("change", () => toggleHabit(habit.id));
    item.append(checkbox);
    return item;
  }));
}

function toggleHabit(id) {
  const habit = state.habits.find((candidate) => candidate.id === id);
  habit.completedDates = isComplete(habit)
    ? habit.completedDates.filter((date) => date !== today)
    : [...habit.completedDates, today];
  persist(); render();
  announcement.textContent = `${habit.name}: ${isComplete(habit) ? "concluído" : "desmarcado"}`;
}

function escapeHtml(text) {
  const element = document.createElement("span"); element.textContent = text; return element.innerHTML;
}

document.querySelector("#open-dialog").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#habit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#habit-name").value.trim();
  if (!name) return;
  state.habits.push({ id: crypto.randomUUID(), name, completedDates: [] });
  persist(); render(); dialog.close(); event.target.reset();
  announcement.textContent = `${name} adicionado`;
});
document.querySelector("#theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark"; persist(); render();
});
render();

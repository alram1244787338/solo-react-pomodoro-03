const TASKS_KEY = 'pomodoro-tasks';
const STATS_KEY = 'pomodoro-stats';
const SETTINGS_KEY = 'pomodoro-settings';

export function getTasks() {
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getStats() {
  const data = localStorage.getItem(STATS_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data
    ? JSON.parse(data)
    : {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
        autoStartNext: false,
      };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isToday(isoDateString) {
  if (!isoDateString) return false;
  try {
    const date = new Date(isoDateString);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  } catch (e) {
    return false;
  }
}

export function addFocusSession(minutes, taskId) {
  const stats = getStats();
  const today = getTodayDateString();

  if (!stats[today]) {
    stats[today] = {
      focusMinutes: 0,
      completedTasks: 0,
      sessions: 0,
    };
  }

  stats[today].focusMinutes += minutes;
  stats[today].sessions += 1;

  if (taskId) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completedPomodoros += 1;
      saveTasks(tasks);
    }
  }

  saveStats(stats);
  return stats;
}

export function completeTask() {
  const stats = getStats();
  const today = getTodayDateString();

  if (!stats[today]) {
    stats[today] = {
      focusMinutes: 0,
      completedTasks: 0,
      sessions: 0,
    };
  }

  stats[today].completedTasks += 1;
  saveStats(stats);
  return stats;
}

export function uncompleteTask() {
  const stats = getStats();
  const today = getTodayDateString();

  if (stats[today] && stats[today].completedTasks > 0) {
    stats[today].completedTasks -= 1;
    saveStats(stats);
  }

  return stats;
}

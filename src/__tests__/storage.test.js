import {
  getTasks,
  saveTasks,
  getStats,
  saveStats,
  getSettings,
  saveSettings,
  addFocusSession,
  completeTask,
  uncompleteTask,
  isToday,
  getTodayDateString,
} from '../utils/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage utils', () => {
  describe('getTasks / saveTasks', () => {
    it('returns empty array when no tasks stored', () => {
      expect(getTasks()).toEqual([]);
    });

    it('saves and retrieves tasks', () => {
      const tasks = [
        { id: '1', title: 'Test Task', completed: false, completedPomodoros: 0 },
      ];
      saveTasks(tasks);
      expect(getTasks()).toEqual(tasks);
    });
  });

  describe('getStats / saveStats', () => {
    it('returns empty object when no stats stored', () => {
      expect(getStats()).toEqual({});
    });

    it('saves and retrieves stats', () => {
      const stats = {
        '2026-06-21': { focusMinutes: 25, completedTasks: 1, sessions: 1 },
      };
      saveStats(stats);
      expect(getStats()).toEqual(stats);
    });
  });

  describe('getSettings / saveSettings', () => {
    it('returns default settings when nothing stored', () => {
      const settings = getSettings();
      expect(settings.workTime).toBe(25);
      expect(settings.shortBreak).toBe(5);
      expect(settings.longBreak).toBe(15);
      expect(settings.longBreakInterval).toBe(4);
      expect(settings.autoStartNext).toBe(false);
    });

    it('saves and retrieves settings', () => {
      const custom = {
        workTime: 50,
        shortBreak: 10,
        longBreak: 30,
        longBreakInterval: 2,
        autoStartNext: true,
      };
      saveSettings(custom);
      expect(getSettings()).toEqual(custom);
    });
  });

  describe('getTodayDateString', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('matches current date', () => {
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(getTodayDateString()).toBe(expected);
    });
  });

  describe('isToday', () => {
    it('returns false for null/undefined/empty string', () => {
      expect(isToday(null)).toBe(false);
      expect(isToday(undefined)).toBe(false);
      expect(isToday('')).toBe(false);
    });

    it('returns true for today', () => {
      const today = new Date().toISOString();
      expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday.toISOString())).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });

    it('returns false for invalid date string', () => {
      expect(isToday('not-a-date')).toBe(false);
    });
  });

  describe('addFocusSession', () => {
    it('creates today entry if not exists', () => {
      const result = addFocusSession(25);
      const today = getTodayDateString();
      expect(result[today]).toBeDefined();
      expect(result[today].focusMinutes).toBe(25);
      expect(result[today].sessions).toBe(1);
      expect(result[today].completedTasks).toBe(0);
    });

    it('adds to existing today entry', () => {
      addFocusSession(25);
      const result = addFocusSession(15);
      const today = getTodayDateString();
      expect(result[today].focusMinutes).toBe(40);
      expect(result[today].sessions).toBe(2);
    });

    it('increments task pomodoro count when taskId provided', () => {
      const tasks = [
        { id: 'task-1', title: 'Test', completed: false, completedPomodoros: 2 },
      ];
      saveTasks(tasks);
      addFocusSession(25, 'task-1');
      const updated = getTasks();
      expect(updated[0].completedPomodoros).toBe(3);
    });

    it('does nothing for unknown taskId', () => {
      const tasks = [
        { id: 'task-1', title: 'Test', completed: false, completedPomodoros: 2 },
      ];
      saveTasks(tasks);
      addFocusSession(25, 'task-999');
      const updated = getTasks();
      expect(updated[0].completedPomodoros).toBe(2);
    });
  });

  describe('completeTask', () => {
    it('increments completedTasks for today', () => {
      const result = completeTask();
      const today = getTodayDateString();
      expect(result[today].completedTasks).toBe(1);
    });

    it('creates today entry if not exists', () => {
      const result = completeTask();
      const today = getTodayDateString();
      expect(result[today]).toBeDefined();
      expect(result[today].focusMinutes).toBe(0);
      expect(result[today].sessions).toBe(0);
      expect(result[today].completedTasks).toBe(1);
    });

    it('increments multiple times', () => {
      completeTask();
      completeTask();
      const result = completeTask();
      const today = getTodayDateString();
      expect(result[today].completedTasks).toBe(3);
    });
  });

  describe('uncompleteTask', () => {
    it('decrements completedTasks for today', () => {
      completeTask();
      completeTask();
      const result = uncompleteTask();
      const today = getTodayDateString();
      expect(result[today].completedTasks).toBe(1);
    });

    it('does not go below 0', () => {
      completeTask();
      uncompleteTask();
      const result = uncompleteTask();
      const today = getTodayDateString();
      expect(result[today].completedTasks).toBe(0);
    });

    it('does nothing when no today entry', () => {
      const result = uncompleteTask();
      const today = getTodayDateString();
      expect(result[today]).toBeUndefined();
    });
  });
});

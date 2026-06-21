import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getTasks, saveTasks, getStats, getTodayDateString, saveStats } from '../utils/storage';
import styles from '../styles/TaskList.module.css';

function TaskList() {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('all');
  const [todayCompleted, setTodayCompleted] = useState(0);

  useEffect(() => {
    loadTasks();
    loadTodayStats();
  }, []);

  const loadTasks = () => {
    setTasks(getTasks());
  };

  const loadTodayStats = () => {
    const stats = getStats();
    const today = getTodayDateString();
    setTodayCompleted(stats[today]?.completedTasks || 0);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const wasCompleted = task.completed;
        const isCompleted = !wasCompleted;

        if (isCompleted && !wasCompleted) {
          const stats = getStats();
          const today = getTodayDateString();
          if (!stats[today]) {
            stats[today] = { focusMinutes: 0, completedTasks: 0, sessions: 0 };
          }
          stats[today].completedTasks += 1;
          saveStats(stats);
          loadTodayStats();
        } else if (!isCompleted && wasCompleted) {
          const stats = getStats();
          const today = getTodayDateString();
          if (stats[today] && stats[today].completedTasks > 0) {
            stats[today].completedTasks -= 1;
            saveStats(stats);
            loadTodayStats();
          }
        }

        return {
          ...task,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.completed) {
      const stats = getStats();
      const today = getTodayDateString();
      if (stats[today] && stats[today].completedTasks > 0) {
        stats[today].completedTasks -= 1;
        saveStats(stats);
        loadTodayStats();
      }
    }

    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const clearCompleted = () => {
    if (!confirm('确定要清除所有已完成的任务吗？')) return;
    const updatedTasks = tasks.filter((task) => !task.completed);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const filteredTasks = () => {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  };

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>任务列表</h2>
          <div className={styles.todayStats}>
            <span className={styles.todayBadge}>今日完成: {todayCompleted} 个</span>
          </div>
        </div>

        <form className={styles.addForm} onSubmit={addTask}>
          <input
            type="text"
            placeholder="添加新任务..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.addBtn}>
            添加
          </button>
        </form>

        <div className={styles.filterBar}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({tasks.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            进行中 ({activeCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成 ({completedCount})
          </button>
        </div>

        <div className={styles.taskList}>
          {filteredTasks().length === 0 ? (
            <div className={styles.emptyState}>
              <p>还没有任务</p>
              <p className={styles.emptyHint}>添加一个任务开始专注吧！</p>
            </div>
          ) : (
            filteredTasks().map((task) => (
              <div
                key={task.id}
                className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
              >
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkmark}></span>
                </label>
                <div className={styles.taskContent}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  {task.completedPomodoros > 0 && (
                    <span className={styles.pomodoroCount}>
                      {task.completedPomodoros} 🍅
                    </span>
                  )}
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteTask(task.id)}
                  title="删除任务"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {completedCount > 0 && (
          <div className={styles.footer}>
            <button className={styles.clearBtn} onClick={clearCompleted}>
              清除已完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskList;

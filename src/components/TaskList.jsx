import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  getTasks,
  saveTasks,
  getStats,
  getTodayDateString,
  completeTask,
  uncompleteTask,
  isToday,
} from '../utils/storage';
import ConfirmModal from './ConfirmModal';
import styles from '../styles/TaskList.module.css';

function TaskList() {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('all');
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    loadTasks();
    loadTodayStats();
  }, []);

  const loadTasks = useCallback(() => {
    setTasks(getTasks());
  }, []);

  const loadTodayStats = useCallback(() => {
    const stats = getStats();
    const today = getTodayDateString();
    setTodayCompleted(stats[today]?.completedTasks || 0);
  }, []);

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
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    const isCompleted = !wasCompleted;

    if (isCompleted && !wasCompleted) {
      completeTask();
    } else if (!isCompleted && wasCompleted && isToday(task.completedAt)) {
      uncompleteTask();
    }
    loadTodayStats();

    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
          }
        : t
    );

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setConfirmModal({
      isOpen: true,
      title: '确认删除任务',
      message: '确定要删除这个任务吗？此操作无法撤销。',
      onConfirm: () => {
        if (task.completed && isToday(task.completedAt)) {
          uncompleteTask();
          loadTodayStats();
        }
        const updatedTasks = tasks.filter((t) => t.id !== taskId);
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      },
    });
  };

  const handleClearCompleted = () => {
    setConfirmModal({
      isOpen: true,
      title: '清除已完成任务',
      message: '确定要清除所有已完成的任务吗？',
      onConfirm: () => {
        const todayCompletedCount = tasks.filter((t) => t.completed && isToday(t.completedAt)).length;
        for (let i = 0; i < todayCompletedCount; i++) {
          uncompleteTask();
        }
        loadTodayStats();
        const updatedTasks = tasks.filter((t) => !t.completed);
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      },
    });
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
                  onClick={() => handleDeleteTask(task.id)}
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
            <button className={styles.clearBtn} onClick={handleClearCompleted}>
              清除已完成
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        confirmText="确认"
        cancelText="取消"
      />
    </div>
  );
}

export default TaskList;

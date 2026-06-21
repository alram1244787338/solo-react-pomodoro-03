import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSettings, saveSettings, addFocusSession, getTodayDateString, getStats } from '../utils/storage';
import { requestNotificationPermission, sendNotification, playCompletionSound } from '../utils/notification';
import { getTasks } from '../utils/storage';
import ConfirmModal from './ConfirmModal';
import styles from '../styles/Timer.module.css';

const TIMER_MODES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};

function Timer({ isActive = true }) {
  const { theme } = useTheme();
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  const [settings, setSettings] = useState(() => getSettings());
  const [mode, setMode] = useState(TIMER_MODES.WORK);
  const [timeLeft, setTimeLeft] = useState(settings.workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [todayStats, setTodayStats] = useState({ focusMinutes: 0, completedTasks: 0, sessions: 0 });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const completedPomodorosRef = useRef(completedPomodoros);
  const settingsRef = useRef(settings);
  const selectedTaskIdRef = useRef(selectedTaskId);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    completedPomodorosRef.current = completedPomodoros;
  }, [completedPomodoros]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  useEffect(() => {
    requestNotificationPermission();
    loadTasks();
    loadTodayStats();
  }, []);

  useEffect(() => {
    const modeTime = {
      [TIMER_MODES.WORK]: settings.workTime * 60,
      [TIMER_MODES.SHORT_BREAK]: settings.shortBreak * 60,
      [TIMER_MODES.LONG_BREAK]: settings.longBreak * 60,
    };
    if (!isRunning) {
      setTimeLeft(modeTime[mode]);
    }
  }, [mode, settings, isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActiveRef.current) return;

      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || e.target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer]);

  const loadTasks = useCallback(() => {
    const allTasks = getTasks();
    const activeTasks = allTasks.filter((t) => !t.completed);
    setTasks(activeTasks);
  }, []);

  const loadTodayStats = useCallback(() => {
    const stats = getStats();
    const today = getTodayDateString();
    setTodayStats(stats[today] || { focusMinutes: 0, completedTasks: 0, sessions: 0 });
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playCompletionSound();

    const currentMode = modeRef.current;
    const currentSettings = settingsRef.current;
    const currentTaskId = selectedTaskIdRef.current;
    const currentPomodoros = completedPomodorosRef.current;

    if (currentMode === TIMER_MODES.WORK) {
      addFocusSession(currentSettings.workTime, currentTaskId);
      const newCount = currentPomodoros + 1;
      setCompletedPomodoros(newCount);
      completedPomodorosRef.current = newCount;
      loadTodayStats();
      loadTasks();

      sendNotification('🍅 工作时间结束！', '休息一下吧，你做得很棒！');

      if (newCount % currentSettings.longBreakInterval === 0) {
        setMode(TIMER_MODES.LONG_BREAK);
      } else {
        setMode(TIMER_MODES.SHORT_BREAK);
      }
    } else {
      sendNotification('☕ 休息结束！', '准备好开始下一个番茄钟了吗？');
      setMode(TIMER_MODES.WORK);
    }

    if (currentSettings.autoStartNext) {
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
    }
  }, [loadTodayStats, loadTasks]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    const currentMode = modeRef.current;
    const currentSettings = settingsRef.current;
    const modeTime = {
      [TIMER_MODES.WORK]: currentSettings.workTime * 60,
      [TIMER_MODES.SHORT_BREAK]: currentSettings.shortBreak * 60,
      [TIMER_MODES.LONG_BREAK]: currentSettings.longBreak * 60,
    };
    setTimeLeft(modeTime[currentMode]);
  }, []);

  const switchMode = useCallback((newMode) => {
    if (isRunning) {
      setConfirmModal({
        isOpen: true,
        title: '确认切换模式',
        message: '计时器正在运行，确定要切换模式吗？当前进度将丢失。',
        onConfirm: () => {
          setIsRunning(false);
          setMode(newMode);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
        },
      });
      return;
    }
    setIsRunning(false);
    setMode(newMode);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case TIMER_MODES.WORK:
        return '专注时间';
      case TIMER_MODES.SHORT_BREAK:
        return '短休息';
      case TIMER_MODES.LONG_BREAK:
        return '长休息';
      default:
        return '';
    }
  };

  const progress = () => {
    const modeTime = {
      [TIMER_MODES.WORK]: settings.workTime * 60,
      [TIMER_MODES.SHORT_BREAK]: settings.shortBreak * 60,
      [TIMER_MODES.LONG_BREAK]: settings.longBreak * 60,
    };
    return ((modeTime[mode] - timeLeft) / modeTime[mode]) * 100;
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    saveSettings(tempSettings);
    settingsRef.current = tempSettings;
    setShowSettings(false);
    setTimeLeft(tempSettings.workTime * 60);
  };

  const getModeClass = () => {
    if (mode === TIMER_MODES.WORK) return styles.workMode;
    if (mode === TIMER_MODES.SHORT_BREAK) return styles.shortBreakMode;
    return styles.longBreakMode;
  };

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={`${styles.card} ${getModeClass()}`}>
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${mode === TIMER_MODES.WORK ? styles.active : ''}`}
            onClick={() => switchMode(TIMER_MODES.WORK)}
          >
            专注
          </button>
          <button
            className={`${styles.modeBtn} ${mode === TIMER_MODES.SHORT_BREAK ? styles.active : ''}`}
            onClick={() => switchMode(TIMER_MODES.SHORT_BREAK)}
          >
            短休息
          </button>
          <button
            className={`${styles.modeBtn} ${mode === TIMER_MODES.LONG_BREAK ? styles.active : ''}`}
            onClick={() => switchMode(TIMER_MODES.LONG_BREAK)}
          >
            长休息
          </button>
        </div>

        <div className={styles.timerDisplay}>
          <div className={styles.timerCircle}>
            <svg className={styles.progressRing} viewBox="0 0 100 100">
              <circle
                className={styles.progressRingBg}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className={styles.progressRingCircle}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress() / 100)}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className={styles.timeText}>
              <span className={styles.modeLabel}>{getModeLabel()}</span>
              <span className={styles.time}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className={styles.taskSelector}>
          <select
            className={styles.taskSelect}
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            disabled={isRunning}
          >
            <option value="">选择任务（可选）</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.completedPomodoros}🍅)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={resetTimer}>
            重置 (R)
          </button>
          <button className={`${styles.controlBtn} ${styles.primaryBtn}`} onClick={toggleTimer}>
            {isRunning ? '暂停 (空格)' : '开始 (空格)'}
          </button>
          <button className={styles.controlBtn} onClick={() => setShowSettings(true)}>
            设置
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{todayStats.sessions}</span>
            <span className={styles.statLabel}>今日完成</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{todayStats.focusMinutes}</span>
            <span className={styles.statLabel}>专注分钟</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{completedPomodoros}</span>
            <span className={styles.statLabel}>本轮次数</span>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>时间设置</h3>
            <div className={styles.settingsGroup}>
              <label>
                专注时间（分钟）
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings.workTime}
                  onChange={(e) => setTempSettings({ ...tempSettings, workTime: parseInt(e.target.value) || 25 })}
                />
              </label>
              <label>
                短休息（分钟）
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.shortBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, shortBreak: parseInt(e.target.value) || 5 })}
                />
              </label>
              <label>
                长休息（分钟）
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.longBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreak: parseInt(e.target.value) || 15 })}
                />
              </label>
              <label>
                长休息间隔（番茄数）
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.longBreakInterval}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreakInterval: parseInt(e.target.value) || 4 })}
                />
              </label>
              <label className={styles.toggleLabel}>
                <div className={styles.toggleText}>
                  <span>自动开始下一轮</span>
                  <span className={styles.toggleHint}>计时结束后自动进入下一阶段</span>
                </div>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={!!tempSettings.autoStartNext}
                    onChange={(e) => setTempSettings({ ...tempSettings, autoStartNext: e.target.checked })}
                  />
                  <span className={`${styles.toggleSlider} ${tempSettings.autoStartNext ? styles.checked : ''}`}></span>
                </div>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowSettings(false)}>取消</button>
              <button className={styles.primaryBtn} onClick={handleSaveSettings}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Timer;

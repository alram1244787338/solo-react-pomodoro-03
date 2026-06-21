import { useTheme } from '../context/ThemeContext';
import styles from '../styles/Navbar.module.css';

function Navbar({ currentPage, onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'timer', label: '番茄钟', icon: '⏱️' },
    { id: 'tasks', label: '任务', icon: '📋' },
    { id: 'stats', label: '统计', icon: '📊' },
  ];

  return (
    <nav className={`${styles.navbar} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🍅</span>
          <span className={styles.logoText}>番茄钟</span>
        </div>

        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navBtn} ${currentPage === item.id ? styles.active : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        <button className={styles.themeBtn} onClick={toggleTheme} title="切换主题">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

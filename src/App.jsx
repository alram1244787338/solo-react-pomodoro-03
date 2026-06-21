import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import Statistics from './components/Statistics';
import { useTheme } from './context/ThemeContext';
import styles from './styles/App.module.css';

function App() {
  const [currentPage, setCurrentPage] = useState('timer');
  const { theme } = useTheme();

  return (
    <div className={`${styles.app} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className={styles.main}>
        <div className={currentPage === 'timer' ? '' : styles.hiddenPage}>
          <Timer isActive={currentPage === 'timer'} />
        </div>
        <div className={currentPage === 'tasks' ? '' : styles.hiddenPage}>
          <TaskList />
        </div>
        <div className={currentPage === 'stats' ? '' : styles.hiddenPage}>
          <Statistics />
        </div>
      </main>
    </div>
  );
}

export default App;

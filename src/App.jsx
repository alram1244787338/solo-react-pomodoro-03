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

  const renderPage = () => {
    switch (currentPage) {
      case 'timer':
        return <Timer />;
      case 'tasks':
        return <TaskList />;
      case 'stats':
        return <Statistics />;
      default:
        return <Timer />;
    }
  };

  return (
    <div className={`${styles.app} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className={styles.main}>{renderPage()}</main>
    </div>
  );
}

export default App;

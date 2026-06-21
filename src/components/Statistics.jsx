import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getStats, getTodayDateString } from '../utils/storage';
import styles from '../styles/Statistics.module.css';

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

function Statistics() {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState('daily');
  const [stats, setStats] = useState({});
  const barCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = setTimeout(() => {
        if (barCanvasRef.current) {
          drawBarChart();
        }
        if (lineCanvasRef.current) {
          drawLineChart();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (barCanvasRef.current) {
      drawBarChart();
    }
    if (lineCanvasRef.current) {
      drawLineChart();
    }
  }, [stats, viewMode, theme]);

  const getChartData = useCallback(() => {
    const data = [];
    const today = new Date();

    if (viewMode === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayData = stats[dateStr] || { focusMinutes: 0, sessions: 0, completedTasks: 0 };
        data.push({
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          value: dayData.focusMinutes,
          sessions: dayData.sessions,
          fullDate: dateStr,
        });
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - i * 7 - today.getDay());

        let totalMinutes = 0;
        let totalSessions = 0;

        for (let d = 0; d < 7; d++) {
          const checkDate = new Date(weekStart);
          checkDate.setDate(checkDate.getDate() + d);
          const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          const dayData = stats[dateStr];
          if (dayData) {
            totalMinutes += dayData.focusMinutes;
            totalSessions += dayData.sessions;
          }
        }

        data.push({
          label: `第${getWeekNumber(weekStart)}周`,
          value: totalMinutes,
          sessions: totalSessions,
          fullDate: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        });
      }
    }

    return data;
  }, [viewMode, stats]);

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getColors = useCallback(() => {
    if (theme === 'dark') {
      return {
        background: '#252542',
        text: '#eaeaea',
        grid: '#3a3a5c',
        bar: '#e74c3c',
        barGradient: ['#e74c3c', '#c0392b'],
        line: '#3498db',
        lineGradient: ['#3498db', '#2980b9'],
        point: '#2ecc71',
      };
    }
    return {
      background: '#ffffff',
      text: '#333333',
      grid: '#e0e0e0',
      bar: '#e74c3c',
      barGradient: ['#e74c3c', '#ff6b6b'],
      line: '#3498db',
      lineGradient: ['#3498db', '#5dade2'],
      point: '#2ecc71',
    };
  }, [theme]);

  const drawBarChart = useCallback(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = getChartData();
    const colors = getColors();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map((d) => d.value), 60);
    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = (chartWidth / data.length) * 0.4;

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round((maxValue / 5) * (5 - i));
      ctx.fillStyle = colors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${value}`, padding.left - 8, y + 4);
    }

    data.forEach((item, index) => {
      const x = padding.left + index * (barWidth + barGap) + barGap / 2;
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, colors.barGradient[0]);
      gradient.addColorStop(1, colors.barGradient[1]);

      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 4);
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - padding.bottom + 20);

      if (item.value > 0) {
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${item.value}`, x + barWidth / 2, y - 8);
      }
    });

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('专注时长（分钟）', width / 2, 18);
  }, [getChartData, getColors]);

  const drawLineChart = useCallback(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = getChartData();
    const colors = getColors();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map((d) => d.sessions), 8);
    const xStep = chartWidth / (data.length - 1 || 1);

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = Math.round((maxValue / 5) * (5 - i));
      ctx.fillStyle = colors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${value}`, padding.left - 8, y + 4);
    }

    const points = data.map((item, index) => ({
      x: padding.left + index * xStep,
      y: padding.top + chartHeight - (item.sessions / maxValue) * chartHeight,
      value: item.sessions,
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prev = points[index - 1];
        const cpX = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, point.y, point.x, point.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();

    const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    areaGradient.addColorStop(0, `${colors.lineGradient[0]}40`);
    areaGradient.addColorStop(1, `${colors.lineGradient[0]}05`);
    ctx.fillStyle = areaGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = points[index - 1];
        const cpX = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, point.y, point.x, point.y);
      }
    });
    ctx.stroke();

    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = colors.background;
      ctx.fill();
      ctx.strokeStyle = colors.point;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors.point;
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data[index].label, point.x, height - padding.bottom + 20);

      if (point.value > 0) {
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${point.value}`, point.x, point.y - 12);
      }
    });

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('完成番茄数', width / 2, 18);
  }, [getChartData, getColors]);

  const calculateTotals = () => {
    const data = getChartData();
    const totalMinutes = data.reduce((sum, d) => sum + d.value, 0);
    const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);
    const avgMinutes = data.length > 0 ? Math.round(totalMinutes / data.length) : 0;
    return { totalMinutes, totalSessions, avgMinutes };
  };

  const totals = calculateTotals();
  const today = getTodayDateString();
  const todayData = stats[today] || { focusMinutes: 0, sessions: 0, completedTasks: 0 };

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : ''}`}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>专注统计</h2>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'daily' ? styles.active : ''}`}
              onClick={() => setViewMode('daily')}
            >
              每日
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'weekly' ? styles.active : ''}`}
              onClick={() => setViewMode('weekly')}
            >
              每周
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{todayData.focusMinutes}</span>
              <span className={styles.statLabel}>今日专注(分钟)</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🍅</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{todayData.sessions}</span>
              <span className={styles.statLabel}>今日番茄数</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{todayData.completedTasks}</span>
              <span className={styles.statLabel}>今日完成任务</span>
            </div>
          </div>
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>总专注时长</span>
            <span className={styles.summaryValue}>{totals.totalMinutes} 分钟</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>总番茄数</span>
            <span className={styles.summaryValue}>{totals.totalSessions} 个</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>日均专注</span>
            <span className={styles.summaryValue}>{totals.avgMinutes} 分钟</span>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>专注时长趋势</h3>
          <canvas ref={barCanvasRef} className={styles.chartCanvas}></canvas>
        </div>

        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>番茄完成趋势</h3>
          <canvas ref={lineCanvasRef} className={styles.chartCanvas}></canvas>
        </div>
      </div>
    </div>
  );
}

export default Statistics;

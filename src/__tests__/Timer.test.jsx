import { screen, fireEvent, act, renderWithTheme } from './test-utils';
import Timer from '../components/Timer';
import { getStats, getTodayDateString, saveSettings } from '../utils/storage';

jest.mock('../utils/notification', () => ({
  requestNotificationPermission: jest.fn(),
  sendNotification: jest.fn(),
  playCompletionSound: jest.fn(),
}));

function advanceSeconds(seconds) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

describe('Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial render', () => {
    it('shows default work time 25:00', () => {
      renderWithTheme(<Timer />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('shows start button', () => {
      renderWithTheme(<Timer />);
      expect(screen.getByText(/开始/)).toBeInTheDocument();
    });

    it('displays mode label "专注时间"', () => {
      renderWithTheme(<Timer />);
      expect(screen.getByText('专注时间')).toBeInTheDocument();
    });
  });

  describe('timer countdown', () => {
    it('starts counting down when start button clicked', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText(/开始/));

      advanceSeconds(1);

      expect(screen.getByText('24:59')).toBeInTheDocument();
    });

    it('pauses when pause button clicked', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText(/开始/));

      expect(screen.getByText(/暂停/)).toBeInTheDocument();

      advanceSeconds(2);

      expect(screen.getByText('24:58')).toBeInTheDocument();

      fireEvent.click(screen.getByText(/暂停/));

      advanceSeconds(5);

      expect(screen.getByText('24:58')).toBeInTheDocument();
    });

    it('resets timer when reset button clicked', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText(/开始/));

      advanceSeconds(10);

      fireEvent.click(screen.getByText(/重置/));
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('adds a focus session when work timer completes', () => {
      saveSettings({
        workTime: 1,
        shortBreak: 1,
        longBreak: 1,
        longBreakInterval: 4,
        autoStartNext: false,
      });

      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText(/开始/));

      advanceSeconds(60);

      act(() => {
        jest.runOnlyPendingTimers();
      });

      const stats = getStats();
      const today = getTodayDateString();
      expect(stats[today]).toBeDefined();
      expect(stats[today].focusMinutes).toBe(1);
      expect(stats[today].sessions).toBe(1);
    });
  });

  describe('mode switching', () => {
    it('switches to short break mode', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText('短休息'));
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    it('switches to long break mode', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText('长休息'));
      expect(screen.getByText('15:00')).toBeInTheDocument();
    });

    it('shows confirm dialog when switching mode while running', () => {
      renderWithTheme(<Timer />);
      fireEvent.click(screen.getByText(/开始/));

      advanceSeconds(1);

      fireEvent.click(screen.getByText('短休息'));
      expect(screen.getByText('确认切换模式')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('starts timer with space key when active', () => {
      renderWithTheme(<Timer isActive={true} />);
      fireEvent.keyDown(window, { code: 'Space' });

      advanceSeconds(1);

      expect(screen.getByText('24:59')).toBeInTheDocument();
    });

    it('resets timer with R key when active', () => {
      renderWithTheme(<Timer isActive={true} />);
      fireEvent.click(screen.getByText(/开始/));

      advanceSeconds(3);

      fireEvent.keyDown(window, { key: 'R' });
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('does not trigger shortcuts when isActive is false', () => {
      renderWithTheme(<Timer isActive={false} />);
      fireEvent.keyDown(window, { code: 'Space' });

      advanceSeconds(1);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('does not trigger shortcut when focus is on input', () => {
      renderWithTheme(<Timer isActive={true} />);
      fireEvent.click(screen.getByText('设置'));
      const input = screen.getByLabelText(/专注时间/);
      fireEvent.keyDown(input, { code: 'Space' });

      advanceSeconds(1);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });
});

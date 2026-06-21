import { screen, fireEvent, act, renderWithTheme } from './test-utils';
import TaskList from '../components/TaskList';
import { saveTasks, getTasks, getStats, getTodayDateString } from '../utils/storage';

describe('TaskList', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial render', () => {
    it('shows empty state when no tasks', () => {
      renderWithTheme(<TaskList />);
      expect(screen.getByText('还没有任务')).toBeInTheDocument();
    });

    it('shows tasks from localStorage', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null },
        { id: '2', title: 'Task 2', completed: true, completedPomodoros: 2, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      ];
      saveTasks(tasks);
      renderWithTheme(<TaskList />);
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  describe('add task', () => {
    it('adds a new task via form submit', () => {
      renderWithTheme(<TaskList />);
      const input = screen.getByPlaceholderText('添加新任务...');
      fireEvent.change(input, { target: { value: 'New Task' } });
      fireEvent.submit(input.closest('form'));

      expect(screen.getByText('New Task')).toBeInTheDocument();
      expect(getTasks()).toHaveLength(1);
    });

    it('does not add empty task', () => {
      renderWithTheme(<TaskList />);
      const input = screen.getByPlaceholderText('添加新任务...');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(input.closest('form'));

      expect(screen.getByText('还没有任务')).toBeInTheDocument();
      expect(getTasks()).toEqual([]);
    });
  });

  describe('toggle task completion', () => {
    it('marks task as completed', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null },
      ];
      saveTasks(tasks);
      renderWithTheme(<TaskList />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(getTasks()[0].completed).toBe(true);
    });

    it('increments today completed count when task completed', () => {
      const tasks = [
        { id: '1', title: 'Task 1', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null },
      ];
      saveTasks(tasks);
      renderWithTheme(<TaskList />);

      fireEvent.click(screen.getByRole('checkbox'));
      expect(screen.getByText(/今日完成: 1/)).toBeInTheDocument();
    });
  });

  describe('delete task', () => {
    beforeEach(() => {
      const tasks = [
        { id: '1', title: 'Task to delete', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null },
      ];
      saveTasks(tasks);
    });

    it('shows confirm modal when delete button clicked', () => {
      renderWithTheme(<TaskList />);
      fireEvent.click(screen.getByTitle('删除任务'));
      expect(screen.getByText('确认删除任务')).toBeInTheDocument();
    });

    it('deletes task after confirm', () => {
      renderWithTheme(<TaskList />);
      fireEvent.click(screen.getByTitle('删除任务'));
      fireEvent.click(screen.getByRole('button', { name: '确认' }));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
      expect(getTasks()).toEqual([]);
    });
  });

  describe('clear completed', () => {
    beforeEach(() => {
      const tasks = [
        { id: '1', title: 'Active Task', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: null },
        { id: '2', title: 'Completed Task', completed: true, completedPomodoros: 0, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
      ];
      saveTasks(tasks);
    });

    it('shows clear button when there are completed tasks', () => {
      renderWithTheme(<TaskList />);
      expect(screen.getByText('清除已完成')).toBeInTheDocument();
    });

    it('removes completed tasks after confirm', () => {
      renderWithTheme(<TaskList />);
      fireEvent.click(screen.getByText('清除已完成'));
      fireEvent.click(screen.getByRole('button', { name: '确认' }));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByText('Active Task')).toBeInTheDocument();
      expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
      expect(getTasks()).toHaveLength(1);
    });
  });
});

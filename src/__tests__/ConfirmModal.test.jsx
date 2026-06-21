import { screen, fireEvent, act, renderWithTheme } from './test-utils';
import ConfirmModal from '../components/ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test message content',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when isOpen is false', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message content')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons with default text', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    renderWithTheme(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Back"
      />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay clicked', () => {
    const { container } = renderWithTheme(<ConfirmModal {...defaultProps} />);
    const overlay = container.firstChild;
    fireEvent.click(overlay);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when modal content is clicked', () => {
    renderWithTheme(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Title'));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('prevents clicks during closing animation', () => {
    const { rerender } = renderWithTheme(<ConfirmModal {...defaultProps} />);
    rerender(<ConfirmModal {...defaultProps} isOpen={false} />);

    const confirmBtn = screen.getByRole('button', { name: '确认' });
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('unmounts after closing animation completes', () => {
    const { rerender } = renderWithTheme(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    rerender(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('cancels close timer when reopened quickly', () => {
    const { rerender } = renderWithTheme(<ConfirmModal {...defaultProps} />);

    rerender(<ConfirmModal {...defaultProps} isOpen={false} />);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender(<ConfirmModal {...defaultProps} isOpen={true} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});

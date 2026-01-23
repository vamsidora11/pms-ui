import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from '@components/common/Toast/ToastProvider';
import { useToast } from '@components/common/Toast/useToast';

function TestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => toast.error('Error', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => toast.warning('Warning', 'Warning message')}>
        Show Warning
      </button>
      <button onClick={() => toast.info('Info', 'Info message')}>
        Show Info
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders children correctly', () => {
    render(
      <ToastProvider>
        <div>Test Content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      /useToast must be used within ToastProvider/
    );
    consoleError.mockRestore();
  });

  it('shows success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();

    expect(await screen.findByText('Success')).toBeInTheDocument();
    expect(await screen.findByText('Success message')).toBeInTheDocument();
  });

  it('shows multiple toasts simultaneously', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();
    screen.getByText('Show Error').click();
    screen.getByText('Show Warning').click();

    expect(await screen.findByText('Success')).toBeInTheDocument();
    expect(await screen.findByText('Error')).toBeInTheDocument();
    expect(await screen.findByText('Warning')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();
    await screen.findByText('Success');

    screen.getByLabelText('Close toast').click();

    await waitFor(() =>
      expect(screen.queryByText('Success')).not.toBeInTheDocument()
    );
  });
});

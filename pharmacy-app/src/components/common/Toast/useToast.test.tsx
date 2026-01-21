import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from '@components/common/Toast/ToastProvider';
import { useToast } from '@components/common/Toast/useToast';

describe('useToast', () => {
  it('throws error when used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow(/useToast must be used within ToastProvider/);

    consoleError.mockRestore();
  });

  it('returns toast methods when used inside provider', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(result.current).toMatchObject({
      success: expect.any(Function),
      error: expect.any(Function),
      warning: expect.any(Function),
      info: expect.any(Function),
      showToast: expect.any(Function),
    });
  });
});

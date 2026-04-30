type ToastFn = (title: string, message?: string) => void;

interface ToastApi {
  success: ToastFn;
  error: ToastFn;
  warning: ToastFn;
  info: ToastFn;
}

let toastApi: ToastApi | null = null;

export function registerToastApi(api: ToastApi): void {
  toastApi = api;
}

export function unregisterToastApi(): void {
  toastApi = null;
}

function safeInvoke(
  fn: ToastFn | undefined,
  fallbackPrefix: string,
  title: string,
  message?: string
): void {
  if (fn) {
    fn(title, message);
    return;
  }
  console.error(`${fallbackPrefix}: ${title}${message ? ` - ${message}` : ""}`);
}

export const toast = {
  success: (title: string, message?: string): void =>
    safeInvoke(toastApi?.success, "toast:success", title, message),
  error: (title: string, message?: string): void =>
    safeInvoke(toastApi?.error, "toast:error", title, message),
  warning: (title: string, message?: string): void =>
    safeInvoke(toastApi?.warning, "toast:warning", title, message),
  info: (title: string, message?: string): void =>
    safeInvoke(toastApi?.info, "toast:info", title, message),
};

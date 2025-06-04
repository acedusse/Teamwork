export function success(data) {
  return { success: true, data };
}

export function error(code, message) {
  return { success: false, error: { code, message } };
}

/** Only allow same-origin relative paths as post-login redirects (prevents open redirects). */
export function safeRedirect(target: string | null | undefined, fallback = "/") {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\"))
    return fallback;
  return target;
}

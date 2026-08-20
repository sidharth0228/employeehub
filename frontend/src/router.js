import { isLoggedIn } from './api.js';

const routes = {};
let currentCleanup = null;

export function register(path, handler) {
  routes[path] = handler;
}

export function navigate(path, replace = false) {
  if (replace) {
    history.replaceState({}, '', path);
  } else {
    history.pushState({}, '', path);
  }
  handleRoute(path);
}

async function handleRoute(path) {
  // Auth guard
  if (path !== '/' && !isLoggedIn()) {
    navigate('/', true);
    return;
  }
  if (path === '/' && isLoggedIn()) {
    navigate('/dashboard', true);
    return;
  }

  // Cleanup previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch(e) {}
    currentCleanup = null;
  }

  // Find matching route (support dynamic segments like /employees/:id)
  let handler = routes[path];
  let params = {};

  if (!handler) {
    // Try dynamic routes
    for (const [pattern, fn] of Object.entries(routes)) {
      const paramNames = [];
      const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      const regex = new RegExp(`^${regexStr}$`);
      const match = path.match(regex);
      if (match) {
        handler = fn;
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        break;
      }
    }
  }

  if (!handler) {
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif">
        <div style="text-align:center">
          <h1 style="font-size:48px;font-weight:700;color:#004ac6">404</h1>
          <p style="color:#505f76;margin-bottom:16px">Page not found: ${path}</p>
          <a href="/dashboard" onclick="event.preventDefault();window.history.back()" style="color:#004ac6">← Go back</a>
        </div>
      </div>
    `;
    return;
  }

  const cleanup = await handler(params);
  if (typeof cleanup === 'function') currentCleanup = cleanup;
}

export function initRouter() {
  // Handle browser back/forward
  window.addEventListener('popstate', () => handleRoute(window.location.pathname));

  // Handle initial load
  handleRoute(window.location.pathname);
}

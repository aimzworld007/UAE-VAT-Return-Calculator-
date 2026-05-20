import React from 'react';

export function usePathname() {
  const normalizePathname = React.useCallback((value) => {
    if (!value) return '/';
    const trimmed = value.replace(/\/+$/, '');
    return trimmed || '/';
  }, []);

  const [pathname, setPathname] = React.useState(() => normalizePathname(window.location.pathname));

  React.useEffect(() => {
    const onPopState = () => setPathname(normalizePathname(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [normalizePathname]);

  const navigate = React.useCallback((to) => {
    const target = new URL(to, window.location.origin);
    const targetPath = normalizePathname(target.pathname);
    const currentPath = normalizePathname(window.location.pathname);
    if (currentPath === targetPath && window.location.search === target.search) return;
    window.history.pushState({}, '', `${targetPath}${target.search}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [normalizePathname]);

  return { pathname, navigate };
}

export function RouteLink({ to, className = '', children, onClick }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (onClick) onClick(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        const target = new URL(to, window.location.origin);
        const path = normalizePathname(target.pathname);
        window.history.pushState({}, '', `${path}${target.search}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      {children}
    </a>
  );
}

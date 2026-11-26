/** lib/router — tiny hash router (two pages don't justify a dependency). */
import { useEffect, useState } from 'react';

const current = () => location.hash.replace(/^#\/?/, '') || 'record';

export function useRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const navigate = (route) => {
  location.hash = `/${route}`;
};

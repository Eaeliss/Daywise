import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { usePreferencesStore } from '@/stores/preferences-store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const preference = usePreferencesStore((s) => s.colorScheme);
  const systemScheme = useRNColorScheme();

  if (!hasHydrated) {
    return 'light';
  }

  if (preference === 'system') {
    return systemScheme ?? 'light';
  }

  return preference;
}

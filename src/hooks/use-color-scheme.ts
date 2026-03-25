import { useColorScheme as useRNColorScheme } from 'react-native';
import { usePreferencesStore } from '@/stores/preferences-store';

export function useColorScheme() {
  const preference = usePreferencesStore((s) => s.colorScheme);
  const systemScheme = useRNColorScheme();

  if (preference === 'system') {
    return systemScheme ?? 'light';
  }

  return preference;
}

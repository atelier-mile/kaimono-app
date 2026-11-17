import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { InventoryProvider } from '@/features/inventory/inventory-context';
import { AppearanceProvider } from '@/features/appearance/appearance-context';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AppearanceProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <InventoryProvider>
        <AppTabs />
      </InventoryProvider>
    </ThemeProvider>
    </AppearanceProvider>
  );
}

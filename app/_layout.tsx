import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SavedProblemsProvider } from '@/store/savedProblems';

export default function RootLayout() {
  return (
    <SavedProblemsProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SavedProblemsProvider>
  );
}

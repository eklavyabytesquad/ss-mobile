import { registerRootComponent } from 'expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from './hooks/use-color-scheme';
import TabLayout from './pages/_layout';
import ModalScreen from './pages/modal';

const Stack = createNativeStackNavigator();

function App() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={TabLayout} options={{ headerShown: false }} />
          <Stack.Screen name="modal" component={ModalScreen} options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

registerRootComponent(App);

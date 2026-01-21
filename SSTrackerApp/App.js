import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { NavigationManager } from './navigation/NavigationManager';

function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationManager />
    </>
  );
}

registerRootComponent(App);

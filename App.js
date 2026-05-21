import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/index';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

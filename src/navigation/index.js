import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="UserApp" component={UserTabs} />
      <Stack.Screen name="AdminApp" component={AdminTabs} />
    </Stack.Navigator>
  );
}

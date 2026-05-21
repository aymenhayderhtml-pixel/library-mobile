import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import BooksScreen from '../screens/user/BooksScreen';
import BorrowedScreen from '../screens/user/BorrowedScreen';
import UserHistoryScreen from '../screens/user/UserHistoryScreen';
import BookDetailScreen from '../screens/user/BookDetailScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminBooksScreen from '../screens/admin/AdminBooksScreen';
import AdminFinesScreen from '../screens/admin/AdminFinesScreen';
import AdminHistoryScreen from '../screens/admin/AdminHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'home-outline',
            Books: 'book-outline',
            Borrowed: 'library-outline',
            History: 'time-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={UserDashboardScreen} />
      <Tab.Screen name="Books" component={BooksScreen} />
      <Tab.Screen name="Borrowed" component={BorrowedScreen} />
      <Tab.Screen name="History" component={UserHistoryScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            AdminDashboard: 'grid-outline',
            Users: 'people-outline',
            AdminBooks: 'book-outline',
            Fines: 'cash-outline',
            History: 'time-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="AdminBooks" component={AdminBooksScreen} options={{ title: 'Books' }} />
      <Tab.Screen name="Fines" component={AdminFinesScreen} />
      <Tab.Screen name="History" component={AdminHistoryScreen} options={{ title: 'Borrows' }} />
    </Tab.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={UserTabs} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="UserApp" component={UserStack} />
      <Stack.Screen name="AdminApp" component={AdminTabs} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminBooksScreen from '../screens/admin/AdminBooksScreen';
import AdminFinesScreen from '../screens/admin/AdminFinesScreen';
import AdminHistoryScreen from '../screens/admin/AdminHistoryScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'AdminDashboard') icon = 'grid-outline';
          else if (route.name === 'Users') icon = 'people-outline';
          else if (route.name === 'AdminBooks') icon = 'book-outline';
          else if (route.name === 'Fines') icon = 'cash-outline';
          else if (route.name === 'History') icon = 'time-outline';
          return <Ionicons name={icon} size={size} color={color} />;
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

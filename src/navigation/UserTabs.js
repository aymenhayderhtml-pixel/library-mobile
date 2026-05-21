import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import BooksScreen from '../screens/user/BooksScreen';
import BorrowedScreen from '../screens/user/BorrowedScreen';
import UserHistoryScreen from '../screens/user/UserHistoryScreen';
import BookDetailScreen from '../screens/user/BookDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size }) => {
          let icon;
          if (route.name === 'Dashboard') icon = 'home-outline';
          else if (route.name === 'Books') icon = 'book-outline';
          else if (route.name === 'Borrowed') icon = 'library-outline';
          else if (route.name === 'History') icon = 'time-outline';
          return <Ionicons name={icon} size={size} color={color} />;
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

export default function UserTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
    </Stack.Navigator>
  );
}

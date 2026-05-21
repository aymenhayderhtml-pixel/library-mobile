import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../data/api';
import { setStore } from '../../data/store';
import { validateEmail } from '../../data/validate';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!validateEmail(email)) return Alert.alert('Error', 'Enter a valid email address');
    if (!password) return Alert.alert('Error', 'Enter your password');
    try {
      setLoading(true);
      const data = await authAPI.login(email, password);
      
      if (data.user.role !== 'admin') {
        Alert.alert('Access Denied', 'This portal is for administrators only.');
        return;
      }
      
      setStore(data.token, data.user);
      navigation.replace('AdminApp');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Admin Portal</Text>
        <Text style={styles.subtitle}>Sign in to manage the library</Text>

        <TextInput
          style={styles.input}
          placeholder="Admin Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login as Admin</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.userButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.userButtonText}>Go to User Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#e63946', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#1a1a2e',
  },
  button: {
    backgroundColor: '#e63946',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  userButtonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '600' },
});

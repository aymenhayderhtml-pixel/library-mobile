import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../data/api';
import { setStore } from '../../data/store';
import { validateEmail } from '../../data/validate';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!validateEmail(email)) return Alert.alert('Error', 'Enter a valid email address');
    if (!password) return Alert.alert('Error', 'Enter your password');
    try {
      setLoading(true);
      const data = await authAPI.login(email, password);
      setStore(data.token, data.user);
      if (data.user.role === 'admin') {
        Alert.alert('Admin Account', 'Please use the Admin Login portal.');
      } else {
        navigation.replace('UserApp');
      }
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
        <Text style={styles.title}>Library App</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.adminButtonText}>Admin Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
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
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#1a1a2e', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  adminButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e63946',
  },
  adminButtonText: { color: '#e63946', fontSize: 16, fontWeight: '600' },
});

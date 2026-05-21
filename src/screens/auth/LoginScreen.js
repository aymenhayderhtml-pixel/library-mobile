import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { authAPI, setStore, validateEmail } from '../../data/api';

export default function LoginScreen({ navigation, route }) {
  const isAdmin = route?.params?.admin === true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: add remember me maybe later
  async function handleLogin() {
    if (!validateEmail(email)) return Alert.alert('Error', 'Enter a valid email');
    if (!password) return Alert.alert('Error', 'Password is required');
    try {
      setLoading(true);
      const data = await authAPI.login(email, password);
      if (isAdmin && data.user.role !== 'admin') {
        Alert.alert('Access Denied', 'This portal is for administrators only.');
        return;
      }
      if (!isAdmin && data.user.role === 'admin') {
        Alert.alert('Admin Account', 'Please use the Admin Login portal.');
        return;
      }
      setStore(data.token, data.user);
      navigation.replace(isAdmin ? 'AdminApp' : 'UserApp');
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
        <Text style={[styles.title, isAdmin && { color: '#e63946' }]}>
          {isAdmin ? 'Admin Portal' : 'Library App'}
        </Text>
        <Text style={styles.subtitle}>
          {isAdmin ? 'Sign in to manage the library' : 'Sign in to continue'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={isAdmin ? 'Admin Email' : 'Email'}
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

        <TouchableOpacity
          style={[styles.button, isAdmin && { backgroundColor: '#e63946' }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{isAdmin ? 'Login as Admin' : 'Login'}</Text>
          }
        </TouchableOpacity>

        {isAdmin ? (
          <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchBtnText}>Go to User Login</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { admin: true })} style={{ marginTop: 12 }}>
              <Text style={[styles.link, { color: '#999', fontSize: 13 }]}>Admin login</Text>
            </TouchableOpacity>
          </>
        )}
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
  link: { color: '#1a1a2e', textAlign: 'center', fontSize: 14 },
  switchBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  switchBtnText: { color: '#1a1a2e', fontSize: 16, fontWeight: '600' },
});

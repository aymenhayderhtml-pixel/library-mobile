import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { usersAPI } from '../../data/api';
import { getStore, clearStore } from '../../data/store';

export default function UserDashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ active: 0, overdue: 0, totalFine: 0 });
  const [loading, setLoading] = useState(true);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { user } = getStore();
  const displayName = (user?.name || '').replace(/\s*updated\s*/gi, '').trim() || 'User';

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  async function fetchStats() {
    try {
      const { token } = getStore();
      const data = await usersAPI.getStats(token);
      setStats(data);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStore();
    navigation.replace('Login');
  }

  async function handlePasswordChange() {
    if (!currentPassword || newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters');
    }
    try {
      const { token } = getStore();
      await usersAPI.changePassword(token, currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setPwdModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
          <Text style={styles.subtitle}>Welcome to the library</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#1a1a2e' }]}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Borrows</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e63946' }]}>
            <Text style={styles.statNumber}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#2d6a4f' }]}>
            <Text style={styles.statNumber}>{stats.totalFine}</Text>
            <Text style={styles.statLabel}>Fine (Birr)</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Books')}>
          <Text style={styles.actionText}>Browse Books</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Borrowed')}>
          <Text style={styles.actionText}>My Borrowed Books</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setPwdModalVisible(true)}>
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={pwdModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput style={styles.input} placeholder="Current Password" placeholderTextColor="#999" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="#999" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <TouchableOpacity style={styles.saveBtn} onPress={handlePasswordChange}>
              <Text style={styles.saveBtnText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPwdModalVisible(false); setCurrentPassword(''); setNewPassword(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 24, paddingTop: 60, paddingBottom: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  greeting: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa' },
  logoutBtn: {
    backgroundColor: '#e63946', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#fff', opacity: 0.8, marginTop: 4, textAlign: 'center' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  actionButton: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0',
  },
  actionText: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 20 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 15,
    marginBottom: 12, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e0e0',
  },
  saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { color: '#999', fontSize: 14 },
});

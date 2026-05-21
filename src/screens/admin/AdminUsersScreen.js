import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Platform,
} from 'react-native';
import { usersAPI } from '../../data/api';
import { getStore } from '../../data/store';
import { validateEmail, validatePassword, validateName } from '../../data/validate';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchUsers(); }, [search, sortBy])
  );

  async function fetchUsers() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await usersAPI.getAll(token, search);
      const list = Array.isArray(data) ? data : [];
      const sorted = [...list].sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        // name A-Z (default)
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });
      setUsers(sorted);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingUser(null);
    setName(''); setEmail(''); setPassword('');
    setErrorMsg('');
    setModalVisible(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setName(user.name); setEmail(user.email); setPassword('');
    setErrorMsg('');
    setModalVisible(true);
  }

  async function handleSave() {
    setErrorMsg('');
    if (!validateName(name)) return setErrorMsg('Name must be at least 2 characters.');
    if (!validateEmail(email)) return setErrorMsg('Enter a valid email address.');
    if ((!editingUser || password) && !validatePassword(password))
      return setErrorMsg('Password must be at least 6 characters.');
    try {
      setSaving(true);
      const { token } = getStore();
      if (editingUser) {
        await usersAPI.update(token, editingUser._id, { name, email, password });
      } else {
        await usersAPI.add(token, { name, email, password });
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this user?')
      : await new Promise(resolve =>
          require('react-native').Alert.alert('Delete User', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    try {
      const { token } = getStore();
      await usersAPI.delete(token, id);
      fetchUsers();
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + err.message);
      } else {
        require('react-native').Alert.alert('Error', err.message);
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Users</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {['name', 'newest'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
              onPress={() => setSortBy(s)}
            >
              <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
                {s === 'name' ? 'A–Z' : 'Newest'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={users}
          keyExtractor={item => String(item._id || item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add User'}</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={name} onChangeText={v => { setName(v); setErrorMsg(''); }} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={v => { setEmail(v); setErrorMsg(''); }} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder={editingUser ? "Password (leave blank to keep current)" : "Password"} placeholderTextColor="#999" value={password} onChangeText={v => { setPassword(v); setErrorMsg(''); }} secureTextEntry />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60, paddingBottom: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#e63946', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e',
    marginBottom: 12,
  },
  sortRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  sortLabel: { fontSize: 13, color: '#aaa', marginRight: 4 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 8,
  },
  sortChipActive: { backgroundColor: '#fff' },
  sortText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  sortTextActive: { color: '#1a1a2e' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  userEmail: { fontSize: 12, color: '#999', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#e8f4fd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#1a6ab1', fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: '#ffe5e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#e63946', fontWeight: '600', fontSize: 13 },
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
  errorText: { color: '#e63946', fontSize: 13, marginBottom: 10, textAlign: 'center' },
});

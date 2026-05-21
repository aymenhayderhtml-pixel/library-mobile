import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usersAPI, borrowsAPI } from '../../data/api';
import { getStore, clearStore } from '../../data/store';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  async function fetchData() {
    try {
      const { token } = getStore();
      const [statsData, borrowsData] = await Promise.all([
        usersAPI.getAdminStats(token),
        borrowsAPI.getAll(token, 'overdue'),
      ]);
      setStats(statsData);
      const unique = {};
      borrowsData.forEach(b => {
        if (b.userId && !unique[b.userId._id]) {
          unique[b.userId._id] = {
            name: b.userId.name,
            email: b.userId.email,
            fine: b.fine,
          };
        } else if (b.userId && unique[b.userId._id]) {
          unique[b.userId._id].fine += b.fine;
        }
      });
      setOverdueUsers(Object.values(unique));
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Library overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard label="Total Users" value={stats?.totalUsers} color="#1a1a2e" />
            <StatCard label="Total Books" value={stats?.totalBooks} color="#1a6ab1" />
            <StatCard label="Borrowed" value={stats?.borrowedBooks} color="#2d6a4f" />
            <StatCard label="Overdue" value={stats?.overdueBooks} color="#e63946" />
            <StatCard label="Fines (Birr)" value={stats?.collectedFines} color="#e07c24" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overdue Users</Text>
            {overdueUsers.length === 0 ? (
              <Text style={styles.emptyText}>No overdue users</Text>
            ) : (
              overdueUsers.map((u, i) => (
                <View key={i} style={styles.userCard}>
                  <View>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  <Text style={styles.userFine}>{u.fine} Birr</Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60, paddingBottom: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa' },
  logoutBtn: { backgroundColor: '#e63946', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: '#fff', opacity: 0.85, marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999' },
  userCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e0e0e0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  userName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  userEmail: { fontSize: 12, color: '#999', marginTop: 2 },
  userFine: { fontSize: 15, fontWeight: '700', color: '#e63946' },
});

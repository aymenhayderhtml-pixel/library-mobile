import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { borrowsAPI, getStore } from '../../data/api';

export default function AdminFinesScreen() {
  const [borrows, setBorrows] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBorrows();
  }, []);

  async function fetchBorrows() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await borrowsAPI.getAll(token);
      const withFines = data.filter(b => b.fine > 0);
      setBorrows(withFines);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action, id) {
    if (String(id).startsWith('sample-')) {
      Alert.alert('Sample Record', 'This is demo data and cannot be modified.');
      return;
    }
    try {
      const { token } = getStore();
      if (action === 'pay') await borrowsAPI.payFine(token, id);
      if (action === 'waive') await borrowsAPI.waiveFine(token, id);
      fetchBorrows();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  function daysLate(dueDate) {
    const diff = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  const filteredBorrows = borrows.filter(item => {
    if (filter === 'All') return true;
    const status = item.fineStatus || 'unpaid';
    return status.toLowerCase() === filter.toLowerCase();
  });

  const sortedBorrows = [...filteredBorrows].sort((a, b) => {
    if (sortBy === 'fine') return b.fine - a.fine;
    // newest (default)
    const aDate = new Date(a.createdAt || a.borrowDate || 0).getTime();
    const bDate = new Date(b.createdAt || b.borrowDate || 0).getTime();
    return bDate - aDate;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fine Management</Text>
        <Text style={styles.subtitle}>Borrow history & fines</Text>
      </View>

      <View style={styles.filterRow}>
        {['All', 'Unpaid', 'Paid', 'Waived'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {[
          { key: 'fine', label: 'Highest Fine' },
          { key: 'newest', label: 'Newest' },
        ].map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
            onPress={() => setSortBy(s.key)}
          >
            <Text style={[styles.sortText, sortBy === s.key && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : sortedBorrows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No records found</Text>
        </View>
      ) : (
        <FlatList
          data={sortedBorrows}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isOverdue = item.status === 'overdue';
            const fineStatus = item.fineStatus || 'unpaid';
            let badgeBg = '#ffe5e5';
            let badgeText = '#e63946';
            if (fineStatus === 'paid') {
              badgeBg = '#d8f3dc';
              badgeText = '#2d6a4f';
            } else if (fineStatus === 'waived') {
              badgeBg = '#e8f4fd';
              badgeText = '#1a6ab1';
            }

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.userName}>{item.userId?.name}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={{ color: badgeText }}>
                      {fineStatus.toUpperCase()}
                    </Text>
                  </Text>
                </View>

                <Text style={styles.bookTitle}>{item.bookId?.title}</Text>

                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>Borrow Date</Text>
                    <Text style={styles.detailValue}>{new Date(item.borrowDate).toLocaleDateString()}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Days Late</Text>
                    <Text style={[styles.detailValue, isOverdue && { color: '#e63946' }]}>
                      {isOverdue ? daysLate(item.dueDate) : '-'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fineRow}>
                  <Text style={styles.fineLabel}>Total Fine</Text>
                  <Text style={styles.fineValue}>{item.fine} Birr</Text>
                </View>

                {fineStatus === 'unpaid' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={() => handleAction('pay', item._id)}>
                      <Text style={styles.actionBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.waiveBtn]} onPress={() => handleAction('waive', item._id)}>
                      <Text style={styles.actionBtnText}>Waive</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa' },
  filterRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 10, flexWrap: 'wrap' },
  sortRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  sortLabel: { fontSize: 13, color: '#666', marginRight: 4 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0',
  },
  sortChipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  sortText: { fontSize: 13, color: '#666', fontWeight: '600' },
  sortTextActive: { color: '#fff' },
  filterChip: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0',
  },
  filterChipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  userName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  statusBadge: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  bookTitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  fineRow: {
    backgroundColor: '#ffe5e5', borderRadius: 8, padding: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  fineValue: { fontSize: 16, fontWeight: '700', color: '#e63946' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  payBtn: { backgroundColor: '#2d6a4f' },
  waiveBtn: { backgroundColor: '#1a6ab1' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

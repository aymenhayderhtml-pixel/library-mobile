import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { borrowsAPI } from '../../data/api';
import { getStore } from '../../data/store';

export default function BorrowedScreen() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBorrows();
    }, [])
  );

  async function fetchBorrows() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await borrowsAPI.getMine(token);
      setBorrows(data.filter(b => b.status !== 'returned'));
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Borrowed Books</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : borrows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No borrowed books</Text>
        </View>
      ) : (
        <FlatList
          data={borrows}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            let badgeBg = '#e8f4fd';
            let badgeText = '#1a6ab1';
            if (item.status === 'overdue' || item.status === 'rejected') {
              badgeBg = '#ffe5e5';
              badgeText = '#e63946';
            } else if (item.status === 'active') {
              badgeBg = '#d8f3dc';
              badgeText = '#2d6a4f';
            } else if (item.status === 'pending') {
              badgeBg = '#fef0d9';
              badgeText = '#d97706';
            }

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bookTitle}>{item.bookId?.title}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={{ color: badgeText }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </Text>
                </View>

                <View style={styles.dateRow}>
                  <View>
                    <Text style={styles.dateLabel}>Requested</Text>
                    <Text style={styles.dateValue}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {item.dueDate && (
                    <View>
                      <Text style={styles.dateLabel}>Due Date</Text>
                      <Text style={styles.dateValue}>
                        {new Date(item.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {item.status === 'overdue' && (
                  <View style={styles.fineRow}>
                    <Text style={styles.fineText}>Fine: {item.fine} Birr</Text>
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
  header: {
    backgroundColor: '#1a1a2e',
    padding: 24, paddingTop: 60, paddingBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  statusBadge: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  fineRow: {
    backgroundColor: '#ffe5e5', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  fineText: { fontSize: 14, fontWeight: '600', color: '#e63946' },
});

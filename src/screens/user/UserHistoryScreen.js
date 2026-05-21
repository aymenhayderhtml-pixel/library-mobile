import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { borrowsAPI } from '../../data/api';
import { getStore } from '../../data/store';

export default function UserHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  async function fetchHistory() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await borrowsAPI.getMine(token);
      setHistory(data.filter(b => b.status === 'returned'));
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reading History</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No reading history found.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bookTitle}>{item.bookId?.title}</Text>
                <Text style={styles.statusBadge}>Returned</Text>
              </View>

              <View style={styles.dateRow}>
                <View>
                  <Text style={styles.dateLabel}>Borrowed</Text>
                  <Text style={styles.dateValue}>
                    {new Date(item.borrowDate).toLocaleDateString()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.dateLabel}>Returned</Text>
                  <Text style={styles.dateValue}>
                    {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              {item.fine > 0 && (
                <View style={styles.fineRow}>
                  <Text style={styles.fineText}>Paid Fine: {item.fine} Birr</Text>
                </View>
              )}
            </View>
          )}
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
  statusBadge: { 
    fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 6, backgroundColor: '#f0f0f0', color: '#666'
  },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  fineRow: {
    backgroundColor: '#fff0f0', borderRadius: 8,
    padding: 10, marginTop: 4,
  },
  fineText: { fontSize: 14, fontWeight: '600', color: '#e63946' },
});

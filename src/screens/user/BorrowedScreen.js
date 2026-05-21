import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { borrowsAPI, getStore } from '../../data/api';

const STATUS_CONFIG = {
  pending:          { label: 'Pending Approval', bg: '#fef0d9', text: '#d97706' },
  active:           { label: 'Active',           bg: '#d8f3dc', text: '#2d6a4f' },
  overdue:          { label: 'Overdue',          bg: '#ffe5e5', text: '#e63946' },
  return_requested: { label: 'Return Pending',   bg: '#e8f4fd', text: '#1a6ab1' },
};

export default function BorrowedScreen() {
  const [borrows, setBorrows]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionId, setActionId]       = useState(null);   // id being returned right now
  const [confirmId, setConfirmId]     = useState(null);   // id waiting for inline confirm

  useEffect(() => {
    fetchBorrows();
  }, []);

  async function fetchBorrows() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await borrowsAPI.getMine(token);
      const list = Array.isArray(data) ? data : [];
      setBorrows(list.filter(b => b.status !== 'returned' && b.status !== 'rejected'));
    } catch (err) {
      console.log('[BorrowedScreen] fetch error:', err.message);
      Alert.alert('Error', 'Could not load borrows. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function doReturn(id) {
    try {
      setConfirmId(null);
      setActionId(id);
      const { token } = getStore();
      await borrowsAPI.requestReturn(token, id);
      // Update status locally — no full reload needed
      setBorrows(prev =>
        prev.map(b => String(b._id) === String(id)
          ? { ...b, status: 'return_requested' }
          : b
        )
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to request return. Try again.');
    } finally {
      setActionId(null);
    }
  }

  function renderItem({ item }) {
    const id       = String(item._id);
    const cfg      = STATUS_CONFIG[item.status] || { label: item.status, bg: '#f0f0f0', text: '#666' };
    const isActing = actionId === id;
    const isConfirming = confirmId === id;

    return (
      <View style={styles.card}>
        {/* Title + badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.bookId?.title || 'Unknown Book'}
          </Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Author */}
        {item.bookId?.author ? (
          <Text style={styles.author}>by {item.bookId.author}</Text>
        ) : null}

        {/* Dates */}
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateLabel}>Requested</Text>
            <Text style={styles.dateValue}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {item.dueDate ? (
            <View>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={[styles.dateValue, item.status === 'overdue' && { color: '#e63946' }]}>
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Status notes */}
        {item.status === 'overdue' ? (
          <View style={styles.fineRow}>
            <Text style={styles.fineText}>⚠️  Overdue — please return immediately</Text>
          </View>
        ) : null}

        {item.status === 'return_requested' ? (
          <View style={styles.successNote}>
            <Text style={styles.successNoteText}>
              ✓ Return requested — bring the book to the library desk.
            </Text>
          </View>
        ) : null}

        {item.status === 'pending' ? (
          <Text style={styles.infoNote}>⏳ Awaiting librarian approval.</Text>
        ) : null}

        {/* ── Return flow ── */}
        {(item.status === 'active' || item.status === 'overdue') ? (
          isActing ? (
            /* Spinner while API call is in flight */
            <View style={styles.returningRow}>
              <ActivityIndicator color="#1a1a2e" size="small" />
              <Text style={styles.returningText}>Requesting return…</Text>
            </View>
          ) : isConfirming ? (
            /* Inline confirmation — avoids Alert.alert issues on some devices */
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Hand in this book at the library? The librarian will confirm receipt.
              </Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setConfirmId(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => doReturn(id)}
                >
                  <Text style={styles.confirmBtnText}>Yes, Return It</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Normal "Return Book" button */
            <TouchableOpacity
              style={styles.returnBtn}
              onPress={() => setConfirmId(id)}
              activeOpacity={0.75}
            >
              <Text style={styles.returnBtnText}>Return Book</Text>
            </TouchableOpacity>
          )
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Borrowed Books</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#1a1a2e" size="large" />
      ) : borrows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No active borrows</Text>
          <Text style={styles.emptySubtext}>Books you borrow will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={borrows}
          keyExtractor={item => String(item._id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          /* extraData ensures items re-render when actionId/confirmId change */
          extraData={{ actionId, confirmId }}
          onRefresh={fetchBorrows}
          refreshing={loading}
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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#999' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#e8e8e8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 4,
  },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 8 },
  author:    { fontSize: 13, color: '#888', marginBottom: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 12, paddingTop: 4,
  },
  dateLabel: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },

  fineRow: {
    backgroundColor: '#ffe5e5', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  fineText: { fontSize: 13, fontWeight: '600', color: '#e63946' },

  successNote: {
    backgroundColor: '#e8f4fd', borderRadius: 8,
    padding: 10, marginBottom: 4,
  },
  successNoteText: { fontSize: 13, color: '#1a6ab1', fontWeight: '500' },

  infoNote: { fontSize: 13, color: '#999', marginBottom: 4, fontStyle: 'italic' },

  returnBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 10,
  },
  returnBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  returningRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, marginTop: 8,
    backgroundColor: '#f5f5f5', borderRadius: 10,
  },
  returningText: { marginLeft: 10, color: '#666', fontSize: 14 },

  /* Inline confirmation box */
  confirmBox: {
    backgroundColor: '#f0f7ff', borderRadius: 10,
    padding: 14, marginTop: 10,
    borderWidth: 1, borderColor: '#bcd4ed',
  },
  confirmText: {
    fontSize: 13, color: '#1a1a2e', marginBottom: 12, lineHeight: 19,
  },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#666', fontWeight: '600', fontSize: 13 },
  confirmBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#1a1a2e', alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

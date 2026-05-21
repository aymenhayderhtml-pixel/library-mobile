import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView, Modal
} from 'react-native';
import { borrowsAPI } from '../../data/api';
import { getStore } from '../../data/store';

export default function AdminHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [durationDays, setDurationDays] = useState('14');
  const [fineRate, setFineRate] = useState('10');

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  async function fetchHistory() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await borrowsAPI.getAll(token);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action, id) {
    try {
      const { token } = getStore();
      if (action === 'approve') {
        setSelectedBorrowId(id);
        setDurationDays('14');
        setFineRate('10');
        setApproveModalVisible(true);
        return;
      }
      if (action === 'reject') await borrowsAPI.reject(token, id);
      if (action === 'return') await borrowsAPI.confirmReturn(token, id);
      fetchHistory();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function confirmApprove() {
    try {
      const { token } = getStore();
      await borrowsAPI.approve(token, selectedBorrowId, { 
        durationDays: Number(durationDays), 
        fineRate: Number(fineRate) 
      });
      setApproveModalVisible(false);
      fetchHistory();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  const filterStatus = filter === 'Return Requested' ? 'return_requested' : filter.toLowerCase();

  const filteredHistory = (Array.isArray(history) ? history : []).filter(item => {
    if (filter !== 'All' && (item.status || '').toLowerCase() !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = item.userId?.name?.toLowerCase() || '';
      const bookTitle = item.bookId?.title?.toLowerCase() || '';
      if (!userName.includes(query) && !bookTitle.includes(query)) return false;
    }
    return true;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const aDate = new Date(a.createdAt || a.borrowDate || 0).getTime();
    const bDate = new Date(b.createdAt || b.borrowDate || 0).getTime();
    return sortBy === 'oldest' ? aDate - bDate : bDate - aDate;
  });

  const statuses = ['All', 'Pending', 'Active', 'Overdue', 'Return Requested', 'Returned', 'Rejected'];
  const sortOptions = [
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Borrows</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by user or book title..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {statuses.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.filterChip, filter === s && styles.filterChipActive]}
              onPress={() => setFilter(s)}
            >
              <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {sortOptions.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
              onPress={() => setSortBy(s.key)}
            >
              <Text style={[styles.sortText, sortBy === s.key && styles.sortTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : sortedHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching records found.</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={sortedHistory}
          keyExtractor={item => String(item._id || item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bookTitle}>{item.bookId?.title}</Text>
                <Text style={[
                  styles.statusBadge,
                  item.status === 'returned' ? styles.statusReturned :
                  item.status === 'active' ? styles.statusActive :
                  item.status === 'overdue' ? styles.statusOverdue :
                  item.status === 'return_requested' ? styles.statusReturnRequested :
                  item.status === 'rejected' ? styles.statusOverdue : styles.statusPending
                ]}>
                  {item.status === 'return_requested' ? 'RETURN REQ.' : (item.status || 'unknown').toUpperCase()}
                </Text>
              </View>

              <Text style={styles.userName}>Borrowed by: {item.userId?.name}</Text>

              <View style={styles.dateRow}>
                <View>
                  <Text style={styles.dateLabel}>Requested On</Text>
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
                {item.fineRate && item.status !== 'pending' && (
                  <View>
                    <Text style={styles.dateLabel}>Fine Rate</Text>
                    <Text style={styles.dateValue}>{item.fineRate} Birr/day</Text>
                  </View>
                )}
              </View>

              {item.status === 'returned' && (
                <View style={styles.dateRow}>
                  <View>
                    <Text style={styles.dateLabel}>Returned On</Text>
                    <Text style={styles.dateValue}>
                      {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.dateLabel}>Fine Paid</Text>
                    <Text style={[styles.dateValue, { color: item.fine > 0 ? '#e63946' : '#2d6a4f' }]}>
                      {item.fine} Birr
                    </Text>
                  </View>
                </View>
              )}
              {item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction('approve', item._id)}>
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction('reject', item._id)}>
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'return_requested' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.returnBtn]} onPress={() => handleAction('return', item._id)}>
                    <Text style={styles.actionBtnText}>Confirm Return</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={approveModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Request</Text>
            
            <Text style={styles.inputLabel}>Loan Duration (Days)</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="number-pad"
              value={durationDays} 
              onChangeText={setDurationDays} 
            />
            
            <Text style={styles.inputLabel}>Fine Rate (Birr/Day)</Text>
            <TextInput 
              style={styles.modalInput} 
              keyboardType="number-pad"
              value={fineRate} 
              onChangeText={setFineRate} 
            />
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn, { marginRight: 10 }]} onPress={() => setApproveModalVisible(false)}>
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={confirmApprove}>
                <Text style={styles.actionBtnText}>Confirm Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 15,
    marginBottom: 16, color: '#1a1a2e'
  },
  filterRow: { marginBottom: 8 },
  filterRowContent: { flexDirection: 'row', alignItems: 'center' },
  sortRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  sortLabel: { fontSize: 13, color: '#aaa', marginRight: 8 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 8,
  },
  sortChipActive: { backgroundColor: '#fff' },
  sortText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  sortTextActive: { color: '#1a1a2e' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 10,
  },
  filterChipActive: { backgroundColor: '#fff' },
  filterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#1a1a2e' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', flex: 1, marginRight: 8 },
  statusBadge: { 
    fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, fontWeight: 'bold'
  },
  statusReturned: { backgroundColor: '#e8f4fd', color: '#1a6ab1' },
  statusActive: { backgroundColor: '#d8f3dc', color: '#2d6a4f' },
  statusOverdue: { backgroundColor: '#ffe5e5', color: '#e63946' },
  statusPending: { backgroundColor: '#fef0d9', color: '#d97706' },
  statusReturnRequested: { backgroundColor: '#e8f4fd', color: '#1a6ab1' },
  userName: { fontSize: 14, color: '#666', marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#1a1a2e' },
  rejectBtn: { backgroundColor: '#e63946' },
  returnBtn: { backgroundColor: '#1a1a2e' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  modalInput: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 15,
    marginBottom: 16, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e0e0',
  },
  modalActionRow: { flexDirection: 'row', marginTop: 10 },
});

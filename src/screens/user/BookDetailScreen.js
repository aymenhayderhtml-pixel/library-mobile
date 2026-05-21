import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { booksAPI, borrowsAPI } from '../../data/api';
import { getStore } from '../../data/store';

export default function BookDetailScreen({ route, navigation }) {
  const initialBook = route.params?.book;
  const bookId = String(initialBook?._id || initialBook?.id || '');

  const [book, setBook]               = useState(initialBook);
  const [pageLoading, setPageLoading] = useState(true);
  const [requesting, setRequesting]   = useState(false);
  // null = not borrowed, 'pending'/'active'/'overdue'/'return_requested' = has active borrow
  const [borrowStatus, setBorrowStatus] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!bookId) { setPageLoading(false); return; }
    try {
      const { token } = getStore();
      const [freshBook, myBorrows] = await Promise.all([
        booksAPI.getOne(token, bookId),
        borrowsAPI.getMine(token),
      ]);
      setBook(freshBook);

      // Check whether user already has an active/pending borrow for this book
      const active = ['pending', 'active', 'overdue', 'return_requested'];
      const existing = (Array.isArray(myBorrows) ? myBorrows : []).find(b => {
        const bId = String(b.bookId?._id || b.bookId || '');
        return bId === bookId && active.includes(b.status);
      });
      setBorrowStatus(existing ? existing.status : null);
    } catch (err) {
      console.log('[BookDetail] loadData error:', err.message);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleRequest() {
    const { token } = getStore();
    if (!token) return Alert.alert('Error', 'Please log in again.');
    if (!bookId) return Alert.alert('Error', 'Invalid book. Please go back and try again.');

    try {
      setRequesting(true);
      await borrowsAPI.borrow(token, bookId);
      setBorrowStatus('pending');
      Alert.alert('Requested!', 'Your request has been sent. The librarian will review it soon.');
    } catch (err) {
      Alert.alert('Error', err.message);
      // Reload to sync with server state
      loadData();
    } finally {
      setRequesting(false);
    }
  }

  if (!book && !pageLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Book not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const available     = (book?.availableCopies ?? 0) > 0;
  const canRequest    = available && borrowStatus === null;

  // Derive button label + colour from state
  let btnLabel  = 'Request Book';
  let btnColor  = '#1a1a2e';
  let btnDisabled = false;

  if (requesting) {
    btnDisabled = true;
  } else if (borrowStatus === 'pending') {
    btnLabel    = 'Request Pending…';
    btnColor    = '#d97706';
    btnDisabled = true;
  } else if (borrowStatus === 'active') {
    btnLabel    = 'Currently Borrowed';
    btnColor    = '#2d6a4f';
    btnDisabled = true;
  } else if (borrowStatus === 'overdue') {
    btnLabel    = 'Overdue — Please Return';
    btnColor    = '#e63946';
    btnDisabled = true;
  } else if (borrowStatus === 'return_requested') {
    btnLabel    = 'Return In Progress';
    btnColor    = '#1a6ab1';
    btnDisabled = true;
  } else if (!available) {
    btnLabel    = 'Not Available';
    btnColor    = '#aaa';
    btnDisabled = true;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {book && (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverText}>{book.title?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Loading spinner while fetching */}
        {pageLoading && (
          <ActivityIndicator style={{ marginBottom: 20 }} color="#1a1a2e" size="large" />
        )}

        {book && (
          <>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author}</Text>

            {/* Availability badges */}
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>{book.category}</Text>
              <View style={[styles.availBadge, { backgroundColor: available ? '#d8f3dc' : '#ffe5e5' }]}>
                <Text style={{ color: available ? '#2d6a4f' : '#e63946', fontSize: 12, fontWeight: '600' }}>
                  {available ? `Available (${book.availableCopies})` : 'Unavailable'}
                </Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Published</Text>
                <Text style={styles.infoValue}>{book.publishDate || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Copies</Text>
                <Text style={styles.infoValue}>{book.quantity ?? '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Available</Text>
                <Text style={styles.infoValue}>{book.availableCopies ?? 0}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {book.description || 'No description available.'}
            </Text>

            {/* Action button */}
            <TouchableOpacity
              style={[styles.borrowBtn, { backgroundColor: btnColor }]}
              disabled={btnDisabled}
              onPress={handleRequest}
              activeOpacity={0.8}
            >
              {requesting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.borrowBtnText}>{btnLabel}</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  centered:    { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText:   { fontSize: 16, color: '#666', marginBottom: 12 },
  backLink:    { fontSize: 15, color: '#1a6ab1', fontWeight: '600' },

  header: {
    backgroundColor: '#1a1a2e',
    padding: 24, paddingTop: 60,
    alignItems: 'center', paddingBottom: 32,
  },
  backBtn:  { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: '#fff', fontSize: 16 },

  coverPlaceholder: {
    width: 100, height: 140, backgroundColor: '#e63946',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  coverText: { fontSize: 48, fontWeight: '700', color: '#fff' },

  body: { padding: 24 },

  title:  { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  author: { fontSize: 15, color: '#666', marginBottom: 16 },

  badgeRow: { flexDirection: 'row', marginBottom: 20, gap: 8, alignItems: 'center' },
  categoryBadge: {
    fontSize: 12, backgroundColor: '#e8f4fd', color: '#1a6ab1',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  availBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },

  infoRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  infoItem:  { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  description:  { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 32 },

  borrowBtn: {
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  borrowBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

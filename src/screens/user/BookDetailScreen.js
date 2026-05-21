import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { borrowsAPI } from '../../data/api';
import { getStore } from '../../data/store';

export default function BookDetailScreen({ route, navigation }) {
  const { book } = route.params;
  const [available, setAvailable] = useState(book.availableCopies > 0);
  const [loading, setLoading] = useState(false);

  async function handleBorrow() {
    try {
      setLoading(true);
      const { token } = getStore();
      await borrowsAPI.borrow(token, book._id);
      setAvailable(false);
      Alert.alert('Success', 'Book requested successfully. Wait for librarian approval.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverText}>{book.title[0]}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>by {book.author}</Text>

        <View style={styles.badgeRow}>
          <Text style={styles.categoryBadge}>{book.category}</Text>
          <Text style={[
            styles.availBadge,
            { backgroundColor: available ? '#d8f3dc' : '#ffe5e5' }
          ]}>
            <Text style={{ color: available ? '#2d6a4f' : '#e63946' }}>
              {available ? 'Available' : 'Unavailable'}
            </Text>
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Publish Date</Text>
            <Text style={styles.infoValue}>{book.publishDate || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Copies</Text>
            <Text style={styles.infoValue}>{book.quantity}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={styles.infoValue}>{book.availableCopies}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{book.description || 'No description available.'}</Text>

        <TouchableOpacity
          style={[styles.borrowBtn, !available && styles.borrowBtnDisabled]}
          disabled={!available || loading}
          onPress={handleBorrow}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.borrowBtnText}>{available ? 'Request Book' : 'Not Available'}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 32,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: '#fff', fontSize: 16 },
  coverPlaceholder: {
    width: 100, height: 140,
    backgroundColor: '#e63946',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { fontSize: 48, fontWeight: '700', color: '#fff' },
  body: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  author: { fontSize: 15, color: '#666', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  categoryBadge: {
    fontSize: 12, backgroundColor: '#e8f4fd', color: '#1a6ab1',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  availBadge: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  description: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 32 },
  borrowBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  borrowBtnDisabled: { backgroundColor: '#ccc' },
  borrowBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

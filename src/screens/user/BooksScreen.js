import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { booksAPI } from '../../data/api';
import { getStore } from '../../data/store';

const CATEGORIES = ['All', 'Technology', 'Fiction', 'Science'];

export default function BooksScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('title');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [search, selectedCategory, sortBy])
  );

  async function fetchBooks() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await booksAPI.getAll(token, search, selectedCategory, sortBy);
      setBooks(data);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Books</Text>
        <TextInput
          style={styles.search}
          placeholder="Search by title or author..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' }}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {['title', 'author'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : books.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No books found</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('BookDetail', { book: item })}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardAuthor}>{item.author}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={[
                  styles.availBadge,
                  { backgroundColor: item.availableCopies > 0 ? '#d8f3dc' : '#ffe5e5' }
                ]}>
                  <Text style={{ color: item.availableCopies > 0 ? '#2d6a4f' : '#e63946' }}>
                    {item.availableCopies > 0 ? 'Available' : 'Unavailable'}
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryRow: { marginVertical: 12 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryChipActive: { backgroundColor: '#1a1a2e' },
  categoryText: { fontSize: 13, color: '#666' },
  categoryTextActive: { color: '#fff' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  sortLabel: { fontSize: 13, color: '#666' },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sortChipActive: { backgroundColor: '#1a1a2e' },
  sortText: { fontSize: 13, color: '#666' },
  sortTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  cardAuthor: { fontSize: 13, color: '#666', marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 8 },
  categoryBadge: {
    fontSize: 11,
    backgroundColor: '#e8f4fd',
    color: '#1a6ab1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999' },
});

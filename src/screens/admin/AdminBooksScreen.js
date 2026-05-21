import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { booksAPI } from '../../data/api';
import { getStore } from '../../data/store';
import { validateName } from '../../data/validate';

export default function AdminBooksScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => { fetchBooks(); }, [search, sortBy]);

  async function fetchBooks() {
    try {
      setLoading(true);
      const { token } = getStore();
      const data = await booksAPI.getAll(token, search, null, sortBy);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingBook(null);
    setTitle(''); setAuthor(''); setCategory('');
    setDescription(''); setPublishDate(''); setQuantity('');
    setModalVisible(true);
  }

  function openEdit(book) {
    setEditingBook(book);
    setTitle(book.title); setAuthor(book.author); setCategory(book.category);
    setDescription(book.description); setPublishDate(book.publishDate);
    setQuantity(book.quantity.toString());
    setModalVisible(true);
  }

  async function handleSave() {
    if (!validateName(title)) return Alert.alert('Error', 'Title must be at least 2 characters');
    if (!validateName(author)) return Alert.alert('Error', 'Author must be at least 2 characters');
    if (!category) return Alert.alert('Error', 'Category is required');
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) return Alert.alert('Error', 'Quantity must be at least 1');
    try {
      const { token } = getStore();
      const qty = parseInt(quantity);
      const payload = { title, author, category, description, publishDate, quantity: qty };
      if (editingBook) {
        await booksAPI.update(token, editingBook._id, payload);
      } else {
        await booksAPI.add(token, payload);
      }
      setModalVisible(false);
      fetchBooks();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleDelete(id) {
    Alert.alert('Delete Book', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const { token } = getStore();
            await booksAPI.delete(token, id);
            fetchBooks();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Books</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or author..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
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
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1a2e" />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={books}
          keyExtractor={item => String(item._id || item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                  <Text style={styles.copies}>{item.availableCopies}/{item.quantity} available</Text>
                </View>
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
            <Text style={styles.modalTitle}>{editingBook ? 'Edit Book' : 'Add Book'}</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#999" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Author" placeholderTextColor="#999" value={author} onChangeText={setAuthor} />
            <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#999" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#999" value={description} onChangeText={setDescription} multiline />
            <TextInput style={styles.input} placeholder="Publish Date (YYYY-MM-DD)" placeholderTextColor="#999" value={publishDate} onChangeText={setPublishDate} />
            <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor="#999" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
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
  cardInfo: { flex: 1, marginRight: 8 },
  bookTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  bookAuthor: { fontSize: 12, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  categoryBadge: {
    fontSize: 11, backgroundColor: '#e8f4fd', color: '#1a6ab1',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  copies: { fontSize: 11, color: '#666' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#e8f4fd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#1a6ab1', fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: '#ffe5e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#e63946', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 20 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 15,
    marginBottom: 12, color: '#1a1a2e', borderWidth: 1, borderColor: '#e0e0e0',
  },
  saveBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { color: '#999', fontSize: 14 },
});

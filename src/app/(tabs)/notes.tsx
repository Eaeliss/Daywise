import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useTheme } from '@/hooks/use-theme'
import { Note, useNotesStore } from '@/stores/notes-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { EmptyState } from '@/components/ui/EmptyState'
import { hapticSuccess } from '@/utils/haptics'
import { formatShortDate } from '@/utils/format'

const ALL_TAGS = ['All', 'Work', 'Personal', 'Ideas', 'Health', 'Finance']
const NOTE_TAGS = ['Work', 'Personal', 'Ideas', 'Health', 'Finance']

export default function NotesScreen() {
  const theme = useTheme()
  const { notes, addNote, updateNote, updateTags, removeNote } = useNotesStore()
  const language = usePreferencesStore((s) => s.language)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest')

  function openNew() {
    setEditingNote(null)
    setTitle('')
    setBody('')
    setEditingTags([])
    setModalVisible(true)
  }

  function openEdit(note: Note) {
    setEditingNote(note)
    setTitle(note.title)
    setBody(note.body)
    setEditingTags(note.tags ?? [])
    setModalVisible(true)
  }

  function handleSave() {
    if (!title.trim() && !body.trim()) return
    hapticSuccess()
    if (editingNote) {
      updateNote(editingNote.id, title.trim(), body.trim())
      updateTags(editingNote.id, editingTags)
    } else {
      const newId = addNote(title.trim(), body.trim())
      if (editingTags.length > 0) updateTags(newId, editingTags)
    }
    setModalVisible(false)
  }

  function toggleEditingTag(tag: string) {
    setEditingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((n) => {
      const matchesTag = selectedFilter === 'All' || (n.tags ?? []).includes(selectedFilter)
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      return matchesTag && matchesSearch
    })
    if (sortOrder === 'newest') return [...filtered].sort((a, b) => b.date.localeCompare(a.date))
    if (sortOrder === 'oldest') return [...filtered].sort((a, b) => a.date.localeCompare(b.date))
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title))
  }, [notes, selectedFilter, searchQuery, sortOrder])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
        <View style={{
          backgroundColor: theme.backgroundElement, borderRadius: 10,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8,
        }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
            placeholderTextColor={theme.textSecondary}
            style={{ flex: 1, fontSize: 14, color: theme.text, paddingVertical: 10 }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>×</Text>
            </Pressable>
          )}
        </View>
      </View>
      {/* Tag filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 8 }}
      >
        {ALL_TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => setSelectedFilter(tag)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: selectedFilter === tag ? '#3b82f6' : theme.backgroundElement,
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '500',
              color: selectedFilter === tag ? '#fff' : theme.textSecondary,
            }}>
              {tag}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort toggle */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}>
        {(['newest', 'oldest', 'title'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSortOrder(s)}
            style={{
              paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
              backgroundColor: sortOrder === s ? '#3b82f6' : theme.backgroundElement,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: sortOrder === s ? '#fff' : theme.textSecondary }}>
              {s === 'newest' ? 'Newest' : s === 'oldest' ? 'Oldest' : 'A–Z'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 96 }}>
        {filteredNotes.length === 0 ? (
          <EmptyState emoji="📝" title="No notes yet" subtitle="Tap + to write your first note." />
        ) : (
          <View style={{ gap: 12 }}>
            {filteredNotes.map((note) => {
              const renderRightActions = () => (
                <Pressable
                  onPress={() => removeNote(note.id)}
                  style={{
                    width: 80, backgroundColor: '#ef4444',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, marginLeft: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Delete</Text>
                </Pressable>
              )

              return (
                <Swipeable key={note.id} renderRightActions={renderRightActions}>
                  <Pressable
                    onPress={() => openEdit(note)}
                    style={{
                      backgroundColor: theme.backgroundElement,
                      borderRadius: 12, padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        {note.title !== '' && (
                          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                            {note.title}
                          </Text>
                        )}
                        {note.body !== '' && (
                          <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 20 }} numberOfLines={3}>
                            {note.body}
                          </Text>
                        )}
                      </View>
                      <Pressable onPress={() => removeNote(note.id)} hitSlop={8}>
                        <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>×</Text>
                      </Pressable>
                    </View>
                    {/* Tags */}
                    {(note.tags ?? []).length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {(note.tags ?? []).map((tag) => (
                          <View key={tag} style={{ backgroundColor: '#3b82f622', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '500' }}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 10 }}>
                      {formatShortDate(note.date, language)}
                    </Text>
                  </Pressable>
                </Swipeable>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={openNew}
        style={{
          position: 'absolute', bottom: 32, right: 24,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
      </Pressable>

      {/* Note editor modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Modal header */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
              borderBottomWidth: 1, borderBottomColor: theme.backgroundSelected,
            }}>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Text style={{ fontSize: 15, color: '#3b82f6' }}>Cancel</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <Pressable onPress={handleSave} hitSlop={8}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#3b82f6' }}>Save</Text>
              </Pressable>
            </View>

            {/* Tag picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
            >
              {NOTE_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleEditingTag(tag)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: editingTags.includes(tag) ? '#3b82f6' : theme.backgroundElement,
                  }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: '500',
                    color: editingTags.includes(tag) ? '#fff' : theme.textSecondary,
                  }}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              <TextInput
                autoFocus={!editingNote}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor={theme.textSecondary}
                style={{
                  fontSize: 20, fontWeight: '600', color: theme.text,
                  marginBottom: 16, paddingVertical: 4,
                }}
              />
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write something..."
                placeholderTextColor={theme.textSecondary}
                multiline
                textAlignVertical="top"
                style={{
                  fontSize: 16, color: theme.text, lineHeight: 24,
                  minHeight: 300,
                }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

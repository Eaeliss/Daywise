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
import { useTheme } from '@/hooks/use-theme'
import { Goal, useGoalsStore } from '@/stores/goals-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { EmptyState } from '@/components/ui/EmptyState'
import { DateInput } from '@/components/ui/DateInput'
import { hapticLight, hapticSuccess } from '@/utils/haptics'
import { scheduleGoalDeadlineAlert, cancelGoalDeadlineAlert } from '@/utils/notifications'
import { formatShortDate } from '@/utils/format'

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isOverdue(targetDate: string, today: string) {
  return targetDate !== '' && targetDate < today
}

export default function GoalsScreen() {
  const theme = useTheme()
  const { goals, addGoal, updateGoal, toggleGoal, removeGoal, updateProgress, addMilestone, toggleMilestone, removeMilestone } = useGoalsStore()
  const currency = usePreferencesStore((s) => s.currency)
  const language = usePreferencesStore((s) => s.language)

  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [progressTarget, setProgressTarget] = useState('')

  // Edit goal modal
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTargetDate, setEditTargetDate] = useState('')

  // Progress update modal
  const [progressModalGoal, setProgressModalGoal] = useState<Goal | null>(null)
  const [progressInput, setProgressInput] = useState('')

  // Milestone inline input
  const [addingMilestoneForId, setAddingMilestoneForId] = useState<string | null>(null)
  const [milestoneInput, setMilestoneInput] = useState('')

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setEditTitle(goal.title)
    setEditDescription(goal.description)
    setEditTargetDate(goal.targetDate)
  }

  function handleEditSave() {
    if (!editingGoal || !editTitle.trim()) return
    const date = editTargetDate.trim()
    if (date !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    updateGoal(editingGoal.id, editTitle.trim(), editDescription.trim(), date)
    // Reschedule deadline alert if date changed
    if (date !== '') {
      scheduleGoalDeadlineAlert(editingGoal.id, editTitle.trim(), date)
    } else {
      cancelGoalDeadlineAlert(editingGoal.id)
    }
    setEditingGoal(null)
  }

  function openProgress(goal: Goal) {
    setProgressModalGoal(goal)
    setProgressInput(goal.progressCurrent > 0 ? String(goal.progressCurrent) : '')
  }

  function handleSaveProgress() {
    if (!progressModalGoal) return
    const val = parseFloat(progressInput.replace(',', '.'))
    if (!isNaN(val) && val >= 0) updateProgress(progressModalGoal.id, val)
    setProgressModalGoal(null)
  }

  const today = getTodayString()

  const { active, completed } = useMemo(() => {
    const active: Goal[] = []
    const completed: Goal[] = []
    for (const g of goals) {
      if (g.completed) completed.push(g)
      else active.push(g)
    }
    // Sort active: goals with target dates first (nearest first), then no-date goals
    active.sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
      if (a.targetDate) return -1
      if (b.targetDate) return 1
      return a.createdAt.localeCompare(b.createdAt)
    })
    return { active, completed }
  }, [goals])

  function handleAdd() {
    if (!title.trim()) return
    const date = targetDate.trim()
    if (date !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    const target = parseFloat(progressTarget.replace(',', '.'))
    hapticSuccess()
    const newId = addGoal(title.trim(), description.trim(), date, isNaN(target) || target <= 0 ? 0 : target)
    if (date !== '') scheduleGoalDeadlineAlert(newId, title.trim(), date)
    setTitle('')
    setDescription('')
    setTargetDate('')
    setProgressTarget('')
    setModalVisible(false)
  }

  function handleRemoveGoal(id: string) {
    cancelGoalDeadlineAlert(id)
    removeGoal(id)
  }

  function handleAddMilestone(goalId: string) {
    if (!milestoneInput.trim()) return
    addMilestone(goalId, milestoneInput.trim())
    setMilestoneInput('')
    setAddingMilestoneForId(null)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>

        {/* Active goals */}
        {active.length === 0 && completed.length === 0 ? (
          <EmptyState emoji="🎯" title="No goals yet" subtitle="Tap + to set your first goal." />
        ) : (
          <>
            {active.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
                  Active · {active.length}
                </Text>
                <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
                  {active.map((goal, i) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      isLast={i === active.length - 1}
                      today={today}
                      separatorColor={theme.backgroundSelected}
                      textColor={theme.text}
                      secondaryColor={theme.textSecondary}
                      accentColor='#3b82f6'
                      onToggle={(id) => { hapticLight(); toggleGoal(id) }}
                      onRemove={handleRemoveGoal}
                      onEdit={() => openEdit(goal)}
                      onUpdateProgress={() => openProgress(goal)}
                      addingMilestoneForId={addingMilestoneForId}
                      milestoneInput={milestoneInput}
                      onSetAddingMilestone={(id) => { setAddingMilestoneForId(id); setMilestoneInput('') }}
                      onMilestoneInputChange={setMilestoneInput}
                      onAddMilestone={handleAddMilestone}
                      onToggleMilestone={toggleMilestone}
                      onRemoveMilestone={removeMilestone}
                      backgroundEl={theme.backgroundElement}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Completed goals */}
            {completed.length > 0 && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginBottom: 12 }}>
                  Completed · {completed.length}
                </Text>
                <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
                  {completed.map((goal, i) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      isLast={i === completed.length - 1}
                      today={today}
                      separatorColor={theme.backgroundSelected}
                      textColor={theme.textSecondary}
                      secondaryColor={theme.textSecondary}
                      accentColor='#22c55e'
                      onToggle={(id) => { hapticLight(); toggleGoal(id) }}
                      onRemove={handleRemoveGoal}
                      onEdit={() => openEdit(goal)}
                      onUpdateProgress={() => openProgress(goal)}
                      addingMilestoneForId={addingMilestoneForId}
                      milestoneInput={milestoneInput}
                      onSetAddingMilestone={(id) => { setAddingMilestoneForId(id); setMilestoneInput('') }}
                      onMilestoneInputChange={setMilestoneInput}
                      onAddMilestone={handleAddMilestone}
                      onToggleMilestone={toggleMilestone}
                      onRemoveMilestone={removeMilestone}
                      backgroundEl={theme.backgroundElement}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setModalVisible(true)}
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

      {/* Progress update modal */}
      <Modal
        visible={!!progressModalGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setProgressModalGoal(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setProgressModalGoal(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Update Progress</Text>
              {progressModalGoal && (
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
                  {progressModalGoal.title} · target: {progressModalGoal.progressTarget}
                </Text>
              )}
              <TextInput
                autoFocus
                value={progressInput}
                onChangeText={setProgressInput}
                placeholder={`Current value (0–${progressModalGoal?.progressTarget ?? ''})`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveProgress}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 16,
                }}
              />
              <Pressable
                onPress={handleSaveProgress}
                style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save Progress</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit goal modal */}
      <Modal
        visible={editingGoal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingGoal(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setEditingGoal(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Edit Goal</Text>
              <TextInput
                autoFocus
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Goal title"
                placeholderTextColor={theme.textSecondary}
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }}
              />
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description (optional)"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10, minHeight: 72, textAlignVertical: 'top' }}
              />
              <View style={{ marginBottom: 16 }}>
                <DateInput value={editTargetDate} onChange={setEditTargetDate} placeholder="Target date (optional)" />
              </View>
              <Pressable
                onPress={handleEditSave}
                style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Add goal modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{
                backgroundColor: theme.background,
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: 24,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>
                New Goal
              </Text>
              <TextInput
                autoFocus
                value={title}
                onChangeText={setTitle}
                placeholder="Goal title"
                placeholderTextColor={theme.textSecondary}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 10,
                }}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                placeholderTextColor={theme.textSecondary}
                multiline
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 10,
                  minHeight: 72, textAlignVertical: 'top',
                }}
              />
              <View style={{ marginBottom: 10 }}>
                <DateInput value={targetDate} onChange={setTargetDate} placeholder="Target date (optional)" />
              </View>
              <TextInput
                value={progressTarget}
                onChangeText={setProgressTarget}
                placeholder="Progress target e.g. 100 (optional)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 16,
                }}
              />
              <Pressable
                onPress={handleAdd}
                style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add Goal</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}

type RowProps = {
  goal: Goal
  isLast: boolean
  today: string
  separatorColor: string
  textColor: string
  secondaryColor: string
  accentColor: string
  backgroundEl: string
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: () => void
  onUpdateProgress: () => void
  addingMilestoneForId: string | null
  milestoneInput: string
  onSetAddingMilestone: (id: string | null) => void
  onMilestoneInputChange: (text: string) => void
  onAddMilestone: (goalId: string) => void
  onToggleMilestone: (goalId: string, milestoneId: string) => void
  onRemoveMilestone: (goalId: string, milestoneId: string) => void
}

function GoalRow({
  goal, isLast, today, separatorColor, textColor, secondaryColor, accentColor, backgroundEl,
  onToggle, onRemove, onEdit, onUpdateProgress,
  addingMilestoneForId, milestoneInput, onSetAddingMilestone, onMilestoneInputChange,
  onAddMilestone, onToggleMilestone, onRemoveMilestone,
}: RowProps) {
  const overdue = !goal.completed && isOverdue(goal.targetDate, today)
  const hasProgress = goal.progressTarget > 0
  const pct = hasProgress ? Math.min(goal.progressCurrent / goal.progressTarget, 1) : 0
  const isAddingMilestone = addingMilestoneForId === goal.id

  return (
    <View style={{
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: separatorColor,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Completion toggle */}
        <Pressable onPress={() => onToggle(goal.id)} hitSlop={8} style={{ marginRight: 12 }}>
          <View style={{
            width: 22, height: 22, borderRadius: 11,
            borderWidth: 2,
            borderColor: goal.completed ? '#22c55e' : '#3b82f6',
            backgroundColor: goal.completed ? '#22c55e' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {goal.completed && (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 14 }}>✓</Text>
            )}
          </View>
        </Pressable>

        {/* Content */}
        <Pressable onLongPress={onEdit} style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 15, color: textColor, textDecorationLine: goal.completed ? 'line-through' : 'none' }}>
            {goal.title}
          </Text>
          {goal.description !== '' && (
            <Text style={{ fontSize: 12, color: secondaryColor, marginTop: 2 }} numberOfLines={1}>{goal.description}</Text>
          )}
          {goal.targetDate !== '' && (
            <Text style={{ fontSize: 12, color: overdue ? '#ef4444' : secondaryColor, marginTop: 2 }}>
              {overdue ? 'Overdue · ' : 'Due · '}{formatShortDate(goal.targetDate, language)}
            </Text>
          )}
        </Pressable>

        {/* Progress update button */}
        {hasProgress && !goal.completed && (
          <Pressable onPress={onUpdateProgress} hitSlop={8} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>
              {goal.progressCurrent}/{goal.progressTarget}
            </Text>
          </Pressable>
        )}

        {/* Delete */}
        <Pressable onPress={() => onRemove(goal.id)} hitSlop={8}>
          <Text style={{ color: secondaryColor, fontSize: 20, lineHeight: 22 }}>×</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      {hasProgress && (
        <View style={{ marginTop: 10, marginLeft: 34 }}>
          <View style={{ height: 4, backgroundColor: separatorColor, borderRadius: 2 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: pct >= 1 ? '#22c55e' : accentColor, width: `${Math.round(pct * 100)}%` }} />
          </View>
          <Text style={{ fontSize: 11, color: secondaryColor, marginTop: 4 }}>
            {Math.round(pct * 100)}% complete
          </Text>
        </View>
      )}

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <View style={{ marginTop: 8, marginLeft: 34, gap: 6 }}>
          {goal.milestones.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => onToggleMilestone(goal.id, m.id)} hitSlop={6}>
                <View style={{
                  width: 16, height: 16, borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: m.completed ? '#22c55e' : secondaryColor,
                  backgroundColor: m.completed ? '#22c55e' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.completed && <Text style={{ color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '700' }}>✓</Text>}
                </View>
              </Pressable>
              <Text style={{
                flex: 1, fontSize: 13, color: m.completed ? secondaryColor : textColor,
                textDecorationLine: m.completed ? 'line-through' : 'none',
              }}>
                {m.title}
              </Text>
              <Pressable onPress={() => onRemoveMilestone(goal.id, m.id)} hitSlop={6}>
                <Text style={{ color: secondaryColor, fontSize: 16, lineHeight: 18 }}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Add milestone area */}
      <View style={{ marginTop: 6, marginLeft: 34 }}>
        {isAddingMilestone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              autoFocus
              value={milestoneInput}
              onChangeText={onMilestoneInputChange}
              placeholder="Milestone title"
              placeholderTextColor={secondaryColor}
              returnKeyType="done"
              onSubmitEditing={() => onAddMilestone(goal.id)}
              style={{
                flex: 1, fontSize: 13, color: textColor,
                backgroundColor: backgroundEl,
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              }}
            />
            <Pressable onPress={() => onAddMilestone(goal.id)} hitSlop={6}>
              <Text style={{ fontSize: 13, color: accentColor, fontWeight: '600' }}>Add</Text>
            </Pressable>
            <Pressable onPress={() => onSetAddingMilestone(null)} hitSlop={6}>
              <Text style={{ fontSize: 13, color: secondaryColor }}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onSetAddingMilestone(goal.id)} hitSlop={6}>
            <Text style={{ fontSize: 12, color: secondaryColor }}>+ milestone</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

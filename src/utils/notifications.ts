import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleDailyHabitReminder(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'web') return
  await cancelHabitReminder()
  await Notifications.scheduleNotificationAsync({
    identifier: 'habit-reminder',
    content: {
      title: "Don't forget your habits!",
      body: 'Track your daily habits and keep your streak going.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  })
}

export async function cancelHabitReminder(): Promise<void> {
  if (Platform.OS === 'web') return
  await Notifications.cancelScheduledNotificationAsync('habit-reminder').catch(() => {})
}

export async function scheduleGoalDeadlineAlert(
  goalId: string,
  goalTitle: string,
  deadlineDateStr: string,
): Promise<void> {
  if (Platform.OS === 'web') return
  const deadline = new Date(deadlineDateStr + 'T09:00:00')
  const alertDate = new Date(deadline)
  alertDate.setDate(alertDate.getDate() - 1)
  if (alertDate <= new Date()) return

  await Notifications.cancelScheduledNotificationAsync('goal-' + goalId).catch(() => {})
  await Notifications.scheduleNotificationAsync({
    identifier: 'goal-' + goalId,
    content: {
      title: 'Goal deadline tomorrow',
      body: `"${goalTitle}" is due tomorrow.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: alertDate,
    },
  })
}

export async function cancelGoalDeadlineAlert(goalId: string): Promise<void> {
  if (Platform.OS === 'web') return
  await Notifications.cancelScheduledNotificationAsync('goal-' + goalId).catch(() => {})
}

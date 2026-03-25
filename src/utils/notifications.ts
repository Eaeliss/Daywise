import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
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

/** Schedule a daily habit reminder at the given hour:minute (24h). Cancels previous reminder first. */
export async function scheduleDailyHabitReminder(hour: number, minute: number): Promise<void> {
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
  await Notifications.cancelScheduledNotificationAsync('habit-reminder').catch(() => {})
}

/** Schedule a one-time goal deadline alert. goalId is used as the notification identifier. */
export async function scheduleGoalDeadlineAlert(
  goalId: string,
  goalTitle: string,
  deadlineDateStr: string, // YYYY-MM-DD
): Promise<void> {
  // Alert the day before at 9am
  const deadline = new Date(deadlineDateStr + 'T09:00:00')
  const alertDate = new Date(deadline)
  alertDate.setDate(alertDate.getDate() - 1)

  if (alertDate <= new Date()) return // already past

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
  await Notifications.cancelScheduledNotificationAsync('goal-' + goalId).catch(() => {})
}

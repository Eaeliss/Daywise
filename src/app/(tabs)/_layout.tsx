import { Tabs, router } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/hooks/use-theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(focused: boolean, name: IconName, outlineName: IconName, color: string) {
  return <Ionicons name={focused ? name : outlineName} size={22} color={color} />
}

function BackToDashboard({ color }: { color: string }) {
  return (
    <Pressable
      onPress={() => router.push('/(tabs)/dashboard')}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 4, paddingRight: 8 }}
    >
      <Ionicons name="chevron-back" size={22} color={color} />
      <Text style={{ fontSize: 15, color, marginLeft: 2 }}>Dashboard</Text>
    </Pressable>
  )
}

export default function TabsLayout() {
  const theme = useTheme()

  const screenOptions = {
    tabBarActiveTintColor: '#3b82f6',
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.backgroundSelected },
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.text,
    headerShadowVisible: false,
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => tabIcon(focused, 'home', 'home-outline', color),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
              <Pressable onPress={() => router.push('/(tabs)/notes')} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="document-text-outline" size={22} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => router.push('/(tabs)/search')} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="search-outline" size={22} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="settings-outline" size={22} color={theme.text} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused, color }) => tabIcon(focused, 'checkmark-circle', 'checkmark-circle-outline', color),
          headerLeft: () => <BackToDashboard color={theme.text} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused, color }) => tabIcon(focused, 'flag', 'flag-outline', color),
          headerLeft: () => <BackToDashboard color={theme.text} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finances',
          tabBarIcon: ({ focused, color }) => tabIcon(focused, 'wallet', 'wallet-outline', color),
          headerLeft: () => <BackToDashboard color={theme.text} />,
          headerRight: () => (
            <Pressable onPress={() => router.push('/(tabs)/stats')} hitSlop={8} style={{ padding: 8, marginRight: 8 }}>
              <Ionicons name="bar-chart-outline" size={22} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => tabIcon(focused, 'calendar', 'calendar-outline', color),
          headerLeft: () => <BackToDashboard color={theme.text} />,
        }}
      />

      {/* Hidden from tab bar — still navigable via router.push */}
      <Tabs.Screen
        name="notes"
        options={{
          href: null,
          title: 'Notes',
          headerLeft: () => <BackToDashboard color={theme.text} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
          title: 'Stats',
          headerLeft: () => <BackToDashboard color={theme.text} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          title: 'Search',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 8, marginLeft: 4 }}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  )
}

import { Tabs } from 'expo-router';
import {
  House,
  ClipboardList,
  HardHat,
  Megaphone,
  UserRound,
} from 'lucide-react-native';
import { colors } from '../../src/constants/theme';
import { useLocale } from '../../src/context/LocaleContext';

export default function TabsLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        sceneStyle: { paddingBottom: 92 },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 16,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderRadius: 22,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: t('complaints'),
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: t('work'),
          tabBarIcon: ({ color, size }) => <HardHat color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: t('updates'),
          tabBarIcon: ({ color, size }) => <Megaphone color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

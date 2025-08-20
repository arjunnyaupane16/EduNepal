import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from './context/ThemeContext'; // ✅ Theme context

const themes = [
  { id: 'system', name: 'System Default', icon: 'theme-light-dark' },
  { id: 'light', name: 'Light Mode', icon: 'white-balance-sunny' },
  { id: 'dark', name: 'Dark Mode', icon: 'weather-night' },
  { id: 'blue', name: 'Ocean Blue', icon: 'palette' },
  { id: 'purple', name: 'Royal Purple', icon: 'palette' },
  { id: 'green', name: 'Forest Green', icon: 'palette' },
  { id: 'pink', name: 'Sunset Pink', icon: 'palette' },
];

export default function ThemeScreen() {
  const { themeKey, changeTheme, theme } = useTheme();

  return (
    <ScrollView style={{ padding: 16, backgroundColor: theme.background, flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
        🎨 Select Your Theme
      </Text>
      <Text style={{ fontSize: 16, color: theme.text, marginBottom: 16 }}>
        Customize the app's appearance to your preference.
      </Text>

      {themes.map((t) => {
        const selected = themeKey === t.id;

        return (
          <TouchableOpacity
            key={t.id}
            onPress={() => changeTheme(t.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              marginBottom: 10,
              backgroundColor: selected ? '#e6f0ff' : theme.background,
              borderRadius: 10,
              borderWidth: selected ? 1.5 : 0,
              borderColor: selected ? '#007aff' : 'transparent',
            }}
          >
            <MaterialCommunityIcons
              name={t.icon}
              size={22}
              color={selected ? '#007aff' : theme.text}
              style={{ marginRight: 10 }}
            />
            <Text style={{ flex: 1, fontSize: 16, color: theme.text }}>{t.name}</Text>
            {selected && (
              <Ionicons name="checkmark-circle" size={20} color="#007aff" />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

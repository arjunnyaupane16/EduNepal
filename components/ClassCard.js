import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../app/context/ThemeContext';
import { useLanguage } from '../app/context/LanguageContext';
import styles from '../styles/ClassCardStyles';
export default function ClassCard({ id, icon, title, subtitle }) {
  const router = useRouter();
  const { theme } = useTheme(); // use current theme
  const { t } = useLanguage();

  const handlePress = () => {
    router.push(`/classes/class${id}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
     <MaterialIcons name={icon} size={36} color={theme.primary} style={styles.icon} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.subtext }]}>{subtitle}</Text>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handlePress}>
        <Text style={[styles.buttonText, { color: '#fff' }]}>{t('explore')} {'>'}</Text>
      </TouchableOpacity>
    </View>
  );
}

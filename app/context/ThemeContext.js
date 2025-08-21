import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

const themes = {
  // System now dynamically mirrors the OS color scheme using useColorScheme
  system: {},

  // Instagram-like light theme: clean white with bright pink accent
  light: {
    background: '#FFFFFF',
    text: '#000000',
    card: '#FAFAFA',
    primary: '#1E90FF', // dodger blue for better contrast
    secondary: '#3897f0', // IG blue accent
    placeholder: '#A8A8A8',
    subtext: '#737373',
    cardBackground: '#FFFFFF',
    border: '#E5E7EB',
    secondaryText: '#6B7280',
    disabled: '#D1D5DB',
    searchBackground: '#F5F5F5',
  },

  // Instagram-like dark theme: deep black with pink accents
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    card: '#121212',
    primary: '#1E90FF', // dodger blue for better contrast
    secondary: '#3897f0',
    placeholder: '#9CA3AF',
    subtext: '#A8A8A8',
    cardBackground: '#111111',
    border: '#262626',
    secondaryText: '#A1A1AA',
    disabled: '#404040',
    searchBackground: '#0A0A0A',
  },

  blue: {
    background: '#d0e8f2',
    text: '#003f5c',
    card: '#b3dcee',
    primary: '#0077b6',
    secondary: '#90e0ef',
    placeholder: '#669bbc',
    subtext: '#33658a',
    cardBackground: '#e3f2fd',
    border: '#bcd5ea',
    secondaryText: '#4f7394',
    disabled: '#b6c8d6',
    searchBackground: '#eef6fb',
  },
  purple: {
    background: '#e9d5ff',
    text: '#3b0764',
    card: '#f3e8ff',
    primary: '#a855f7',
    secondary: '#c084fc',
    placeholder: '#9f7aea',
    subtext: '#6b21a8',
    cardBackground: '#f5e9ff',
    border: '#e9d5ff',
    secondaryText: '#7e22ce',
    disabled: '#e9d5ff',
    searchBackground: '#faf5ff',
  },
  green: {
    background: '#d1fae5',
    text: '#064e3b',
    card: '#a7f3d0',
    primary: '#10b981',
    secondary: '#6ee7b7',
    placeholder: '#34d399',
    subtext: '#065f46',
    cardBackground: '#ecfdf5',
    border: '#bbf7d0',
    secondaryText: '#0f766e',
    disabled: '#d1fae5',
    searchBackground: '#f0fdf4',
  },
  // Pink accent theme (light) with neutral background
  pink: {
    background: '#FFFFFF',
    text: '#111827',
    card: '#FAFAFA',
    primary: '#ED4956',
    secondary: '#F472B6',
    placeholder: '#D1D5DB',
    subtext: '#6B7280',
    cardBackground: '#FFFFFF',
    border: '#F3F4F6',
    secondaryText: '#6B7280',
    disabled: '#E5E7EB',
    searchBackground: '#F9FAFB',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState(null); // initially null
  const systemScheme = useColorScheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('themeKey');
        if (stored && themes[stored]) {
          setThemeKey(stored);
        } else {
          // Default to light with bright pink accents
          setThemeKey('light');
        }
      } catch (err) {
        console.error('Failed to load theme from storage:', err);
        setThemeKey('system');
      }
    };
    loadTheme();
  }, []);

  const changeTheme = async (key) => {
    if (!themes[key]) return;
    try {
      await AsyncStorage.setItem('themeKey', key);
      setThemeKey(key);
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  const currentTheme = useMemo(() => {
    // Force system to always be light as requested
    if (themeKey === 'system') {
      return themes.light;
    }
    return themeKey && themes[themeKey] ? themes[themeKey] : themes.light;
  }, [themeKey, systemScheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeKey,
        changeTheme,
      }}
    >
      {themeKey ? children : null}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

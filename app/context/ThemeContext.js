import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const themes = {
  system: {
    background: '#ffffffff',
    text: '#000000',
    card: '#adc3b026',
    primary: '#566ff9ff',
    secondary: '#4cf72ef7',
    placeholder: '#2ec3da49',
    subtext: '#666666',
  },
  light: {
    background: '#ffffff',
    text: '#000000',
    card: '#f5f5f5',
    primary: '#007bff',
    secondary: '#6c757d',
    placeholder: '#999999',
    subtext: '#666666',
  },
  dark: {
    background: '#000000',
    text: '#ffffff',
    card: '#1e1e1e',
    primary: '#5599feff',
    secondary: '#adb5bd',
    placeholder: '#cccccc',
    subtext: '#aaaaaa',
  },
  blue: {
    background: '#d0e8f2',
    text: '#003f5c',
    card: '#b3dcee',
    primary: '#0077b6',
    secondary: '#90e0ef',
    placeholder: '#669bbc',
    subtext: '#33658a',
  },
  purple: {
    background: '#e9d5ff',
    text: '#3b0764',
    card: '#f3e8ff',
    primary: '#a855f7',
    secondary: '#c084fc',
    placeholder: '#9f7aea',
    subtext: '#6b21a8',
  },
  green: {
    background: '#d1fae5',
    text: '#064e3b',
    card: '#a7f3d0',
    primary: '#10b981',
    secondary: '#6ee7b7',
    placeholder: '#34d399',
    subtext: '#065f46',
  },
  pink: {
    background: '#ffe4e6',
    text: '#9d174d',
    card: '#fbcfe8',
    primary: '#ec4899',
    secondary: '#f472b6',
    placeholder: '#f9a8d4',
    subtext: '#831843',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState(null); // initially null

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('themeKey');
        if (stored && themes[stored]) {
          setThemeKey(stored);
        } else {
          setThemeKey('system');
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

  const currentTheme = themeKey && themes[themeKey] ? themes[themeKey] : themes.system;

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

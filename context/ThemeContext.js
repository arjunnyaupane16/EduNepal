import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Appearance } from 'react-native-appearance';

// Default theme colors
const lightTheme = {
  background: '#ffffff',
  cardBackground: '#f8f9fa',
  text: '#212529',
  secondaryText: '#6c757d',
  primary: '#0d6efd',
  border: '#dee2e6',
  placeholder: '#6c757d',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme = {
  background: '#121212',
  cardBackground: '#1e1e1e',
  text: '#f8f9fa',
  secondaryText: '#adb5bd',
  primary: '#0d6efd',
  border: '#343a40',
  placeholder: '#6c757d',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
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

export default ThemeContext;

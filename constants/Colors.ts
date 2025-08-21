/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Primary accent: slightly darker blue for better contrast
const tintColorLight = '#1E90FF';
const tintColorDark = '#1E90FF';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F5F5F5',
    background: '#000000',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
  },
};

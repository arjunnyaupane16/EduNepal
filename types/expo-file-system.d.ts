declare module 'expo-module-scripts/tsconfig.base' {
  const config: any;
  export default config;
}

declare module 'expo-file-system' {
  export * from 'expo-file-system/build/FileSystem';
}

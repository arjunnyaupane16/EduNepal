import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

export default function CustomDrawer(props) {
  return (
    <DrawerContentScrollView {...props} style={{ paddingHorizontal: 10 }}>
      <Text style={styles.sectionTitle}>General</Text>

      <DrawerItem
        label="Home"
        labelStyle={styles.label}
        icon={() => <Ionicons name="home-outline" size={20} color="#4B5563" />}
        onPress={() => props.navigation.navigate('Home')}
      />
      <DrawerItem
        label="Settings"
        labelStyle={styles.label}
        icon={() => <Ionicons name="settings-outline" size={20} color="#4B5563" />}
        onPress={() => props.navigation.navigate('Settings')}
      />
      <DrawerItem
        label="Language"
        labelStyle={styles.label}
        icon={() => <Ionicons name="language-outline" size={20} color="#4B5563" />}
        onPress={() => props.navigation.navigate('Language')}
      />
      <DrawerItem
        label="Downloads"
        labelStyle={styles.label}
        icon={() => <Ionicons name="download-outline" size={20} color="#4B5563" />}
        onPress={() => props.navigation.navigate('Downloads')}
      />

      <Text style={styles.sectionTitle}>Support & Account</Text>

      <DrawerItem
        label="Help & Support"
        labelStyle={styles.label}
        icon={() => <Ionicons name="help-circle-outline" size={20} color="#4B5563" />}
        onPress={() => props.navigation.navigate('Help')}
      />

      <TouchableOpacity style={styles.logoutButton}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 15,
    marginLeft: 12,
    color: '#374151',
  },
  label: {
    marginLeft: -20,
    color: '#111827',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#EF476F',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
});

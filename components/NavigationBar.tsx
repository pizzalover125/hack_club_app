import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tabs = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/ysws', icon: 'hammer', label: 'YSWS' },
  { href: '/stats', icon: 'bar-chart', label: 'Stats' },
  { href: '/hackathons', icon: 'code-slash', label: 'Hackathons' },
  { href: '/events', icon: 'calendar', label: 'Events' },
  { href: '/hackatime', icon: 'timer', label: 'Hackatime' },
  { href: '/scrapbook', icon: 'book-outline', label: 'Scrapbook' }, 
  { href: '/scraps', icon: 'book', label: 'Scraps' },
  { href: '/mail', icon: 'mail', label: 'Mail' },
];

export default function HamburgerMenu() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
        <Ionicons 
          name={isMenuOpen ? 'close' : 'menu'} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        >
          <View style={styles.menuContainer}>
            {tabs.map(tab => {
              const selected = pathname === tab.href;
              return (
                <Link href={tab.href as any} asChild key={tab.href}>
                  <TouchableOpacity 
                    style={[
                      styles.menuItem,
                      selected && styles.menuItemSelected
                    ]}
                    onPress={closeMenu}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      color={selected ? '#ec3750' : '#FFFFFF'}
                      size={20}
                      style={styles.menuIcon}
                    />
                    <Text
                      style={[
                        styles.menuText,
                        selected && { color: '#ec3750' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 10,
    minWidth: 200,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuItemSelected: {
    backgroundColor: '#333333',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
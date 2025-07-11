import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tabs = [
  { href: '/', icon: 'home' },
  { href: '/ysws', icon: 'hammer' },
  { href: '/stats', icon: 'bar-chart' },
  { href: '/hackathons', icon: 'code-slash' },
  { href: '/events', icon: 'calendar' },
  { href: '/hackatime', icon: 'timer' },
  // { href: '/scrapbook', icon: 'book-outline' }, 
  { href: '/scraps', icon: 'book' }
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const selected = pathname === tab.href;
        return (
          <Link href={tab.href as any} asChild key={tab.href}>
            <TouchableOpacity style={styles.tab}>
              <Ionicons
                name={tab.icon as any}
                color={selected ? '#ec3750' : '#FFFFFF'}
                size={24}
              />
              <Text
                style={[
                  styles.tabText,
                  selected && { color: '#ec3750' },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
              </Text>
            </TouchableOpacity>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',                  
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    height: 70,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 5,
    fontSize: 12,
  },
});

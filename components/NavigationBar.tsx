<<<<<<< HEAD
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
=======
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 07ac53c (committing this now so it doesn't break later)
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NavigationBar() {
  return (
    <View style={styles.container}>
      <Link href="/" asChild>
      <TouchableOpacity style={styles.tab}>
<<<<<<< HEAD
        <Feather name="home" color="#FFFFFF" size={24} />
=======
        <Ionicons name="home" color="#FFFFFF" size={24} />
>>>>>>> 07ac53c (committing this now so it doesn't break later)
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        Home
        </Text>
      </TouchableOpacity>
      </Link>

      <Link href="/ysws" asChild>
      <TouchableOpacity style={styles.tab}>
<<<<<<< HEAD
        <MaterialIcons name="build" color="#FFFFFF" size={24} />
=======
        <Ionicons name="hammer" color="#FFFFFF" size={24} />
>>>>>>> 07ac53c (committing this now so it doesn't break later)
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        YSWS
        </Text>
      </TouchableOpacity>
      </Link>

      <Link href="/stats" asChild>
      <TouchableOpacity style={styles.tab}>
        <Ionicons name="bar-chart" color="#FFFFFF" size={24} />
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        Stats
        </Text>
      </TouchableOpacity>
      </Link>

      <Link href="/hackathons" asChild>
      <TouchableOpacity style={styles.tab}>
<<<<<<< HEAD
        <Feather name="code" color="#FFFFFF" size={24} />
=======
        <Ionicons name="code-slash" color="#FFFFFF" size={24} />
>>>>>>> 07ac53c (committing this now so it doesn't break later)
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        Hackathons
        </Text>
      </TouchableOpacity>
      </Link>

      <Link href="/events" asChild>
      <TouchableOpacity style={styles.tab}>
<<<<<<< HEAD
        <Feather name="calendar" color="#FFFFFF" size={24} />
=======
        <Ionicons name="calendar" color="#FFFFFF" size={24} />
>>>>>>> 07ac53c (committing this now so it doesn't break later)
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        Events
        </Text>
      </TouchableOpacity>
      </Link>

      <Link href="/hackatime" asChild>
      <TouchableOpacity style={styles.tab}>
<<<<<<< HEAD
        <Feather name="clock" color="#FFFFFF" size={24} />
=======
        <Ionicons name="timer" color="#FFFFFF" size={24} />
>>>>>>> 07ac53c (committing this now so it doesn't break later)
        <Text
        style={styles.tabText}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        >
        Hackatime
        </Text>
      </TouchableOpacity>
      </Link>
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
<<<<<<< HEAD
});

// aoskdpoaksdopaksdasdasdasd
=======
});
>>>>>>> 07ac53c (committing this now so it doesn't break later)

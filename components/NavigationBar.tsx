import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const tabs = [
  { href: "/", icon: "home", label: "Home", gradient: ["#667eea", "#764ba2"] },
  {
    href: "/ysws",
    icon: "hammer",
    label: "YSWS",
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    href: "/stats",
    icon: "bar-chart",
    label: "Stats",
    gradient: ["#4facfe", "#00f2fe"],
  },
  {
    href: "/hackathons",
    icon: "code-slash",
    label: "Hackathons",
    gradient: ["#43e97b", "#38f9d7"],
  },
  {
    href: "/events",
    icon: "calendar",
    label: "Events",
    gradient: ["#fa709a", "#fee140"],
  },
  {
    href: "/hackatime",
    icon: "timer",
    label: "Hackatime",
    gradient: ["#a8edea", "#fed6e3"],
  },
  {
    href: "/scrapbook",
    icon: "book-outline",
    label: "My Scrapbook",
    gradient: ["#ffecd2", "#fcb69f"],
  },
  {
    href: "/scraps",
    icon: "book",
    label: "Scrapbook",
    gradient: ["#ff8a80", "#ea80fc"],
  },
  {
    href: "/mail",
    icon: "mail",
    label: "Mail",
    gradient: ["#84fab0", "#8fd3f4"],
  },
  {
    href: "/cdn",
    icon: "cloud-upload",
    label: "CDN",
    gradient: ["#84fab0", "#8fd3f4"],
  },
];

export default function HamburgerMenu() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsMenuOpen(!isMenuOpen);
    Animated.timing(animation, {
      toValue: isMenuOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleMenuItemPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeMenu();
  };

  const menuTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const menuOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      <TouchableOpacity
        style={[
          styles.hamburgerButton,
          isMenuOpen && styles.hamburgerButtonActive,
        ]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <View style={styles.hamburgerButtonInner}>
          <Ionicons
            name={isMenuOpen ? "close" : "menu"}
            size={24}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateY: menuTranslateY }],
                opacity: menuOpacity,
              },
            ]}
          >
            {tabs.map((tab, index) => {
              const selected = pathname === tab.href;
              return (
                <Link href={tab.href as any} asChild key={tab.href}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      selected && styles.menuItemSelected,
                    ]}
                    onPress={handleMenuItemPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          selected && styles.iconContainerSelected,
                        ]}
                      >
                        <Ionicons
                          name={tab.icon as any}
                          color={selected ? "#FFFFFF" : "#8B8B8B"}
                          size={20}
                        />
                      </View>
                      <Text
                        style={[
                          styles.menuText,
                          selected && styles.menuTextSelected,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>
                    {selected && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>
                </Link>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  hamburgerButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  hamburgerButtonActive: {
    transform: [{ scale: 0.95 }],
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 110,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 220,
    maxWidth: 260,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  menuTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#333333",
    width: "100%",
  },
  menuItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  menuItemSelected: {
    backgroundColor: "#2A2A2A",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerSelected: {
    backgroundColor: "#ec3750",
  },
  menuText: {
    color: "#CCCCCC",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  menuTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  selectedIndicator: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#ec3750",
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
});

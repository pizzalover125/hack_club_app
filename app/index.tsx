import NavigationBar from "@/components/NavigationBar";
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Image, Text, View } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
type IconName = keyof typeof Ionicons.glyphMap;

const generateAccentSymbols = () => {
  const icons: IconName[] = ['code', 'terminal', 'flash', 'star'];
  const colors = ["#ec3750", "#ffb700", "#00d084", "#338eda", "#fff"];
  const accents: {
    id: number;
    icon: IconName;
    top: number;
    left: number;
    size: number;
    rotation: number;
    opacity: number;
    color: string;
    blur: number;
  }[] = [];
  for (let i = 0; i < 60; i++) {
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = Math.random() * 16 + 16;
    const rotation = Math.random() * 360;
    const opacity = Math.random() * 0.3 + 0.15;
    const color = colors[Math.floor(Math.random() * colors.length)];
    accents.push({
      id: i,
      icon,
      top: (top / 100) * screenHeight,
      left: (left / 100) * screenWidth,
      size,
      rotation,
      opacity,
      color,
      blur: Math.random() > 0.7 ? 8 : 0,
    });
  }
  return accents;
};

export default function Index() {
  const accents = generateAccentSymbols();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#18122B",
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.7,
        }}
        pointerEvents="none"
      >
        <View
          style={{
            position: "absolute",
            width: screenWidth * 1.5,
            height: screenWidth * 1.5,
            borderRadius: screenWidth,
            backgroundColor: "#ec3750",
            opacity: 0.25,
            top: -screenWidth * 0.4,
            left: -screenWidth * 0.3,
            transform: [{ rotate: "20deg" }],
            filter: "blur(80px)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: screenWidth,
            height: screenWidth,
            borderRadius: screenWidth / 2,
            backgroundColor: "#338eda",
            opacity: 0.18,
            bottom: -screenWidth * 0.3,
            right: -screenWidth * 0.2,
            filter: "blur(60px)",
          }}
        />
      </View>

      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        {accents.map((accent) => (
          <Ionicons
            key={accent.id}
            name={accent.icon}
            size={accent.size}
            color={accent.color}
            style={{
              position: "absolute",
              top: accent.top,
              left: accent.left,
              opacity: accent.opacity,
              transform: [{ rotate: `${accent.rotation}deg` }],
              filter: accent.blur ? `blur(${accent.blur}px)` : undefined,
            }}
          />
        ))}
      </View>

      <View style={{ zIndex: 2, alignItems: "center" }}>
        <Image
          source={{ uri: "https://assets.hackclub.com/icon-rounded.png" }}
          style={{
            width: 120,
            height: 120,
            marginBottom: 24,
          }}
        />
        <Text
          style={{
            fontSize: Math.min(40, Math.max(28, Math.round(0.07 * Math.min(screenWidth, screenHeight)))),
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
            paddingHorizontal: 20,
            textShadowColor: "#000",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 12,
            marginBottom: 12,
          }}
        >
          Welcome to the Hack Club app!
        </Text>
        <Text
          style={{
            color: "#b8b8ff",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 8,
            opacity: 0.85,
          }}
        >
          Build epic projects. Have fun
        </Text>
      </View>

      <NavigationBar />
    </View>

    // this is a test123123123123123
  );
}
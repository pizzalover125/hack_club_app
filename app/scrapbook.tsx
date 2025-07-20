import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Reaction {
  name: string;
  usersReacted: string[];
  url?: string;
  char?: string;
}

interface Post {
  id: string;
  timestamp: number;
  slackUrl: string;
  postedAt: string;
  text: string;
  attachments: string[];
  mux: string[];
  reactions: Reaction[];
}

interface Profile {
  id: string;
  slackID: string;
  username: string;
  streakCount: number;
  maxStreaks: number;
  website?: string;
  github?: string;
  avatar?: string;
  timezone: string;
  pronouns?: string;
}

interface ScrapbookData {
  profile: Profile;
  posts: Post[];
}

const { width } = Dimensions.get("window");

export default function ScrapbookViewer() {
  const [username, setUsername] = useState("");
  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [scrapbookData, setScrapbookData] = useState<ScrapbookData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("scrapbookUsername").then((value) => {
      if (value) {
        setStoredUsername(value);
        fetchScrapbookData(value);
      } else {
        setInputVisible(true);
      }
    });
  }, []);

  const fetchScrapbookData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://scrapbook.hackclub.com/api/users/${id}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setScrapbookData(data);
    } catch (err) {
      setError("Failed to load scrapbook data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    await AsyncStorage.setItem("scrapbookUsername", username);
    setStoredUsername(username);
    setInputVisible(false);
    fetchScrapbookData(username);
  };

  const handleChangeId = () => {
    setInputVisible(true);
    setScrapbookData(null);
    setError(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const renderReactions = (reactions: Reaction[]) => {
    if (!reactions || reactions.length === 0) return null;
    return (
      <View style={styles.reactionsContainer}>
        {reactions.map((reaction, index) => (
          <View key={index} style={styles.reactionBadge}>
            <Text
              style={reaction.char ? styles.reactionEmoji : styles.reactionName}
            >
              {reaction.char || reaction.name}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postDate}>{formatDate(post.timestamp)}</Text>
        <TouchableOpacity onPress={() => handleLinkPress(post.slackUrl)}>
          <Text style={styles.slackLink}>View in Slack</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.postText}>{post.text}</Text>
      {post.attachments?.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {post.attachments.map((attachment, index) => (
            <Image
              key={index}
              source={{ uri: attachment }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
      {renderReactions(post.reactions)}
    </View>
  );

  if (inputVisible) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.title}>Scrapbook</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter your Scrapbook username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. ChessThinker"
            placeholderTextColor="#aaa"
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button title="Save" onPress={handleSave} color="#ec3750" />
        </View>
        <NavigationBar />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ec3750" />
        <Text style={styles.loadingText}>Loading scrapbook...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={() => storedUsername && fetchScrapbookData(storedUsername)}
          color="#ec3750"
        />
      </View>
    );
  }

  if (!scrapbookData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No scrapbook data available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Scrapbook</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {scrapbookData.profile.avatar && (
              <Image
                source={{ uri: scrapbookData.profile.avatar }}
                style={styles.avatar}
              />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.username}>
                {scrapbookData.profile.username}
              </Text>
              <Text style={styles.streakInfo}>
                Current Streak: {scrapbookData.profile.streakCount} • Max
                Streak: {scrapbookData.profile.maxStreaks}
              </Text>
            </View>
          </View>
          <View style={styles.profileLinks}>
            {scrapbookData.profile.website && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleLinkPress(scrapbookData.profile.website!)}
              >
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
            {scrapbookData.profile.github && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleLinkPress(scrapbookData.profile.github!)}
              >
                <Text style={styles.linkText}>GitHub</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.sectionTitle}>
          Posts ({scrapbookData.posts.length})
        </Text>
        {scrapbookData.posts.map(renderPost)}
        <View style={styles.headerContainer}>
          <Text style={styles.slackIdText}>Username: {storedUsername}</Text>
          <Button
            title="Change Username"
            onPress={handleChangeId}
            color="#ec3750"
          />
        </View>
        <View style={styles.navbarSpacer} />
      </ScrollView>
      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  profileCard: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  profileInfo: { flex: 1 },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  streakInfo: { fontSize: 14, color: "#CCCCCC" },
  profileLinks: { flexDirection: "row", gap: 12 },
  linkButton: {
    backgroundColor: "#ec3750",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  postDate: { fontSize: 12, color: "#CCCCCC" },
  slackLink: { fontSize: 12, color: "#ec3750", fontWeight: "500" },
  postText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 12,
  },
  attachmentsContainer: { marginBottom: 12 },
  attachmentImage: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  reactionsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reactionBadge: {
    backgroundColor: "#333333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: { fontSize: 14 },
  reactionName: { fontSize: 12, color: "#CCCCCC" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#CCCCCC" },
  errorText: { fontSize: 16, color: "#ec3750", textAlign: "center" },
  navbarSpacer: { height: 90 },
  inputContainer: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  inputLabel: {
    color: "#FFFFFF",
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#23272f",
    color: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  slackIdText: { color: "#CCCCCC", marginBottom: 10, fontSize: 14 },
  headerContainer: { alignItems: "center", marginBottom: 20 },
});

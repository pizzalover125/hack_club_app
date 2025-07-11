import NavigationBar from "@/components/NavigationBar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  user: {
    username: string;
    avatar?: string;
    website?: string;
    github?: string;
  };
}

const { width } = Dimensions.get("window");

export default function ScrapbookFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("https://scrapbook.hackclub.com/api/posts");
        const data = await res.json();
        setPosts(data);
      } catch (e) {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderReactions = (reactions: Reaction[]) => {
    if (!reactions.length) return null;
    return (
      <View style={styles.reactionsContainer}>
        {reactions.map((reaction, index) => (
          <View key={index} style={styles.reactionBadge}>
            <Text style={reaction.char ? styles.reactionEmoji : styles.reactionName}>
              {reaction.char || reaction.name}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.userHeader}>
        {post.user.avatar && (
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        )}
        <View>
          <Text style={styles.username}>{post.user.username}</Text>
          <Text style={styles.postDate}>{formatDate(post.timestamp)}</Text>
        </View>
      </View>
      <Text style={styles.postText}>{post.text}</Text>
      {post.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {post.attachments.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
      {renderReactions(post.reactions)}
      <TouchableOpacity onPress={() => handleLinkPress(post.slackUrl)}>
        <Text style={styles.slackLink}>View in Slack</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ec3750" />
          <Text style={styles.loadingText}>Loading posts…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Scrapbook Feed</Text>
          {posts.map(renderPost)}
          <View style={styles.navbarSpacer} />
        </ScrollView>
      )}
      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 20 },
  postCard: { backgroundColor: "#1E1E1E", padding: 16, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: "#333333" },
  userHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  username: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  postDate: { fontSize: 12, color: "#AAAAAA" },
  postText: { fontSize: 15, color: "#FFFFFF", lineHeight: 22, marginTop: 8 },
  attachmentsContainer: { marginTop: 10 },
  attachmentImage: { width: width - 64, height: 200, borderRadius: 8, marginTop: 8 },
  reactionsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 6 },
  reactionBadge: { backgroundColor: "#333333", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  reactionEmoji: { fontSize: 14 },
  reactionName: { fontSize: 12, color: "#CCCCCC" },
  slackLink: { color: "#ec3750", marginTop: 12, fontSize: 14 },
  loadingText: { color: "#CCCCCC", marginTop: 12 },
  errorText: { color: "#ec3750", fontSize: 16, textAlign: "center" },
  navbarSpacer: { height: 80 }
});

import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface MailItem {
  id: string;
  type: string;
  path: string;
  public_url: string;
  status: string;
  tags: string[];
  title?: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  tracking_link?: string;
  description?: string;
  original_id?: string;
  subtype?: string;
}

interface MailData {
  mail: MailItem[];
}

const { width } = Dimensions.get("window");

export default function MailViewer() {
  const [apiKey, setApiKey] = useState("");
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [mailData, setMailData] = useState<MailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hackclubMailApiKey").then((value) => {
      if (value) {
        setStoredApiKey(value);
        fetchMailData(value);
      } else {
        setInputVisible(true);
      }
    });
  }, []);

  const fetchMailData = async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://mail.hackclub.com/api/public/v1/mail", {
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMailData(data);
    } catch (err) {
      setError("Failed to load mail data. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await AsyncStorage.setItem("hackclubMailApiKey", apiKey);
    setStoredApiKey(apiKey);
    setInputVisible(false);
    fetchMailData(apiKey);
  };

  const handleChangeKey = () => {
    setInputVisible(true);
    setMailData(null);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "shipped":
      case "shipped!":
      case "shipped via usps!":
      case "printed":
      case "mailed!":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "received":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;
    return (
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagBadge}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMailItem = (item: MailItem) => (
    <View key={item.id} style={styles.mailCard}>
      <View style={styles.mailHeader}>
        <View style={styles.mailHeaderLeft}>
          <Text style={styles.mailTitle}>{item.title || "Untitled"}</Text>
          <Text style={styles.mailType}>{item.type.replace(/_/g, " ")}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.mailDescription}>{item.description}</Text>
      )}
      
      {renderTags(item.tags)}
      
      <View style={styles.mailDates}>
        <Text style={styles.dateText}>Created: {formatDate(item.created_at)}</Text>
        <Text style={styles.dateText}>Updated: {formatDate(item.updated_at)}</Text>
      </View>
      
      <View style={styles.mailActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleLinkPress(item.public_url)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        
        {item.tracking_link && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.trackingButton]} 
            onPress={() => handleLinkPress(item.tracking_link!)}
          >
            <Text style={styles.actionButtonText}>Track Package</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {item.tracking_number && (
        <View style={styles.trackingInfo}>
          <Text style={styles.trackingNumber}>Tracking: {item.tracking_number}</Text>
        </View>
      )}
    </View>
  );

  if (inputVisible) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.title}>Mail Viewer</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter your API Key</Text>
            <Text
            style={styles.inputHint}
            onPress={() => Linking.openURL("https://mail.hackclub.com/my/api_keys")}
            >
            Get your API key from{" "}
            <Text style={{ color: "#4FC3F7", textDecorationLine: "underline" }}>
              https://mail.hackclub.com/my/api_keys
            </Text>
            .
            </Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="th_apk_live_..."
            placeholderTextColor="#aaa"
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
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
        <Text style={styles.loadingText}>Loading mail data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Try Again" 
          onPress={() => storedApiKey && fetchMailData(storedApiKey)} 
          color="#ec3750" 
        />
        <View style={styles.changeKeyContainer}>
          <Button title="Change API Key" onPress={handleChangeKey} color="#6c757d" />
        </View>
      </View>
    );
  }

  if (!mailData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No mail data available</Text>
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
        <Text style={styles.title}>Mail Viewer</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Mail Summary</Text>
          <Text style={styles.summaryText}>
            Total Items: {mailData.mail.length}
          </Text>
          <Text style={styles.summaryText}>
            Shipped: {mailData.mail.filter(item => 
              item.status.toLowerCase().includes("shipped") || 
              item.status.toLowerCase().includes("mailed")
            ).length}
          </Text>
          <Text style={styles.summaryText}>
            Pending: {mailData.mail.filter(item => 
              item.status.toLowerCase().includes("pending")
            ).length}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Mail Items ({mailData.mail.length})</Text>
        {mailData.mail.map(renderMailItem)}
        
        <View style={styles.headerContainer}>
          <Text style={styles.apiKeyText}>API Key: {storedApiKey?.substring(0, 20)}...</Text>
          <Button title="Change API Key" onPress={handleChangeKey} color="#ec3750" />
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
    backgroundColor: "#121212" 
  },
  summaryCard: { 
    backgroundColor: "#1E1E1E", 
    padding: 20, 
    marginBottom: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#333333" 
  },
  summaryTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    marginBottom: 12 
  },
  summaryText: { 
    fontSize: 14, 
    color: "#CCCCCC", 
    marginBottom: 4 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    marginBottom: 16 
  },
  mailCard: { 
    backgroundColor: "#1E1E1E", 
    padding: 16, 
    marginBottom: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#333333" 
  },
  mailHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 12 
  },
  mailHeaderLeft: { 
    flex: 1, 
    marginRight: 12 
  },
  mailTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    marginBottom: 4 
  },
  mailType: { 
    fontSize: 12, 
    color: "#CCCCCC", 
    textTransform: "capitalize" 
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statusText: { 
    fontSize: 12, 
    color: "#FFFFFF", 
    fontWeight: "600" 
  },
  mailDescription: { 
    fontSize: 14, 
    color: "#CCCCCC", 
    lineHeight: 20, 
    marginBottom: 12 
  },
  tagsContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8, 
    marginBottom: 12 
  },
  tagBadge: { 
    backgroundColor: "#333333", 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  tagText: { 
    fontSize: 12, 
    color: "#CCCCCC" 
  },
  mailDates: { 
    marginBottom: 12 
  },
  dateText: { 
    fontSize: 12, 
    color: "#CCCCCC", 
    marginBottom: 2 
  },
  mailActions: { 
    flexDirection: "row", 
    gap: 12 
  },
  actionButton: { 
    backgroundColor: "#ec3750", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8, 
    flex: 1 
  },
  trackingButton: { 
    backgroundColor: "#28a745" 
  },
  actionButtonText: { 
    color: "#FFFFFF", 
    fontSize: 14, 
    fontWeight: "600", 
    textAlign: "center" 
  },
  trackingInfo: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: "#333333" 
  },
  trackingNumber: { 
    fontSize: 12, 
    color: "#CCCCCC", 
    fontFamily: "monospace" 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: "#CCCCCC" 
  },
  errorText: { 
    fontSize: 16, 
    color: "#ec3750", 
    textAlign: "center" 
  },
  changeKeyContainer: { 
    marginTop: 12 
  },
  navbarSpacer: { 
    height: 90 
  },
  inputContainer: { 
    width: "85%", 
    backgroundColor: "#1E1E1E", 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: "#333333" 
  },
  inputLabel: { 
    color: "#FFFFFF", 
    marginBottom: 8, 
    fontSize: 16, 
    fontWeight: "600" 
  },
  inputHint: { 
    color: "#CCCCCC", 
    fontSize: 14, 
    marginBottom: 12 
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
    borderColor: "#333333" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    marginBottom: 20 
  },
  apiKeyText: { 
    color: "#CCCCCC", 
    marginBottom: 10, 
    fontSize: 14 
  },
  headerContainer: { 
    alignItems: "center", 
    marginBottom: 20 
  }
});
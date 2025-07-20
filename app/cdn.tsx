import NavigationBar from "@/components/NavigationBar";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UploadedFile {
  deployedUrl?: string;
  url?: string;
  file?: string;
  filename?: string;
  sha?: string;
  size?: number;
  localUri: string;
  type: "image" | "video";
}

const { width } = Dimensions.get("window");

export default function MediaUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photo library to upload media."
      );
      return false;
    }
    return true;
  };

  const pickMedia = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        uploadMedia(result.assets);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick media from library");
    }
  };

  const uploadMedia = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setLoading(true);
    setError(null);

    try {
      const uploadPromises = assets.map(async (asset, index) => {
        const fileExtension = asset.type === "video" ? "mp4" : "jpg";
        const fileName =
          asset.fileName || `upload_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        formData.append("reqtype", "fileupload");
        formData.append("fileToUpload", {
          uri: asset.uri,
          type:
            asset.mimeType ||
            (asset.type === "video" ? "video/mp4" : "image/jpeg"),
          name: fileName,
        } as any);

        const tempUploadResponse = await fetch(
          "https://catbox.moe/user/api.php",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!tempUploadResponse.ok) {
          throw new Error(
            `Catbox upload failed with status: ${tempUploadResponse.status}`
          );
        }

        const tempImageUrl = await tempUploadResponse.text();

        if (!tempImageUrl.startsWith("http")) {
          throw new Error(`Invalid URL received from Catbox: ${tempImageUrl}`);
        }

        const hackClubResponse = await fetch(
          "https://cdn.hackclub.com/api/v3/new",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer beans",
              "Content-Type": "application/json",
            },
            body: JSON.stringify([tempImageUrl.trim()]),
          }
        );

        if (!hackClubResponse.ok) {
          const hackClubText = await hackClubResponse.text();
          throw new Error(
            `Hack Club CDN error! status: ${hackClubResponse.status}, body: ${hackClubText}`
          );
        }

        const hackClubData = await hackClubResponse.json();

        // Return the first file from the response
        return {
          ...hackClubData.files[0],
          localUri: asset.uri,
          type: asset.type === "video" ? "video" : "image",
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedFiles]);
    } catch (err) {
      setError("Failed to upload media. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert("Copied!", "URL copied to clipboard");
  };

  const deleteFile = (index: number) => {
    Alert.alert(
      "Delete File",
      "Are you sure you want to remove this file from the list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to clear all uploaded files?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setUploadedFiles([]),
        },
      ]
    );
  };

  const renderUploadedFile = (file: UploadedFile, index: number) => (
    <View key={`${file.sha}-${index}`} style={styles.fileCard}>
      <View style={styles.fileHeader}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{file.file}</Text>
          <Text style={styles.fileSize}>
            {((file.size ?? 0) / 1024).toFixed(1)} KB • {file.type}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteFile(index)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {file.type === "image" ? (
        <Image
          source={{ uri: file.localUri }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoText}>📹 Video File</Text>
          <Text style={styles.videoSubtext}>Tap URL to copy</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.urlContainer}
        onPress={() => copyToClipboard(file.deployedUrl ?? "")}
      >
        <Text style={styles.urlLabel}>CDN URL (tap to copy):</Text>
        <Text style={styles.urlText} numberOfLines={2}>
          {file.deployedUrl}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>CDN</Text>
        <Text style={styles.subtitle}>
          Upload photos and videos to Hack Club CDN
        </Text>

        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              loading && styles.uploadButtonDisabled,
            ]}
            onPress={pickMedia}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>
              {loading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec3750" />
              <Text style={styles.loadingText}>Uploading to CDN...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="Retry" onPress={pickMedia} color="#ec3750" />
            </View>
          )}
        </View>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>
                Uploaded Files ({uploadedFiles.length})
              </Text>
              <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {uploadedFiles.map(renderUploadedFile)}
          </>
        )}

        {uploadedFiles.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No files uploaded yet. Select media from your gallery to get
              started!
            </Text>
          </View>
        )}

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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 24,
  },
  uploadSection: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 24,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#ec3750",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  uploadButtonDisabled: {
    backgroundColor: "#555555",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  errorContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ec3750",
    textAlign: "center",
    marginBottom: 12,
  },
  logsSection: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 24,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: "#000000",
    padding: 12,
    borderRadius: 8,
  },
  logText: {
    fontSize: 12,
    color: "#00FF00",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 2,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  clearButton: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  fileCard: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  fileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#CCCCCC",
  },
  deleteButton: {
    backgroundColor: "#333333",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  videoPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#333333",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  videoText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  videoSubtext: {
    fontSize: 12,
    color: "#CCCCCC",
  },
  urlContainer: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
  },
  urlLabel: {
    fontSize: 12,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  urlText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyState: {
    backgroundColor: "#1E1E1E",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 24,
  },
  navbarSpacer: { height: 90 },
});

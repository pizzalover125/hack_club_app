import NavigationBar from "@/components/NavigationBar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [slackData, setSlackData] = useState<any>(null);
  const [hcbData, setHcbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slackResponse, hcbResponse] = await Promise.all([
          fetch("https://hackclub.com/api/slack/"),
          fetch("https://hcb.hackclub.com/stats"),
        ]);

        const slackResult = await slackResponse.json();
        const hcbResult = await hcbResponse.json();

        setSlackData(slackResult);
        setHcbData(hcbResult);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const slackStats = [
    { label: "Total Members", value: slackData?.total_members_count },
    { label: "Messages Sent (1d)", value: slackData?.messages_count_1d },
    { label: "Active Users (28d)", value: slackData?.active_users_28d },
    { label: "Active Users (1d)", value: slackData?.active_users_1d },
  ];

  const hcbStats = [
    { label: "Total Raised", value: hcbData?.raised ? `$${(hcbData.raised / 100).toLocaleString()}` : "N/A" },
    { label: "Transaction Volume", value: hcbData?.all.transactions_volume ? `$${(hcbData.all.transactions_volume / 100).toLocaleString()}` : "N/A" },
    { label: "Projects", value: hcbData?.events_count },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ec3750" />
        <Text style={styles.loadingText}>Loading stats...</Text>
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
        {[...slackStats, ...hcbStats].map((stat, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.value}>{stat.value?.toLocaleString() || "N/A"}</Text>
          </View>
        ))}
        <View style={styles.navbarSpacer} />
      </ScrollView>
      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#333333",
  },
  label: {
    fontSize: 12,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  value: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  navbarSpacer: {
    height: 90,
  },
});
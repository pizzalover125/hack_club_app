import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface Language {
  name: string;
  total_seconds: number;
  text: string;
  hours: number;
  minutes: number;
  percent: number;
  digital: string;
}

interface StatsData {
  username: string;
  user_id: string;
  is_coding_activity_visible: boolean;
  is_other_usage_visible: boolean;
  status: string;
  start: string;
  end: string;
  range: string;
  human_readable_range: string;
  total_seconds: number;
  daily_average: number;
  human_readable_total: string;
  human_readable_daily_average: string;
  languages: Language[];
}

interface ApiResponse {
  data: StatsData;
  trust_factor: {
    trust_level: string;
    trust_value: number;
  };
}

interface WeeklyData {
  date: string;
  hours: number;
}

interface MonthlyData {
  weekStart: string;
  weekEnd: string;
  hours: number;
  weekLabel: string;
}

interface ThreeMonthData {
  weekStart: string;
  weekEnd: string;
  hours: number;
  weekLabel: string;
}

export default function Index() {
  const [slackId, setSlackId] = useState("");
  const [storedSlackId, setStoredSlackId] = useState<string | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [allTimeStats, setAllTimeStats] = useState<StatsData | null>(null);
  const [todayStats, setTodayStats] = useState<StatsData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [threeMonthData, setThreeMonthData] = useState<ThreeMonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("slackId").then((value) => {
      if (value) {
        setStoredSlackId(value);
        fetchStats(value);
      } else {
        setInputVisible(true);
      }
    });
  }, []);

  const fetchWeeklyStats = async (id: string) => {
    const weeklyData: WeeklyData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const startDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const endDate = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
      
      try {
        const response = await fetch(
          `https://hackatime.hackclub.com/api/v1/users/${id}/stats?start_date=${startDate}&end_date=${endDate}`
        );
        
        if (response.ok) {
          const data: ApiResponse = await response.json();
          const hours = data.data.total_seconds / 3600;
          weeklyData.push({
            date: startDate,
            hours: Math.round(hours * 100) / 100, 
          });
        } else {
          weeklyData.push({
            date: startDate,
            hours: 0,
          });
        }
      } catch (err) {
        console.error(`Error fetching data for ${startDate}:`, err);
        weeklyData.push({
          date: startDate,
          hours: 0,
        });
      }
    }
    
    setWeeklyData(weeklyData);
  };

  const fetchMonthlyStats = async (id: string) => {
    const monthlyData: MonthlyData[] = [];
    const today = new Date();
    
    // Get the start of the current week (Monday)
    const getCurrentWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      return new Date(d.setDate(diff));
    };
    
    const currentWeekStart = getCurrentWeekStart(today);
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startDate = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
      const endDate = `${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}-${weekEnd.getDate()}`;
      
      try {
        const response = await fetch(
          `https://hackatime.hackclub.com/api/v1/users/${id}/stats?start_date=${startDate}&end_date=${endDate}`
        );
        
        if (response.ok) {
          const data: ApiResponse = await response.json();
          const hours = data.data.total_seconds / 3600;
          
          // Create week label (e.g., "Jan 15")
          const weekLabel = weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          monthlyData.push({
            weekStart: startDate,
            weekEnd: endDate,
            hours: Math.round(hours * 100) / 100,
            weekLabel: weekLabel,
          });
        } else {
          const weekLabel = weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          monthlyData.push({
            weekStart: startDate,
            weekEnd: endDate,
            hours: 0,
            weekLabel: weekLabel,
          });
        }
      } catch (err) {
        console.error(`Error fetching data for week ${startDate}:`, err);
        const weekLabel = weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        monthlyData.push({
          weekStart: startDate,
          weekEnd: endDate,
          hours: 0,
          weekLabel: weekLabel,
        });
      }
    }
    
    setMonthlyData(monthlyData);
  };

  const fetchThreeMonthStats = async (id: string) => {
    const threeMonthData: ThreeMonthData[] = [];
    const today = new Date();
    
    // Get the start of the current week (Monday)
    const getCurrentWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      return new Date(d.setDate(diff));
    };
    
    const currentWeekStart = getCurrentWeekStart(today);
    
    // Fetch data for the past 12 weeks (3 months)
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startDate = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
      const endDate = `${weekEnd.getFullYear()}-${weekEnd.getMonth() + 1}-${weekEnd.getDate()}`;
      
      try {
        const response = await fetch(
          `https://hackatime.hackclub.com/api/v1/users/${id}/stats?start_date=${startDate}&end_date=${endDate}`
        );
        
        if (response.ok) {
          const data: ApiResponse = await response.json();
          const hours = data.data.total_seconds / 3600;
          
          // Create week label - show every 2nd week to avoid crowding
          const weekLabel = i % 2 === 0 ? weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }) : '';
          
          threeMonthData.push({
            weekStart: startDate,
            weekEnd: endDate,
            hours: Math.round(hours * 100) / 100,
            weekLabel: weekLabel,
          });
        } else {
          const weekLabel = i % 2 === 0 ? weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }) : '';
          
          threeMonthData.push({
            weekStart: startDate,
            weekEnd: endDate,
            hours: 0,
            weekLabel: weekLabel,
          });
        }
      } catch (err) {
        console.error(`Error fetching data for week ${startDate}:`, err);
        const weekLabel = i % 2 === 0 ? weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }) : '';
        
        threeMonthData.push({
          weekStart: startDate,
          weekEnd: endDate,
          hours: 0,
          weekLabel: weekLabel,
        });
      }
    }
    
    setThreeMonthData(threeMonthData);
  };

  const fetchStats = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const allTimeResponse = await fetch(`https://hackatime.hackclub.com/api/v1/users/${id}/stats`);
      if (!allTimeResponse.ok) {
        throw new Error(`Failed to fetch all-time stats: ${allTimeResponse.status}`);
      }
      const allTimeData: ApiResponse = await allTimeResponse.json();
      setAllTimeStats(allTimeData.data);

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const todayDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const tomorrowDate = `${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;
      
      const todayResponse = await fetch(`https://hackatime.hackclub.com/api/v1/users/${id}/stats?start_date=${todayDate}&end_date=${tomorrowDate}`);
      if (!todayResponse.ok) {
        throw new Error(`Failed to fetch today's stats: ${todayResponse.status}`);
      }
      const todayData: ApiResponse = await todayResponse.json();
      setTodayStats(todayData.data);

      await fetchWeeklyStats(id);
      await fetchMonthlyStats(id);
      await fetchThreeMonthStats(id);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
      Alert.alert("Error", "Failed to fetch stats. Please check your Slack ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!slackId.trim()) {
      Alert.alert("Error", "Please enter a valid Slack ID");
      return;
    }

    await AsyncStorage.setItem("slackId", slackId);
    setStoredSlackId(slackId);
    setInputVisible(false);
    fetchStats(slackId);
  };

  const handleChangeId = () => {
    setInputVisible(true);
    setAllTimeStats(null);
    setTodayStats(null);
    setWeeklyData([]);
    setMonthlyData([]);
    setThreeMonthData([]);
    setError(null);
  };

  const getFavoriteLanguage = (stats: StatsData | null) => {
    if (!stats || !stats.languages.length) return "N/A";
    const topLanguage = stats.languages.find(lang => lang.total_seconds > 0);
    return topLanguage ? topLanguage.name : "N/A";
  };

  const hackatimeStats = [
    { label: "Total Time (All Time)", value: allTimeStats?.human_readable_total || "N/A" },
    { label: "Daily Average", value: allTimeStats?.human_readable_daily_average || "N/A" },
    { label: "Favorite Language", value: getFavoriteLanguage(allTimeStats) },
    { label: "Total Time (Today)", value: todayStats?.human_readable_total || "0m" },
  ];

  const getWeeklyChartData = () => {
    if (weeklyData.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0, 0],
          strokeWidth: 3,
        }]
      };
    }

    const labels = weeklyData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return {
      labels,
      datasets: [{
        data: weeklyData.map(item => item.hours),
        strokeWidth: 3,
      }]
    };
  };

  const getMonthlyChartData = () => {
    if (monthlyData.length === 0) {
      return {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [{
          data: [0, 0, 0, 0],
          strokeWidth: 3,
        }]
      };
    }

    return {
      labels: monthlyData.map(item => item.weekLabel),
      datasets: [{
        data: monthlyData.map(item => item.hours),
        strokeWidth: 3,
      }]
    };
  };

  const getThreeMonthChartData = () => {
    if (threeMonthData.length === 0) {
      return {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9", "Week 10", "Week 11", "Week 12"],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          strokeWidth: 3,
        }]
      };
    }

    return {
      labels: threeMonthData.map(item => item.weekLabel),
      datasets: [{
        data: threeMonthData.map(item => item.hours),
        strokeWidth: 3,
      }]
    };
  };

  const chartConfig = {
    backgroundColor: "#1E1E1E",
    backgroundGradientFrom: "#1E1E1E",
    backgroundGradientTo: "#1E1E1E",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(236, 55, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#ec3750"
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#333333",
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  if (inputVisible) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Hackatime</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter your Slack ID</Text>
            <TextInput
              value={slackId}
              onChangeText={setSlackId}
              placeholder="e.g. U12345678"
              placeholderTextColor="#aaa"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Save"
              onPress={handleSave}
              disabled={!slackId.trim()}
              color="#ec3750"
            />
          </View>
        </View>
        <NavigationBar />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ec3750" />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => storedSlackId && fetchStats(storedSlackId)} color="#ec3750" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        {hackatimeStats.map((stat, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.value}>{stat.value}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.label}>Coding Time - Past 7 Days</Text>
            <View style={styles.chartContainer}>
            <LineChart
              data={getWeeklyChartData()}
              width={screenWidth - 72} 
              height={220}
              chartConfig={{
              ...chartConfig,
              propsForLabels: {
                ...chartConfig.propsForLabels,
                fontFamily: "System", 
                fontWeight: "bold",
              },
              }}
              style={styles.chart}
              bezier
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              yAxisSuffix="h"
              segments={4}
            />
            </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Coding Time - Past 4 Weeks</Text>
            <View style={styles.chartContainer}>
            <LineChart
              data={getMonthlyChartData()}
              width={screenWidth - 72} 
              height={220}
              chartConfig={{
              ...chartConfig,
              propsForLabels: {
                ...chartConfig.propsForLabels,
                fontFamily: "System", 
                fontWeight: "bold",
              },
              }}
              style={styles.chart}
              bezier
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              yAxisSuffix="h"
              segments={4}
            />
            </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Coding Time - Past 3 Months</Text>
            <View style={styles.chartContainer}>
            <LineChart
              data={getThreeMonthChartData()}
              width={screenWidth - 72} 
              height={220}
              chartConfig={{
              ...chartConfig,
              propsForLabels: {
                ...chartConfig.propsForLabels,
                fontFamily: "System", 
                fontWeight: "bold",
              },
              }}
              style={styles.chart}
              bezier
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              yAxisSuffix="h"
              segments={4}
            />
            </View>
        </View>

        
        {allTimeStats && allTimeStats.languages.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Top Languages (All Time)</Text>
            {allTimeStats.languages.slice(0, 5).map((lang, index) => (
              lang.total_seconds > 0 && (
                <View key={index} style={styles.languageRow}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageTime}>
                    {lang.text} ({lang.percent.toFixed(1)}%)
                  </Text>
                </View>
              )
            ))}
          </View>
        )}
        <View style={styles.headerContainer}>
          <Text style={styles.slackIdText}>Slack ID: {storedSlackId}</Text>
          <Button
            title="Change ID"
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  slackIdText: {
    color: "#CCCCCC",
    marginBottom: 10,
    fontSize: 14,
  },
  inputContainer: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  languageName: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  languageTime: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  errorText: {
    color: "#ec3750",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },
  navbarSpacer: {
    height: 90,
  },
});
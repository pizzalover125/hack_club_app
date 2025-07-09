import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Clock, Pin, PinOff, Search, Share2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const countryToFlag = (country: string) => {
    if (!country) return "";
    const code = country
        .toUpperCase()
        .replace(/ /g, "")
        .replace(/[^A-Z]/g, "");
    if (code.length !== 2) return "";
    return String.fromCodePoint(
        0x1f1e6 + code.charCodeAt(0) - 65,
        0x1f1e6 + code.charCodeAt(1) - 65
    );
};

export default function Hackathons() {
    const [hackathons, setHackathons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [pinnedHackathons, setPinnedHackathons] = useState<string[]>([]);
    const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedPins = await AsyncStorage.getItem('pinnedHackathons');
                if (savedPins) {
                    setPinnedHackathons(JSON.parse(savedPins));
                }

                const response = await fetch("https://dash.hackathons.hackclub.com/api/v1/hackathons");
                const data = await response.json();
                setHackathons(data.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const updateCountdowns = () => {
            const newCountdowns: {[key: string]: string} = {};
            
            hackathons.forEach(hackathon => {
                if (pinnedHackathons.includes(hackathon.id)) {
                    const now = new Date();
                    const startsAt = new Date(hackathon.starts_at);
                    const endsAt = new Date(hackathon.ends_at);

                    if (startsAt > now) {
                        const timeDiff = startsAt.getTime() - now.getTime();
                        
                        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                        
                        if (days > 0) {
                            newCountdowns[hackathon.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                        } else if (hours > 0) {
                            newCountdowns[hackathon.id] = `${hours}h ${minutes}m ${seconds}s`;
                        } else {
                            newCountdowns[hackathon.id] = `${minutes}m ${seconds}s`;
                        }
                    }
                }
            });
            
            setCountdowns(newCountdowns);
        };

        if (hackathons.length > 0 && pinnedHackathons.length > 0) {
            updateCountdowns();
            const interval = setInterval(updateCountdowns, 1000);
            return () => clearInterval(interval);
        }
    }, [hackathons, pinnedHackathons]);

    const getHackathonStatus = (hackathon: any) => {
        const now = new Date();
        const startsAt = new Date(hackathon.starts_at);
        const endsAt = new Date(hackathon.ends_at);

        if (endsAt < now) {
            return "ended";
        } else if (hackathon.location.city) {
            return "in-person";
        } else {
            return "online";
        }
    };

    const togglePin = async (hackathonId: string) => {
        const newPinnedHackathons = pinnedHackathons.includes(hackathonId)
            ? pinnedHackathons.filter(id => id !== hackathonId)
            : [...pinnedHackathons, hackathonId];
        
        setPinnedHackathons(newPinnedHackathons);
        
        try {
            await AsyncStorage.setItem('pinnedHackathons', JSON.stringify(newPinnedHackathons));
        } catch (error) {
            console.error("Error saving pinned hackathons:", error);
        }
    };

    const handleShare = async (hackathon: any) => {
        try {
            const flagEmoji = countryToFlag(hackathon.location.country_code || hackathon.location.country);
            const location = hackathon.location.city || "Online";
            const country = hackathon.location.country || "";
            const status = getHackathonStatus(hackathon);
            const statusText = status === "ended" ? "Ended" : status === "in-person" ? "In-person" : "Online";
            
            const shareContent = {
                title: hackathon.name,
                message: `Check out this hackathon: ${hackathon.name}\n\n📅 ${new Date(hackathon.starts_at).toLocaleDateString()} - ${new Date(hackathon.ends_at).toLocaleDateString()}\n📍 ${flagEmoji} ${location}, ${country}\n🏷️ ${statusText}${hackathon.website ? `\n\nLearn more: ${hackathon.website}` : ''}`,
                url: hackathon.website || '',
            };

            const result = await Share.share(shareContent);
            
            if (result.action === Share.sharedAction) {
                console.log('Hackathon shared successfully');
            } else if (result.action === Share.dismissedAction) {
                console.log('Share dialog dismissed');
            }
        } catch (error) {
            console.error('Error sharing hackathon:', error);
            Alert.alert('Error', 'Failed to share hackathon details');
        }
    };

    const filteredHackathons = hackathons.filter((hackathon) =>
        hackathon.location.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedHackathons = [...filteredHackathons].sort((a, b) => {
        const aStatus = getHackathonStatus(a);
        const bStatus = getHackathonStatus(b);
        const aIsEnded = aStatus === "ended";
        const bIsEnded = bStatus === "ended";
        
        // First, separate ended from non-ended
        if (aIsEnded && !bIsEnded) return 1;
        if (!aIsEnded && bIsEnded) return -1;
        
        // For non-ended hackathons, prioritize pinned ones
        if (!aIsEnded && !bIsEnded) {
            const aIsPinned = pinnedHackathons.includes(a.id);
            const bIsPinned = pinnedHackathons.includes(b.id);
            
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;
        }
        
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ec3750" />
                <Text style={styles.loadingText}>Loading hackathons...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Search color="#888" size={20} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search by city"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {sortedHackathons.map((hackathon) => {
                    const status = getHackathonStatus(hackathon);
                    const isEnded = status === "ended";
                    const isPinned = pinnedHackathons.includes(hackathon.id);
                    const flagEmoji = countryToFlag(hackathon.location.country_code || hackathon.location.country);

                    return (
                        <TouchableOpacity
                            key={hackathon.id}
                            style={[
                                styles.card,
                                isEnded && styles.endedCard,
                                isPinned && styles.pinnedCard
                            ]}
                            onPress={() => hackathon.website && Linking.openURL(hackathon.website)}
                            disabled={isEnded}
                        >
                            <View style={styles.cardTop}>
                                <Image 
                                    source={{ uri: hackathon.logo_url }} 
                                    style={[
                                        styles.logo,
                                        isEnded && styles.grayedImage
                                    ]} 
                                />
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => handleShare(hackathon)}
                                    >
                                        <Share2 color={isEnded ? "#666666" : "#CCCCCC"} size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.pinButton}
                                        onPress={() => togglePin(hackathon.id)}
                                    >
                                        {isPinned ? (
                                            <Pin color="#ec3750" size={20} fill="#ec3750" />
                                        ) : (
                                            <PinOff color="#888" size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                            <View style={styles.cardHeader}>
                                <Text style={[
                                    styles.name,
                                    isEnded && styles.grayedText
                                ]}>
                                    {hackathon.name}
                                </Text>
                                {isPinned && (
                                    <View style={styles.pinnedIndicator}>
                                        <Text style={styles.pinnedText}>PINNED</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.date,
                                isEnded && styles.grayedText
                            ]}>
                                {new Date(hackathon.starts_at).toLocaleDateString()} - {new Date(hackathon.ends_at).toLocaleDateString()}
                            </Text>
                            <Text style={[
                                styles.location,
                                isEnded && styles.grayedText
                            ]}>
                                {flagEmoji} {hackathon.location.city || "Online"}, {hackathon.location.country || ""}
                            </Text>
                            
                            {/* Countdown for pinned upcoming hackathons */}
                            {isPinned && countdowns[hackathon.id] && (
                                <View style={styles.countdownContainer}>
                                    <Clock color="#ec3750" size={16} />
                                    <Text style={styles.countdownText}>
                                        Starts in {countdowns[hackathon.id]}
                                    </Text>
                                </View>
                            )}
                            
                            <View style={[
                                styles.statusTag,
                                status === "ended" ? styles.endedPill : 
                                status === "in-person" ? styles.inPersonPill : styles.onlinePill
                            ]}>
                                <Text style={styles.statusText}>
                                    {status === "ended" ? "Ended" : 
                                        status === "in-person" ? "In-person" : "Online"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
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
        borderColor: "#333", 
    },
    endedCard: {
        backgroundColor: "#1A1A1A",
        borderColor: "#2A2A2A",
        opacity: 0.7,
    },
    pinnedCard: {
        borderColor: "#ec3750",
        borderWidth: 2,
        backgroundColor: "#1F1E1E",
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: "row",
        gap: 8,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 8,
    },
    grayedImage: {
        opacity: 0.5,
    },
    shareButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#2A2A2A",
        alignItems: "center",
        justifyContent: "center",
    },
    pinButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#2A2A2A",
    },
    name: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#FFFFFF",
        flex: 1,
        marginRight: 10,
    },
    grayedText: {
        color: "#777777",
    },
    pinnedIndicator: {
        backgroundColor: "#ec3750",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pinnedText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
    },
    date: {
        fontSize: 14,
        color: "#CCCCCC",
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: "#CCCCCC",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#CCCCCC",
    },
    navbarSpacer: {
        height: 90,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1E1E1E",
        borderRadius: 8,
        paddingHorizontal: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: "#444",
    },
    searchBar: {
        flex: 1,
        height: 40,
        color: "#FFFFFF",
        marginLeft: 8,
    },
    statusTag: {
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    statusText: {   
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 12,
        textAlign: "center",
    },
    endedPill: {
        backgroundColor: "#ec3750",
    },
    inPersonPill: {
        backgroundColor: "#33d6a6",
    },
    onlinePill: {
        backgroundColor: "#338eda",
    },
    countdownContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2A1F1F",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#ec3750",
    },
    countdownText: {
        color: "#ec3750",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 6,
    },
});
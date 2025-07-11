import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar, Clock, Pin, PinOff, Search, Share2, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Event {
    id: string;
    slug: string;
    title: string;
    desc: string;
    leader: string;
    start: string;
    end: string;
    cal: string;
    avatar: string;
    approved: boolean;
    youtube?: string;
    ama: boolean;
    amaForm: boolean;
    amaId: string;
    amaAvatar: string;
}

export default function Events() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [pinnedEvents, setPinnedEvents] = useState<string[]>([]);
    const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedPins = await AsyncStorage.getItem('pinnedEvents');
                if (savedPins) {
                    setPinnedEvents(JSON.parse(savedPins));
                }

                const response = await fetch("https://events.hackclub.com/api/events/upcoming/");
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const updateCountdowns = () => {
            const newCountdowns: {[key: string]: string} = {};
            
            events.forEach(event => {
                if (pinnedEvents.includes(event.id)) {
                    const now = new Date();
                    const startTime = new Date(event.start);

                    if (startTime > now) {
                        const timeDiff = startTime.getTime() - now.getTime();
                        
                        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                        
                        if (days > 0) {
                            newCountdowns[event.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                        } else if (hours > 0) {
                            newCountdowns[event.id] = `${hours}h ${minutes}m ${seconds}s`;
                        } else {
                            newCountdowns[event.id] = `${minutes}m ${seconds}s`;
                        }
                    }
                }
            });
            
            setCountdowns(newCountdowns);
        };

        if (events.length > 0 && pinnedEvents.length > 0) {
            updateCountdowns();
            const interval = setInterval(updateCountdowns, 1000);
            return () => clearInterval(interval);
        }
    }, [events, pinnedEvents]);

    const getEventStatus = (event: Event) => {
        const now = new Date();
        const startTime = new Date(event.start);
        const endTime = new Date(event.end);

        if (endTime < now) {
            return "ended";
        } else if (startTime <= now && endTime > now) {
            return "live";
        } else {
            return "upcoming";
        }
    };

    const togglePin = async (eventId: string) => {
        const newPinnedEvents = pinnedEvents.includes(eventId)
            ? pinnedEvents.filter(id => id !== eventId)
            : [...pinnedEvents, eventId];
        
        setPinnedEvents(newPinnedEvents);
        
        try {
            await AsyncStorage.setItem('pinnedEvents', JSON.stringify(newPinnedEvents));
        } catch (error) {
            console.error("Error saving pinned events:", error);
        }
    };

    const handleShare = async (event: Event) => {
        try {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            const status = getEventStatus(event);
            const statusText = status === "ended" ? "Ended" : status === "live" ? "Live Now" : "Upcoming";
            
            const shareContent = {
                title: event.title,
                message: `Check out this Hack Club event: ${event.title}\n\n👤 Led by ${event.leader}\n📅 ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}\n🏷️ ${statusText}\n\n${event.desc}\n\n${event.cal ? `Add to calendar: ${event.cal}` : ''}`,
                url: event.cal || '',
            };

            const result = await Share.share(shareContent);
            
            if (result.action === Share.sharedAction) {
                console.log('Event shared successfully');
            } else if (result.action === Share.dismissedAction) {
                console.log('Share dialog dismissed');
            }
        } catch (error) {
            console.error('Error sharing event:', error);
            Alert.alert('Error', 'Failed to share event details');
        }
    };

    const formatEventTime = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        const startDate = start.toLocaleDateString();
        const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `${startDate} • ${startTimeStr} - ${endTimeStr}`;
    };

    const filteredEvents = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        const aStatus = getEventStatus(a);
        const bStatus = getEventStatus(b);
        const aIsEnded = aStatus === "ended";
        const bIsEnded = bStatus === "ended";
        const aIsLive = aStatus === "live";
        const bIsLive = bStatus === "live";
        
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
        
        if (aIsEnded && !bIsEnded) return 1;
        if (!aIsEnded && bIsEnded) return -1;
 
        if (!aIsEnded && !bIsEnded) {
            const aIsPinned = pinnedEvents.includes(a.id);
            const bIsPinned = pinnedEvents.includes(b.id);
            
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;
        }
        
        return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ec3750" />
                <Text style={styles.loadingText}>Loading events...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Search color="#888" size={20} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search events..."
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
                {sortedEvents.map((event) => {
                    const status = getEventStatus(event);
                    const isEnded = status === "ended";
                    const isLive = status === "live";
                    const isPinned = pinnedEvents.includes(event.id);

                    return (
                        <TouchableOpacity
                            key={event.id}
                            style={[
                                styles.card,
                                isEnded && styles.endedCard,
                                isLive && styles.liveCard,
                                isPinned && styles.pinnedCard
                            ]}
                            onPress={() => event.cal && Linking.openURL(event.cal)}
                        >
                            <View style={styles.cardTop}>
                                <Image 
                                    source={{ uri: event.avatar }} 
                                    style={[
                                        styles.avatar,
                                        isEnded && styles.grayedImage
                                    ]} 
                                />
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => handleShare(event)}
                                    >
                                        <Share2 color={isEnded ? "#666666" : "#CCCCCC"} size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.pinButton}
                                        onPress={() => togglePin(event.id)}
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
                                    styles.title,
                                    isEnded && styles.grayedText
                                ]}>
                                    {event.title}
                                </Text>
                                {isPinned && (
                                    <View style={styles.pinnedIndicator}>
                                        <Text style={styles.pinnedText}>PINNED</Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.leaderContainer}>
                                <User color={isEnded ? "#666666" : "#CCCCCC"} size={16} />
                                <Text style={[
                                    styles.leader,
                                    isEnded && styles.grayedText
                                ]}>
                                    Led by {event.leader}
                                </Text>
                            </View>
                            
                            <View style={styles.timeContainer}>
                                <Calendar color={isEnded ? "#666666" : "#CCCCCC"} size={16} />
                                <Text style={[
                                    styles.time,
                                    isEnded && styles.grayedText
                                ]}>
                                    {formatEventTime(event.start, event.end)}
                                </Text>
                            </View>
                            
                            <Text style={[
                                styles.description,
                                isEnded && styles.grayedText
                            ]} numberOfLines={3}>
                                {event.desc}
                            </Text>
                            
                            {isPinned && countdowns[event.id] && (
                                <View style={styles.countdownContainer}>
                                    <Clock color="#ec3750" size={16} />
                                    <Text style={styles.countdownText}>
                                        Starts in {countdowns[event.id]}
                                    </Text>
                                </View>
                            )}
                            
                            <View style={styles.tagContainer}>
                                <View style={[
                                    styles.statusTag,
                                    status === "ended" ? styles.endedPill : 
                                    status === "live" ? styles.livePill : styles.upcomingPill
                                ]}>
                                    <Text style={styles.statusText}>
                                        {status === "ended" ? "Ended" : 
                                            status === "live" ? "Live Now" : "Upcoming"}
                                    </Text>
                                </View>
                                
                                {event.ama && (
                                    <View style={styles.amaTag}>
                                        <Text style={styles.amaText}>AMA</Text>
                                    </View>
                                )}
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
    liveCard: {
        borderColor: "#33d6a6",
        borderWidth: 2,
        backgroundColor: "#1E1F1E",
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
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
    title: {
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
    leaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    leader: {
        fontSize: 14,
        color: "#CCCCCC",
        marginLeft: 6,
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    time: {
        fontSize: 14,
        color: "#CCCCCC",
        marginLeft: 6,
    },
    description: {
        fontSize: 14,
        color: "#CCCCCC",
        lineHeight: 20,
        marginBottom: 12,
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
    tagContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
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
    livePill: {
        backgroundColor: "#33d6a6",
    },
    upcomingPill: {
        backgroundColor: "#338eda",
    },
    amaTag: {
        backgroundColor: "#ff6b35",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    amaText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 12,
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
    topTitle: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", marginBottom: 20 },
});
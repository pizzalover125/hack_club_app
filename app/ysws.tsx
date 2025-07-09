import NavigationBar from "@/components/NavigationBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { XMLParser } from "fast-xml-parser";
import { Check, ChevronDown, Clock, Pin, PinOff, Share2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface YSWSItem {
  title: string;
  link: string;
  description: string;
  deadline: string;
  discussionLink: string;
  isPassed: boolean;
  originalIndex: number;
}

interface ProgramStatus {
  [key: string]: string;
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress", color: "#ec3750" },
  { value: "interested", label: "Interested", color: "#5bc0de" },
  { value: "applied", label: "Applied", color: "#f1c40f" },
  { value: "uninterested", label: "Uninterested", color: "#8492a6" },
  { value: "completed", label: "Completed", color: "#33d6a6" },
];

const getMonthNumber = (monthName: string): string => {
  const months: { [key: string]: string } = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'sept': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };
  return months[monthName.toLowerCase()] || '00';
};

const isDeadlinePassed = (deadlineStr: string): boolean => {
  if (deadlineStr === "No deadline provided") return false;
  
  try {
    const cleanedDeadline = deadlineStr.trim().replace(/\s+/g, ' ');
    const now = new Date();
    let deadlineDate: Date;
    
    deadlineDate = new Date(cleanedDeadline);
    if (!isNaN(deadlineDate.getTime())) {
      return deadlineDate.getTime() < now.getTime();
    }
    
    const dateFormats = [
      cleanedDeadline,
      cleanedDeadline.replace(/(\d{1,2}),\s*(\d{4})/, '$1 $2'),
      cleanedDeadline.replace(/,/g, ''),
    ];
    
    for (const format of dateFormats) {
      deadlineDate = new Date(format);
      if (!isNaN(deadlineDate.getTime())) {
        return deadlineDate.getTime() < now.getTime();
      }
    }
    
    const match = cleanedDeadline.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (match) {
      const [_, monthName, day, year] = match;
      const monthNum = getMonthNumber(monthName);
      
      if (monthNum !== '00') {
        const isoString = `${year}-${monthNum}-${day.padStart(2, '0')}T23:59:59.999Z`;
        deadlineDate = new Date(isoString);
        
        if (!isNaN(deadlineDate.getTime())) {
          return deadlineDate.getTime() < now.getTime();
        }
      }
    }
    
    return false;
  } catch (error) {
    console.log(`Error parsing deadline: "${deadlineStr}"`, error);
    return false;
  }
};

const parseDeadlineToDate = (deadlineStr: string): Date | null => {
  if (deadlineStr === "No deadline provided") return null;
  
  try {
    const cleanedDeadline = deadlineStr.trim().replace(/\s+/g, ' ');
    let deadlineDate: Date;
    
    deadlineDate = new Date(cleanedDeadline);
    if (!isNaN(deadlineDate.getTime())) {
      return deadlineDate;
    }
    
    const dateFormats = [
      cleanedDeadline,
      cleanedDeadline.replace(/(\d{1,2}),\s*(\d{4})/, '$1 $2'),
      cleanedDeadline.replace(/,/g, ''),
    ];
    
    for (const format of dateFormats) {
      deadlineDate = new Date(format);
      if (!isNaN(deadlineDate.getTime())) {
        return deadlineDate;
      }
    }
    
    const match = cleanedDeadline.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (match) {
      const [_, monthName, day, year] = match;
      const monthNum = getMonthNumber(monthName);
      
      if (monthNum !== '00') {
        const isoString = `${year}-${monthNum}-${day.padStart(2, '0')}T23:59:59.999Z`;
        deadlineDate = new Date(isoString);
        
        if (!isNaN(deadlineDate.getTime())) {
          return deadlineDate;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log(`Error parsing deadline: "${deadlineStr}"`, error);
    return null;
  }
};

const extractDeadlineFromDescription = (description: string): string => {
  const HTMLParser = require("react-native-html-parser").DOMParser;
  const descriptionDoc = new HTMLParser().parseFromString(description, "text/html");
  
  const strongElements = descriptionDoc.getElementsByTagName("strong");
  
  for (let i = 0; i < strongElements.length; i++) {
    const strongEl = strongElements[i];
    const text = strongEl.textContent || "";
    
    if (text.toLowerCase().includes("deadline")) {
      const parentText = strongEl.parentNode?.textContent || "";
      const match = parentText.match(/deadline:\s*(.+?)(?:\n|$)/i);
      if (match) {
        return match[1].trim();
      }
    }
  }
  
  const dateMatch = description.match(/(\w+\s+\d{1,2},?\s*\d{4})/);
  if (dateMatch) {
    return dateMatch[1].trim();
  }
  
  return "No deadline provided";
};

export default function Index() {
  const [programs, setPrograms] = useState<YSWSItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<{[key: string]: string}>({});
  const [programStatuses, setProgramStatuses] = useState<ProgramStatus>({});
  const [pinnedPrograms, setPinnedPrograms] = useState<string[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);

  const getProgramKey = (program: YSWSItem): string => {
    return `${program.title}-${program.originalIndex}`;
  };

  const getStatusColor = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption ? statusOption.color : "#666666";
  };

  const getStatusLabel = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption ? statusOption.label : "Set Status";
  };

  const updateProgramStatus = (programKey: string, status: string) => {
    setProgramStatuses(prev => ({
      ...prev,
      [programKey]: status
    }));
    setDropdownVisible(null);
  };

  const togglePin = async (programKey: string) => {
    const newPinnedPrograms = pinnedPrograms.includes(programKey)
      ? pinnedPrograms.filter(id => id !== programKey)
      : [...pinnedPrograms, programKey];
    
    setPinnedPrograms(newPinnedPrograms);
    
    try {
      await AsyncStorage.setItem('pinnedPrograms', JSON.stringify(newPinnedPrograms));
    } catch (error) {
      console.error("Error saving pinned programs:", error);
    }
  };

  const handleLongPress = async (program: YSWSItem) => {
    try {
      const shareContent = {
        title: program.title,
        message: `Check out this program: ${program.title}\n\n${program.description}\n\nDeadline: ${program.deadline}\n\nLearn more: ${program.link}`,
        url: program.link,
      };

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share program details');
    }
  };

  const StatusPicker = ({ programKey, currentStatus }: { programKey: string; currentStatus: string }) => {
    return (
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[styles.statusButton, { borderColor: getStatusColor(currentStatus) }]}
          onPress={() => setDropdownVisible(programKey)}
        >
          <Text style={[styles.statusButtonText, { color: getStatusColor(currentStatus) }]}>
            {getStatusLabel(currentStatus)}
          </Text>
          <ChevronDown 
            color={getStatusColor(currentStatus)} 
            size={16} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const loadPinnedPrograms = async () => {
      try {
        const savedPins = await AsyncStorage.getItem('pinnedPrograms');
        if (savedPins) {
          setPinnedPrograms(JSON.parse(savedPins));
        }
      } catch (error) {
        console.error("Error loading pinned programs:", error);
      }
    };
    loadPinnedPrograms();
  }, []);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: {[key: string]: string} = {};
      
      programs.forEach((program) => {
        const programKey = getProgramKey(program);
        if (pinnedPrograms.includes(programKey) && !program.isPassed && program.deadline !== "No deadline provided") {
          const deadlineDate = parseDeadlineToDate(program.deadline);
          const now = new Date();
          
          if (deadlineDate && deadlineDate > now) {
            const timeDiff = deadlineDate.getTime() - now.getTime();
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            if (days > 0) {
              newCountdowns[programKey] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
              newCountdowns[programKey] = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
              newCountdowns[programKey] = `${minutes}m ${seconds}s`;
            } else {
              newCountdowns[programKey] = `${seconds}s`;
            }
          }
        }
      });
      
      setCountdowns(newCountdowns);
    };

    if (programs.length > 0 && pinnedPrograms.length > 0) {
      updateCountdowns();
      const interval = setInterval(updateCountdowns, 1000);
      return () => clearInterval(interval);
    }
  }, [programs, pinnedPrograms]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://ysws.hackclub.com/feed.xml");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlData = await response.text();
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsedData = parser.parse(xmlData);
        const items = parsedData.rss.channel.item;

        const formattedPrograms = (Array.isArray(items) ? items : [items]).map((item: any, index: number) => {
          const deadline = extractDeadlineFromDescription(item.description);
          
          const HTMLParser = require("react-native-html-parser").DOMParser;
          const descriptionDoc = new HTMLParser().parseFromString(item.description, "text/html");
          
          const deadlineElement = descriptionDoc.getElementsByTagName("strong")[0];
          if (deadlineElement?.textContent?.toLowerCase().includes("deadline")) {
            if (deadlineElement?.parentNode) {
              deadlineElement.parentNode.removeChild(deadlineElement);
            }
          }

          const discussionLinkElement = descriptionDoc.getElementsByTagName("a")[0];
          const discussionLink = discussionLinkElement?.getAttribute("href") || "";

          const isPassed = isDeadlinePassed(deadline);

          return {
            title: item.title,
            link: item.link,
            description: descriptionDoc.documentElement.textContent?.trim() || "No description available",
            deadline,
            discussionLink,
            isPassed,
            originalIndex: index,
          };
        });

        const sortedPrograms = formattedPrograms.sort((a, b) => {
          const aKey = getProgramKey(a);
          const bKey = getProgramKey(b);
          const aIsPinned = pinnedPrograms.includes(aKey);
          const bIsPinned = pinnedPrograms.includes(bKey);
          
          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;
          
          if (!a.isPassed && b.isPassed) return -1;
          if (a.isPassed && !b.isPassed) return 1;
          
          if (a.deadline !== "No deadline provided" && b.deadline !== "No deadline provided") {
            const dateA = parseDeadlineToDate(a.deadline);
            const dateB = parseDeadlineToDate(b.deadline);
            if (dateA && dateB) {
              return dateA.getTime() - dateB.getTime();
            }
          }
          
          if (a.deadline === "No deadline provided" && b.deadline !== "No deadline provided") return 1;
          if (a.deadline !== "No deadline provided" && b.deadline === "No deadline provided") return -1;
          
          return 0;
        });

        setPrograms(sortedPrograms);
        setError(null);
      } catch (error) {
        console.error("Error fetching the feed:", error);
        setError("Failed to load programs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    }, [pinnedPrograms.length > 0]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ec3750" />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (programs.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No programs available at the moment.</Text>
        </View>
      );
    }

    const upcomingPrograms = programs.filter(program => !program.isPassed);
    const passedPrograms = programs.filter(program => program.isPassed);

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {upcomingPrograms.map((program, index) => {
          const programKey = getProgramKey(program);
          const currentStatus = programStatuses[programKey] || "";
          const isPinned = pinnedPrograms.includes(programKey);
          
          return (
            <TouchableOpacity
              key={`upcoming-${program.originalIndex}`}
              style={[
                styles.card,
                isPinned && styles.pinnedCard
              ]}
              onLongPress={() => handleLongPress(program)}
              delayLongPress={500}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                    {program.title}
                  </Text>
                  {isPinned && (
                    <View style={styles.pinnedIndicator}>
                      <Text style={styles.pinnedText}>PINNED</Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleLongPress(program)}
                  >
                    <Share2 color="#CCCCCC" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pinButton}
                    onPress={() => togglePin(programKey)}
                  >
                    {isPinned ? (
                      <Pin color="#ec3750" size={20} fill="#ec3750" />
                    ) : (
                      <PinOff color="#888" size={20} />
                    )}
                  </TouchableOpacity>
                  <StatusPicker programKey={programKey} currentStatus={currentStatus} />
                </View>
              </View>
              
              <Text style={styles.description} numberOfLines={4}>
                {program.description}
              </Text>
              <Text style={styles.deadline}>Deadline: {program.deadline}</Text>
              
                {isPinned && countdowns[programKey] && (
                  <View style={styles.countdownContainer}>
                    <Clock color="#ec3750" size={16} />
                    <Text style={styles.countdownText}>
                    Deadline in {countdowns[programKey]}
                    </Text>
                  </View>
                )}
              
              <View style={styles.linkContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => Linking.openURL(program.link)}
                >
                  <Text style={styles.buttonText}>Learn More</Text>
                </TouchableOpacity>
                
                {program.discussionLink && (
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => Linking.openURL(program.discussionLink)}
                  >
                    <Text style={styles.secondaryButtonText}>Join Discussion</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {passedPrograms.length > 0 && (
          <>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Past Programs</Text>
            </View>
            {passedPrograms.map((program, index) => {
              const programKey = getProgramKey(program);
              const isPinned = pinnedPrograms.includes(programKey);
              
              return (
                <TouchableOpacity
                  key={`passed-${program.originalIndex}`}
                  style={[styles.card, styles.passedCard]}
                  onLongPress={() => handleLongPress(program)}
                  delayLongPress={500}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, styles.passedTitle]} numberOfLines={2} ellipsizeMode="tail">
                        {program.title}
                      </Text>
                      {isPinned && (
                        <View style={[styles.pinnedIndicator, styles.passedPinnedIndicator]}>
                          <Text style={[styles.pinnedText, styles.passedPinnedText]}>PINNED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleLongPress(program)}
                      >
                        <Share2 color="#666666" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.pinButton}
                        onPress={() => togglePin(programKey)}
                      >
                        {isPinned ? (
                          <Pin color="#777777" size={20} fill="#777777" />
                        ) : (
                          <PinOff color="#666666" size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={[styles.description, styles.passedDescription]} numberOfLines={4}>
                    {program.description}
                  </Text>
                  <Text style={[styles.deadline, styles.passedDeadline]}>Deadline: {program.deadline} (Passed)</Text>
                  <View style={styles.linkContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.passedButton]}
                      onPress={() => Linking.openURL(program.link)}
                    >
                      <Text style={styles.passedButtonText}>Learn More</Text>
                    </TouchableOpacity>
                    
                    {program.discussionLink && (
                      <TouchableOpacity
                        style={[styles.button, styles.secondaryButton, styles.passedSecondaryButton]}
                        onPress={() => Linking.openURL(program.discussionLink)}
                      >
                        <Text style={[styles.secondaryButtonText, styles.passedSecondaryButtonText]}>Join Discussion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.longPressHint}>
                    <Text style={[styles.longPressHintText, styles.passedLongPressHint]}>Long press to share</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        
        <View style={styles.navbarSpacer} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      <Modal
        visible={dropdownVisible !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  dropdownVisible && programStatuses[dropdownVisible] === option.value && styles.selectedModalOption
                ]}
                onPress={() => {
                  if (dropdownVisible) {
                    updateProgramStatus(dropdownVisible, option.value);
                  }
                }}
              >
                <Text style={[styles.modalOptionText, { color: option.color }]}>
                  {option.label}
                </Text>
                {dropdownVisible && programStatuses[dropdownVisible] === option.value && (
                  <Check color={option.color} size={18} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 70, 
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
  pinnedCard: {
    borderColor: "#ec3750",
    borderWidth: 2,
    backgroundColor: "#1F1E1E",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedIndicator: {
    backgroundColor: "#ec3750",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  pinnedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  passedPinnedIndicator: {
    backgroundColor: "#777777",
  },
  passedPinnedText: {
    color: "#FFFFFF",
  },
  passedCard: {
    backgroundColor: "#161616",
    borderColor: "#2A2A2A",
    opacity: 0.7,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF", 
  },
  passedTitle: {
    color: "#777777",
  },
  description: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    marginBottom: 12,
  },
  passedDescription: {
    color: "#666666",
  },
  deadline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#ec3750",
    marginBottom: 16,
  },
  passedDeadline: {
    color: "#666666",
  },
  linkContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#ec3750", 
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120, 
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1F1F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ec3750",
    alignSelf: "flex-start", 
    minWidth: 120,           
  },
  passedButton: {
    backgroundColor: "#555555",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  passedButtonText: {
    color: "#AAAAAA",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ec3750",
  },
  passedSecondaryButton: {
    borderColor: "#555555",
  },
  secondaryButtonText: {
    color: "#ec3750",
    fontWeight: "600",
    fontSize: 14,
  },
  passedSecondaryButtonText: {
    color: "#777777",
  },
  sectionDivider: {
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#AAAAAA",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#CCCCCC",
  },
  errorText: {
    color: "#EF4444", 
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    color: "#CCCCCC",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  navbarSpacer: {
    height: 90, 
  },
  countdownText: {
    color: "#ec3750",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  statusContainer: {
    position: "relative",
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedModalOption: {
    backgroundColor: "#333333",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  longPressHint: {
    marginTop: 8,
    alignItems: "center",
  },
  longPressHintText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  passedLongPressHint: {
    color: "#444444",
  },
});
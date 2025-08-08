import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  FlatList,
  Dimensions,
  Image,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

type GridItem = {
  id: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HomeScreen'>>();
  const userName = route.params?.userName || 'User';
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    const loadProfileImage = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.profileImageUrl) {
              setProfileImage(userData.profileImageUrl);
            }
          }
        } catch (error) {
          console.error("Error loading profile image:", error);
        }
      }
    };

    loadProfileImage();

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(3));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          text: data.text,
          user: data.user,
          timestamp: data.timestamp?.toDate().toLocaleTimeString(),
        });
      });
      setRecentMessages(newMessages);
      setHasUnreadMessages(newMessages.length > 0);
    });

    return () => unsubscribe();
  }, []);

  const gridItems: GridItem[] = [
    { id: 1, title: 'Scan Plant', icon: 'camera', color: '#46A200' },
    { id: 2, title: 'Pest Risk Analyst', icon: 'analytics', color: '#39D2C0' },
    { id: 3, title: 'Community Chat', icon: 'chatbubbles', color: '#EE8B60' },
    { id: 4, title: 'Disease Guide', icon: 'bug', color: '#EF4444' },
    { id: 5, title: 'Crop Health', icon: 'leaf', color: '#10B981' },
    { id: 6, title: 'Treatment Advice', icon: 'medkit', color: '#46A200' },
  ];

  const handleNavigation = (screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => {
    if (navigation && navigation.navigate) {
      switch (screen) {
        case 'CommunityScreen':
          navigation.navigate(screen, { 
            userName,
            ...params 
          });
          break;
        case 'UserProfileScreen':
          navigation.navigate(screen, { 
            userName,
            ...params 
          });
          break;
        default:
          navigation.navigate(screen, params as any);
      }
    }
  };

  const renderGridItem = ({ item }: { item: GridItem }) => {
      const screenMap: Record<string, keyof RootStackParamList> = {
        'Scan Plant': 'ScanPlantScreen',
        'Pest Risk Analyst': 'PestRiskAnalystScreen',
        'Community Chat': 'CommunityScreen',
        'Disease Guide': 'DiseaseGuideScreen',
        'Crop Health': 'CropHealthScreen',
        'Treatment Advice': 'TreatmentAdviceScreen',
      };
  
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => {
            const screenName = screenMap[item.title];
            if (screenName === 'CommunityScreen') {
              handleNavigation(screenName, { userName });
            } else if (screenName === 'PestRiskAnalystScreen') {
              handleNavigation(screenName, { userName });
            } else {
              handleNavigation(screenName);
            }
          }}
        >
          <View style={styles.gridContent}>
            <Ionicons name={item.icon} size={48} color={item.color} />
            <Text style={styles.gridText}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
            colors={['#46A200', '#39D2C0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('UserProfileScreen', { userName })}
          >
            <LinearGradient
              colors={['#46a200', '#39D2C0']}
              style={styles.profileIcon}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage} 
                />
              ) : (
                <Ionicons name="person" size={20} color="white" />
              )}
            </LinearGradient>
            <View>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            {hasUnreadMessages && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => navigation.navigate('UserManualScreen')}
          >
            <Ionicons name="help-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        <Modal
          visible={showNotifications}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNotifications(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowNotifications(false)}
          >
            <View style={styles.notificationContainer}>
              <Text style={styles.notificationTitle}>Recent Community Messages</Text>
              
              {recentMessages.length > 0 ? (
                <FlatList
                  data={recentMessages}
                  renderItem={({ item }) => (
                    <View style={styles.messageItem}>
                      <Text style={styles.messageUser}>{item.user}</Text>
                      <Text style={styles.messageText}>{item.text}</Text>
                      <Text style={styles.messageTime}>{item.timestamp}</Text>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.messagesList}
                />
              ) : (
                <Text style={styles.noMessagesText}>No recent messages</Text>
              )}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  setShowNotifications(false);
                  navigation.navigate('CommunityScreen', { userName });
                }}
              >
                <Text style={styles.viewAllButtonText}>View All Messages</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <LinearGradient
          colors={['#46a200', '#249689']}
          style={styles.welcomeBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.welcomeTitle}>Crop Guardian</Text>
          <Text style={styles.welcomeSubtitle}>
            Your smart solution for pest and disease management
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => handleNavigation('ScanPlantScreen')}
          >
            <Ionicons name="camera" size={20} color="#46A200" />
            <Text style={styles.scanButtonText}>Scan Plant Now</Text>
          </TouchableOpacity>
        </LinearGradient>

        <FlatList
          data={gridItems}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer}
        />

        <TouchableOpacity
          style={styles.weatherAlert}
          onPress={() => handleNavigation('PestRiskAnalystScreen', { userName })}
        >
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>Weather Advisory</Text>
            <Text style={styles.alertMessage}>
              Increased pest risk detected
            </Text>
          </View>
          <Ionicons name="alert-circle" size={40} color="#F59E0B" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#46a200',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  helpButton: {
    padding: 8,
    marginLeft: 12,
  },
  welcomeBanner: {
    borderRadius: 16,
    padding: 24,
    margin: 20,
    marginTop: 24,
    elevation: 4,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'Raleway-Bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  scanButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#46A200',
    fontFamily: 'Roboto-Medium',
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 3,
    minWidth: (width - 60) / 2,
  },
  gridContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  weatherAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    margin: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#92400E',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '60%',
    padding: 20,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#46A200',
    textAlign: 'center',
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messageUser: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  messageText: {
    color: '#4B5563',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  noMessagesText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 20,
  },
  viewAllButton: {
    backgroundColor: '#46A200',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
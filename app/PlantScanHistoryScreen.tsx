import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';

interface PlantScan {
  id: string;
  plantName: string;
  scientificName: string;
  imageUrl: string;
  timestamp: Date;
  diseaseName: string;
  cause: string;
  treatment: string;
  prevention: string;
  pestName: string;
  pestPrevention: string;
  overallHealth: number;
}

type FilterOption = 'all' | 'healthy' | 'unhealthy' | 'pest';

const PlantScanHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [scans, setScans] = useState<PlantScan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const scansRef = collection(db, 'users', auth.currentUser.uid, 'scans');
    const q = query(
      scansRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scansData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure the image URL is from ImgBB
        const imageUrl = data.imageUrl || '';
        return {
          id: doc.id,
          plantName: data.plantName || 'Unknown Plant',
          scientificName: data.scientificName || '',
          imageUrl: imageUrl,
          timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
          diseaseName: data.diseaseName || 'No disease detected',
          cause: data.cause || 'N/A',
          treatment: data.treatment || 'N/A',
          prevention: data.prevention || 'N/A',
          pestName: data.pestName || 'No pest detected',
          pestPrevention: data.pestPrevention || 'N/A',
          overallHealth: data.overallHealth || 100,
        };
      });
      setScans(scansData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scans: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (diseaseName: string) => {
    return diseaseName === 'No disease detected' ? '#10B981' : '#EF4444';
  };

  const getHealthColor = (percentage: number): string => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FFC107';
    if (percentage >= 40) return '#FF9800';
    return '#F44336';
  };

  const filteredScans = scans.filter(scan => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      scan.plantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (scan.diseaseName && scan.diseaseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (scan.pestName && scan.pestName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply status filter
    let matchesFilter = true;
    switch (selectedFilter) {
      case 'healthy':
        matchesFilter = scan.diseaseName === 'No disease detected' && scan.pestName === 'No pest detected';
        break;
      case 'unhealthy':
        matchesFilter = scan.diseaseName !== 'No disease detected';
        break;
      case 'pest':
        matchesFilter = scan.pestName !== 'No pest detected';
        break;
      case 'all':
      default:
        matchesFilter = true;
    }
    
    return matchesSearch && matchesFilter;
  });

  const renderScanCard = ({ item }: { item: PlantScan }) => {
    const scan = item;
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ScanDetailsScreen', { scanId: scan.id })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: scan.imageUrl }} style={styles.image} />
          <View style={[styles.statusBadge, { 
            backgroundColor: getStatusColor(scan.diseaseName) 
          }]}>
            <Text style={styles.statusText}>
              {scan.diseaseName === 'No disease detected' ? 'Healthy' : 'Unhealthy'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.plantName} numberOfLines={1}>{scan.plantName}</Text>
          {scan.scientificName && (
            <Text style={styles.scientificName} numberOfLines={1}>
              {scan.scientificName}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {scan.timestamp.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </Text>
          <View style={styles.healthInfo}>
            <Text style={[styles.healthPercentage, { color: getHealthColor(scan.overallHealth || 100) }]}>
              {scan.overallHealth || 100}% Health
            </Text>
          </View>
          <Text style={[styles.disease, { color: getStatusColor(scan.diseaseName) }]}>
            {scan.diseaseName}
          </Text>
          {scan.pestName !== 'No pest detected' && (
            <Text style={[styles.disease, { color: '#EF4444' }]}>
              Pest: {scan.pestName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color="#46A200" />
      <Text style={styles.emptyTitle}>No Scan History Found</Text>
      <Text style={styles.emptySubtitle}>Your plant scans will appear here</Text>
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => navigation.navigate('ScanPlantScreen', { userName: auth.currentUser?.displayName || '' })}
      >
        <Text style={styles.scanButtonText}>Scan Your First Plant</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Scans</Text>
          
          <Pressable 
            style={[styles.filterOption, selectedFilter === 'all' && styles.selectedFilterOption]}
            onPress={() => {
              setSelectedFilter('all');
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.filterOptionText}>All Scans</Text>
            {selectedFilter === 'all' && <Ionicons name="checkmark" size={20} color="#46A200" />}
          </Pressable>
          
          <Pressable 
            style={[styles.filterOption, selectedFilter === 'healthy' && styles.selectedFilterOption]}
            onPress={() => {
              setSelectedFilter('healthy');
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.filterOptionText}>Healthy Plants</Text>
            {selectedFilter === 'healthy' && <Ionicons name="checkmark" size={20} color="#46A200" />}
          </Pressable>
          
          <Pressable 
            style={[styles.filterOption, selectedFilter === 'unhealthy' && styles.selectedFilterOption]}
            onPress={() => {
              setSelectedFilter('unhealthy');
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.filterOptionText}>Diseased Plants</Text>
            {selectedFilter === 'unhealthy' && <Ionicons name="checkmark" size={20} color="#46A200" />}
          </Pressable>
          
          <Pressable 
            style={[styles.filterOption, selectedFilter === 'pest' && styles.selectedFilterOption]}
            onPress={() => {
              setSelectedFilter('pest');
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.filterOptionText}>Plants with Pests</Text>
            {selectedFilter === 'pest' && <Ionicons name="checkmark" size={20} color="#46A200" />}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#46A200', '#39D2C0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search plants or diseases"
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#46A200" />
        </View>
      ) : (
        <FlatList
          data={filteredScans}
          renderItem={renderScanCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontFamily: 'Roboto-SemiBold',
    fontSize: 12,
  },
  cardContent: {
    padding: 12,
  },
  plantName: {
    fontFamily: 'Roboto-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  scientificName: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontFamily: 'Roboto-Light',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  healthInfo: {
    marginBottom: 8,
  },
  healthPercentage: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  disease: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: 'Roboto-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginVertical: 16,
  },
  emptySubtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#46A200',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  scanButtonText: {
    color: 'white',
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontFamily: 'Roboto-Bold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedFilterOption: {
    backgroundColor: '#F0FDF4',
  },
  filterOptionText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#1F2937',
  },
});

export default PlantScanHistoryScreen;
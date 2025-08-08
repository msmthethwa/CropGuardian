import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from './navigationTypes';
import { SubscriptionManager } from '../utils/subscription';

type Disease = {
  id: number;
  title: string;
  description: string;
  image: string;
  severity: string;
  type: string;
  severityColor: string;
  typeColor: string;
};

interface Plant {
  id: number;
  common_name: string | null;
  scientific_name: string;
  family_common_name: string | null;
  image_url: string | null;
}

interface PlantsResponse {
  data: Plant[];
}

const DiseaseGuideScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const API_TOKEN = '3aM_Gw2yCinaKNVexpt0lxz3-RdQaGYeIi8zi8uiOCk';

  useEffect(() => {
    fetchDiseases();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const access = await SubscriptionManager.hasPremiumAccess();
    setHasPremiumAccess(access);
  };

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PlantsResponse>('https://trefle.io/api/v1/plants', {
        params: {
          token: API_TOKEN,
          page_size: 15,
        },
      });

      const data = response.data.data;

      const formattedData: Disease[] = data.map((plant) => ({
        id: plant.id,
        title: plant.common_name || plant.scientific_name,
        description: hasPremiumAccess ? (plant.family_common_name || 'No description available.') : 'Subscribe to see description.',
        image: plant.image_url || 'https://via.placeholder.com/800x800',
        severity: 'Moderate',
        type: 'Fungal',
        severityColor: '#F59E0B',
        typeColor: '#60A5FA',
      }));

      setDiseases(formattedData);
    } catch (error) {
      console.error('Error fetching diseases:', error);
      Alert.alert('Error', 'Failed to load disease data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderDiseaseCard = ({ item }: { item: Disease }) => (
    <TouchableOpacity
      style={styles.diseaseCard}
      onPress={() => navigation.navigate('DiseaseDetailScreen', { disease: item })}
    >
      <Image source={{ uri: item.image }} style={styles.diseaseImage} />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.gradient}
      >
        <Text style={styles.diseaseTitle}>{item.title}</Text>
      </LinearGradient>
      <View style={styles.diseaseInfo}>
        <Text style={styles.diseaseDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: item.severityColor }]}>
            <Text style={styles.tagText}>{item.severity}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: item.typeColor }]}>
            <Text style={styles.tagText}>{item.type}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Disease Guide</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search diseases..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={diseases}
          renderItem={renderDiseaseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  diseaseCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  diseaseImage: {
    width: '100%',
    height: 150,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  diseaseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  diseaseInfo: {
    padding: 15,
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DiseaseGuideScreen;

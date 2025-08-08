import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import axios from 'axios';
import * as Location from 'expo-location';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Outbreak = {
  id: string;
  title: string;
  scientificName: string;
  location: string;
  updated: string;
  severity: 'Severe' | 'Moderate' | 'Mild';
  description: string;
  symptoms: string[];
  prevention: string[];
  treatment: string[];
  imageUrl?: string;
  affectedCrops: string[];
  spreadRate?: number;
  probability?: number;
};

type UserReport = {
  id: string;
  cropType: string;
  diseaseName: string;
  location: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  imageUrl?: string;
  coordinates?: { latitude: number; longitude: number };
  createdAt: any;
  status: 'pending' | 'approved' | 'rejected';
};

type SeverityChipProps = {
  level: 'Severe' | 'Moderate' | 'Mild' | 'High' | 'Medium' | 'Low';
};

const CropHealthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'agrovoc' | 'reports'>('agrovoc');

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const location = await Location.getCurrentPositionAsync({});
      const region = await Location.reverseGeocodeAsync(location.coords);
      setUserRegion(region[0].country || region[0].region || 'Your Region');
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchAgrovocData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Use the same SPARQL query as the old system
    const diseasesQuery = `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      SELECT ?disease ?label WHERE {
        ?disease a skos:Concept ;
                skos:inScheme <http://aims.fao.org/aos/agrovoc> ;
                skos:broader* <http://aims.fao.org/aos/agrovoc/c_2391> ; # "c_2391" = plant diseases
                skos:prefLabel ?label .
        FILTER (lang(?label) = 'en')
      } LIMIT 20
    `;

    const response = await axios.get(
      `https://agrovoc.fao.org/sparql?query=${encodeURIComponent(diseasesQuery)}`,
      {
        headers: { 'Accept': 'application/sparql-results+json' },
        timeout: 10000
      }
    );

    const diseases = response.data?.results?.bindings;
    if (!Array.isArray(diseases)) {
      throw new Error('Invalid data format from FAO AIMS');
    }

    // Process the results similar to old system
    const severityLevels = ['Mild', 'Moderate', 'Severe'] as const;
    const agrovocOutbreaks = await Promise.all(
      diseases.map(async (item, index) => {
        const diseaseName = item.label.value;
        const diseaseInfo = await fetchDiseaseInfo(diseaseName);
        
        return {
          id: item.disease.value.split('/').pop() || index.toString(),
          title: diseaseName,
          scientificName: '', // Can be fetched separately if needed
          location: 'Global',
          updated: new Date().toISOString().split('T')[0],
          severity: severityLevels[index % 3],
          description: diseaseInfo,
          symptoms: ['No symptom data available'],
          prevention: ['No prevention data available'],
          treatment: ['No treatment data available'],
          affectedCrops: ['Various crops'], // Can be fetched from broader concepts
          spreadRate: Math.floor(Math.random() * 100),
          probability: Math.floor(Math.random() * 100)
        };
      })
    );

    setOutbreaks(agrovocOutbreaks);
    setLastFetchTime(new Date().toLocaleString());
  } catch (err) {
    // console.error('FAO API Error:', err);
    setError('Failed to load crop health data from FAO. Please try again later.');
    // Fallback to mock data if needed
    const mockAgrovocData = [
  {
    uri: 'http://aims.fao.org/aos/agrovoc/c_2392',
    prefLabel: 'Late Blight',
    altLabel: 'Phytophthora infestans',
    definition: ['A serious fungal disease affecting potatoes and tomatoes that can cause complete crop loss under favorable conditions.'],
    broader: [
      { prefLabel: 'Potato Diseases' },
      { prefLabel: 'Tomato Diseases' }
    ],
    symptoms: [
      'Water-soaked lesions on leaves',
      'White fungal growth under leaves in humid conditions',
      'Rapid browning and withering of foliage',
      'Dark, firm rot on tubers or fruits'
    ],
    prevention: [
      'Use resistant varieties when available',
      'Ensure proper field drainage',
      'Practice crop rotation (3-4 year cycle)',
      'Avoid overhead irrigation'
    ],
    treatment: [
      'Apply fungicides at first sign of disease',
      'Remove and destroy infected plants',
      'Use copper-based preventatives',
      'Harvest early if outbreak occurs'
    ]
  },
  {
    uri: 'http://aims.fao.org/aos/agrovoc/c_12345',
    prefLabel: 'Powdery Mildew',
    altLabel: 'Erysiphales',
    definition: ['Fungal disease appearing as white powdery spots on leaves, stems and sometimes fruits.'],
    broader: [
      { prefLabel: 'Cucurbit Diseases' },
      { prefLabel: 'Grape Diseases' },
      { prefLabel: 'Cereal Diseases' }
    ],
    symptoms: [
      'White powdery spots on upper leaf surfaces',
      'Yellowing or browning of affected leaves',
      'Stunted plant growth',
      'Premature leaf drop'
    ],
    prevention: [
      'Plant resistant varieties',
      'Ensure good air circulation',
      'Avoid excessive nitrogen fertilization',
      'Use drip irrigation instead of overhead'
    ],
    treatment: [
      'Apply sulfur or potassium bicarbonate',
      'Use horticultural oils',
      'Remove severely infected leaves',
      'Apply biological controls like Ampelomyces quisqualis'
    ]
  },
  {
    uri: 'http://aims.fao.org/aos/agrovoc/c_67890',
    prefLabel: 'Fusarium Wilt',
    altLabel: 'Fusarium oxysporum',
    definition: ['Soil-borne fungal disease that causes vascular wilting in many crops.'],
    broader: [
      { prefLabel: 'Banana Diseases' },
      { prefLabel: 'Tomato Diseases' },
      { prefLabel: 'Cotton Diseases' }
    ],
    symptoms: [
      'Yellowing and wilting of lower leaves',
      'Brown discoloration of vascular tissue',
      'Stunted growth',
      'Plant death in severe cases'
    ],
    prevention: [
      'Use disease-free planting material',
      'Practice long crop rotations (5+ years)',
      'Solarize soil before planting',
      'Maintain soil pH above 6.5'
    ],
    treatment: [
      'No effective chemical treatment once established',
      'Remove and destroy infected plants',
      'Use resistant rootstocks where available',
      'Apply biocontrol agents like Trichoderma'
    ]
  },
  {
    uri: 'http://aims.fao.org/aos/agrovoc/c_54321',
    prefLabel: 'Rice Blast',
    altLabel: 'Magnaporthe oryzae',
    definition: ['Devastating fungal disease of rice causing lesions on leaves, stems and panicles.'],
    broader: [
      { prefLabel: 'Rice Diseases' }
    ],
    symptoms: [
      'Diamond-shaped lesions with gray centers',
      'Collars and nodes may turn black',
      'White heads with empty grains',
      'Complete yield loss in severe cases'
    ],
    prevention: [
      'Plant resistant varieties',
      'Avoid excessive nitrogen fertilization',
      'Maintain proper water management',
      'Destroy crop residues after harvest'
    ],
    treatment: [
      'Apply fungicides like tricyclazole or azoxystrobin',
      'Use silicon fertilization',
      'Apply plant extracts like neem oil',
      'Practice field sanitation'
    ]
  },
  {
    uri: 'http://aims.fao.org/aos/agrovoc/c_98765',
    prefLabel: 'Coffee Leaf Rust',
    altLabel: 'Hemileia vastatrix',
    definition: ['Fungal disease causing orange-yellow powdery lesions on coffee leaves.'],
    broader: [
      { prefLabel: 'Coffee Diseases' }
    ],
    symptoms: [
      'Yellow-orange powdery spots on leaf undersides',
      'Premature leaf drop',
      'Reduced berry production',
      'Dieback of branches'
    ],
    prevention: [
      'Plant resistant cultivars',
      'Maintain adequate shade levels',
      'Prune for good air circulation',
      'Avoid water stress'
    ],
    treatment: [
      'Apply copper-based fungicides',
      'Use systemic fungicides during rainy seasons',
      'Remove severely infected plants',
      'Apply micronutrients to boost plant health'
    ]
  }
];
    setOutbreaks(mockAgrovocData.map((item) => formatAgrovocItem(item)));
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

const fetchDiseaseInfo = async (diseaseName: string) => {
  try {
    // Using FAO's AGROVOC API to get disease information (same as old system)
    const response = await axios.get(
      `https://agrovoc.fao.org/sparql?query=${encodeURIComponent(`
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        SELECT ?description WHERE {
          ?disease a skos:Concept ;
                  skos:prefLabel "${diseaseName}"@en ;
                  skos:scopeNote ?description .
          FILTER (lang(?description) = 'en')
        } LIMIT 1
      `)}`,
      {
        headers: { 'Accept': 'application/sparql-results+json' },
        timeout: 10000
      }
    );

    return response.data?.results?.bindings[0]?.description?.value || 
      `Information about ${diseaseName} from FAO databases.`;
  } catch (error) {
    console.error('Error fetching disease info:', error);
    return `Information about ${diseaseName} from FAO databases.`;
  }
};

  // Helper function to format AGROVOC items consistently
  const formatAgrovocItem = (item: any): Outbreak => {
    const spreadRate = Math.floor(Math.random() * 100);
    const probability = Math.floor(Math.random() * 100);
    let severity: 'Mild' | 'Moderate' | 'Severe' = 'Mild';
    
    if (probability > 70 || spreadRate > 70) {
      severity = 'Severe';
    } else if (probability > 40 || spreadRate > 40) {
      severity = 'Moderate';
    }

    return {
      id: item.uri || `mock-${Math.random().toString(36).substr(2, 9)}`,
      title: item.prefLabel || 'Unknown Disease',
      scientificName: item.altLabel || 'Not specified',
      location: 'Global',
      updated: new Date().toISOString().split('T')[0],
      severity,
      description: item.definition?.[0] || 'No description available',
      symptoms: ['No symptom data available'],
      prevention: ['No prevention data available'],
      treatment: ['No treatment data available'],
      affectedCrops: item.broader?.map((b: any) => b.prefLabel) || ['Various crops'],
      spreadRate,
      probability
    };
  };

  const fetchApprovedReports = async () => {
    try {
      const q = query(
        collection(db, 'outbreakReports'),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      
      const reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          cropType: data.cropType,
          diseaseName: data.diseaseName,
          location: data.location,
          description: data.description,
          severity: data.severity,
          imageUrl: data.imageUrl,
          coordinates: data.coordinates,
          createdAt: data.createdAt,
          status: data.status
        };
      });

      setUserReports(reports);
    } catch (err) {
      console.error('Error fetching approved reports:', err);
      setError('Failed to load user reports.');
    }
  };

  const fetchCropHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await getUserLocation();
      
      if (activeTab === 'agrovoc') {
        await fetchAgrovocData();
      } else {
        await fetchApprovedReports();
      }
    } catch (err) {
      console.error('Error in fetchCropHealthData:', err);
      setError('An unexpected error occurred. Please pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCropHealthData();
  }, [fetchCropHealthData, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCropHealthData();
  };

  const toggleCardExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const SeverityChip = ({ level }: SeverityChipProps) => {
    const severityData = {
      Severe: { color: '#DC2626', icon: 'warning' as const },
      Moderate: { color: '#F59E0B', icon: 'alert-circle' as const },
      Mild: { color: '#10B981', icon: 'checkmark-circle' as const },
      High: { color: '#DC2626', icon: 'warning' as const },
      Medium: { color: '#F59E0B', icon: 'alert-circle' as const },
      Low: { color: '#10B981', icon: 'checkmark-circle' as const }
    };

    return (
      <View style={[styles.severityChip, { backgroundColor: severityData[level].color }]}>
        <Ionicons name={severityData[level].icon} size={16} color="white" />
        <Text style={styles.severityText}>{level}</Text>
      </View>
    );
  };

  const ProbabilityMeter = ({ value }: { value: number }) => {
    return (
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View 
            style={[
              styles.meterFill,
              { 
                width: `${value}%`,
                backgroundColor: value > 70 ? '#DC2626' : value > 40 ? '#F59E0B' : '#10B981'
              }
            ]}
          />
        </View>
        <Text style={styles.meterText}>{value}% probability</Text>
      </View>
    );
  };

  const filteredOutbreaks = outbreaks.filter(outbreak => 
    (!severityFilter || outbreak.severity === severityFilter) &&
    (!searchQuery || 
      outbreak.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outbreak.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outbreak.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outbreak.affectedCrops.some(crop => crop.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredReports = userReports.filter(report => 
    (!severityFilter || 
      (severityFilter === 'Severe' && report.severity === 'High') ||
      (severityFilter === 'Moderate' && report.severity === 'Medium') ||
      (severityFilter === 'Mild' && report.severity === 'Low')) &&
    (!searchQuery || 
      report.diseaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#46a200']}
            tintColor="#46a200"
          />
        }
      >
        {/* Header */}  
        <LinearGradient
          colors={['#46a200', '#39D2C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Crop Health Intelligence</Text>
              <Text style={styles.headerSubtitle}>
                {userRegion || 'Global'} • {activeTab === 'agrovoc' ? 'AGROVOC Data' : 'Community Reports'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'agrovoc' && styles.activeTab]}
            onPress={() => setActiveTab('agrovoc')}
          >
            <Text style={[styles.tabText, activeTab === 'agrovoc' && styles.activeTabText]}>
              Global Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Community Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab === 'agrovoc' ? 'diseases, crops' : 'reports'}...`}
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                severityFilter === null && styles.activeFilterAll
              ]}
              onPress={() => setSeverityFilter(null)}
            >
              <Text style={[
                styles.filterButtonText, 
                severityFilter === null && styles.activeFilterTextAll
              ]}>All Threats</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                severityFilter === 'Mild' && styles.activeFilterMild
              ]}
              onPress={() => setSeverityFilter('Mild')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={severityFilter === 'Mild' ? 'white' : '#10B981'} 
              />
              <Text style={[
                styles.filterButtonText, 
                severityFilter === 'Mild' && styles.activeFilterTextMild
              ]}>Mild</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                severityFilter === 'Moderate' && styles.activeFilterModerate
              ]}
              onPress={() => setSeverityFilter('Moderate')}
            >
              <Ionicons 
                name="alert-circle" 
                size={16} 
                color={severityFilter === 'Moderate' ? 'white' : '#F59E0B'} 
              />
              <Text style={[
                styles.filterButtonText, 
                severityFilter === 'Moderate' && styles.activeFilterTextModerate
              ]}>Moderate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                severityFilter === 'Severe' && styles.activeFilterSevere
              ]}
              onPress={() => setSeverityFilter('Severe')}
            >
              <Ionicons 
                name="warning" 
                size={16} 
                color={severityFilter === 'Severe' ? 'white' : '#DC2626'} 
              />
              <Text style={[
                styles.filterButtonText, 
                severityFilter === 'Severe' && styles.activeFilterTextSevere
              ]}>Severe</Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.lastUpdated}>
            Last updated: {lastFetchTime || 'Loading...'}
          </Text>
        </View>

        {/* Content Area */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchCropHealthData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#46a200" />
            <Text style={styles.loadingText}>Loading crop health data...</Text>
          </View>
        ) : activeTab === 'agrovoc' ? (
          filteredOutbreaks.length > 0 ? (
            <View style={styles.outbreaksContainer}>
              {filteredOutbreaks.map((outbreak) => (
                <View key={outbreak.id} style={styles.outbreakCard}>
                  <TouchableOpacity 
                    style={styles.cardHeader}
                    onPress={() => toggleCardExpand(outbreak.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.headerText}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.outbreakTitle} numberOfLines={1}>
                          {outbreak.title}
                        </Text>
                        {outbreak.scientificName && (
                          <Text style={styles.scientificName} numberOfLines={1}>
                            {outbreak.scientificName}
                          </Text>
                        )}
                      </View>
                      <View style={styles.metaContainer}>
                        <Text style={styles.outbreakLocation}>
                          <Ionicons name="location" size={12} color="#6B7280" /> {outbreak.location}
                        </Text>
                        <Text style={styles.outbreakUpdated}>
                          <Ionicons name="time" size={12} color="#6B7280" /> {outbreak.updated}
                        </Text>
                      </View>
                      {outbreak.affectedCrops.length > 0 && (
                        <View style={styles.cropsContainer}>
                          <Ionicons name="leaf" size={12} color="#6B7280" />
                          <Text style={styles.affectedCrops} numberOfLines={1}>
                            Affects: {outbreak.affectedCrops.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <SeverityChip level={outbreak.severity} />
                  </TouchableOpacity>

                  {expandedCard === outbreak.id && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.sectionHeader}>Description</Text>
                      <Text style={styles.outbreakDescription}>
                        {outbreak.description}
                      </Text>

                      <ProbabilityMeter value={outbreak.probability || 0} />

                      <View style={styles.detailsGrid}>
                        <View style={styles.detailColumn}>
                          <Text style={styles.sectionHeader}>Symptoms</Text>
                          {outbreak.symptoms.map((symptom, index) => (
                            <Text key={index} style={styles.detailItem}>
                              • {symptom}
                            </Text>
                          ))}
                        </View>

                        <View style={styles.detailColumn}>
                          <Text style={styles.sectionHeader}>Prevention</Text>
                          {outbreak.prevention.map((prevention, index) => (
                            <Text key={index} style={styles.detailItem}>
                              • {prevention}
                            </Text>
                          ))}
                        </View>
                      </View>

                      <Text style={styles.sectionHeader}>Treatment</Text>
                      {outbreak.treatment.map((treatment, index) => (
                        <Text key={index} style={styles.detailItem}>
                          • {treatment}
                        </Text>
                      ))}

                      <TouchableOpacity 
                        style={styles.reportButton}
                        onPress={() => navigation.navigate('ReportOutbreakScreen', { disease: outbreak.title })}
                      >
                        <Text style={styles.reportButtonText}>
                          <Ionicons name="alert-circle" size={16} /> Report This Disease
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#6B7280" />
              <Text style={styles.noResultsText}>No disease outbreaks match your search criteria</Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSeverityFilter(null);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          filteredReports.length > 0 ? (
            <View style={styles.outbreaksContainer}>
              {filteredReports.map((report) => (
                <View key={report.id} style={styles.outbreakCard}>
                  <TouchableOpacity 
                    style={styles.cardHeader}
                    onPress={() => toggleCardExpand(report.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.headerText}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.outbreakTitle} numberOfLines={1}>
                          {report.diseaseName}
                        </Text>
                        <Text style={styles.scientificName} numberOfLines={1}>
                          Affected crop: {report.cropType}
                        </Text>
                      </View>
                      <View style={styles.metaContainer}>
                        <Text style={styles.outbreakLocation}>
                          <Ionicons name="location" size={12} color="#6B7280" /> {report.location}
                        </Text>
                        <Text style={styles.outbreakUpdated}>
                          <Ionicons name="time" size={12} color="#6B7280" /> {formatDate(report.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <SeverityChip level={report.severity} />
                  </TouchableOpacity>

                  {expandedCard === report.id && (
                    <View style={styles.expandedContent}>
                      {report.imageUrl && (
                        <Image 
                          source={{ uri: report.imageUrl }} 
                          style={styles.diseaseImage}
                          resizeMode="cover"
                        />
                      )}

                      <Text style={styles.sectionHeader}>Description</Text>
                      <Text style={styles.outbreakDescription}>
                        {report.description || 'No description provided'}
                      </Text>

                      <TouchableOpacity 
                        style={styles.reportButton}
                        onPress={() => navigation.navigate('ReportOutbreakScreen', { disease: report.diseaseName })}
                      >
                        <Text style={styles.reportButtonText}>
                          <Ionicons name="add-circle" size={16} /> Add Similar Report
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#6B7280" />
              <Text style={styles.noResultsText}>No community reports match your search criteria</Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSeverityFilter(null);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {activeTab === 'agrovoc' 
              ? 'Data provided by FAO AGROVOC • Updated daily' 
              : 'Community reports from verified users'}
          </Text>
        </View>
      </ScrollView>
      {menuVisible && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              fetchCropHealthData();
              setMenuVisible(false);
            }}
          >
            <Text style={styles.menuItemText}>Refresh Screen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('ReportOutbreakScreen', { disease: '' });
              setMenuVisible(false);
            }}
          >
            <Text style={styles.menuItemText}>Go to Report Outbreak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('PendingReportsScreen');
              setMenuVisible(false);
            }}
          >
            <Text style={styles.menuItemText}>Go to Pending Reports</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  refreshButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuDropdown: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 14,
    color: '#1F2937',
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    backgroundColor: 'white',
  },
  activeFilterAll: {
    backgroundColor: '#46a200',
    borderColor: '#46a200',
  },
  activeFilterMild: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  activeFilterModerate: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  activeFilterSevere: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeFilterTextAll: {
    color: 'white',
  },
  activeFilterTextMild: {
    color: 'white',
  },
  activeFilterTextModerate: {
    color: 'black',
  },
  activeFilterTextSevere: {
    color: 'white',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  outbreaksContainer: {
    paddingHorizontal: 16,
  },
  outbreakCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  titleContainer: {
    marginBottom: 4,
  },
  outbreakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  scientificName: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  outbreakLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  outbreakUpdated: {
    fontSize: 12,
    color: '#6B7280',
  },
  cropsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affectedCrops: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  outbreakDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  meterContainer: {
    marginVertical: 12,
  },
  meterBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  meterText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  detailColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  detailItem: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },
  reportButton: {
    backgroundColor: '#46a200',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    padding: 8,
  },
  clearFiltersText: {
    color: '#46a200',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#46a200',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#46a200',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  diseaseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
});

export default CropHealthScreen;
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from './navigationTypes';

const { width } = Dimensions.get('window');

type Disease = {
  id: string | number;
  title: string;
  description: string;
  image: string;
  severity: string;
  type: string;
  severityColor: string;
  typeColor?: string;
  symptoms?: string[];
  prevention?: string[];
  treatment?: string[];
  affectedCrops?: string[];
  spreadMethod?: string;
  lifecycle?: string;
};

type DiseaseDetailProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CropDiseaseDetailScreen'>;
  route: RouteProp<RootStackParamList, 'CropDiseaseDetailScreen'>;
};

const defaultDisease: Disease = {
  id: '0',
  title: 'Unknown Disease',
  description: 'No description available for this disease.',
  image: 'https://via.placeholder.com/800x800',
  severity: 'Unknown',
  type: 'General',
  severityColor: '#6B7280',
  typeColor: '#60A5FA',
  symptoms: [
    'Yellowing or browning of leaves',
    'Stunted growth',
    'Lesions on stems or leaves',
    'Reduced yield',
    'Wilting or drooping plants'
  ],
  prevention: [
    'Use disease-resistant varieties',
    'Practice crop rotation',
    'Ensure proper spacing for air circulation',
    'Use clean, certified seeds',
    'Monitor crops regularly for early signs'
  ],
  treatment: [
    'Remove and destroy infected plants',
    'Apply appropriate fungicides',
    'Adjust irrigation practices',
    'Improve soil drainage',
    'Use biological controls when available'
  ],
  affectedCrops: ['Various crops'],
  spreadMethod: 'Wind, water, contaminated tools, or insects',
  lifecycle: 'Varies by pathogen type (fungal, bacterial, viral)'
};

const CropDiseaseDetailScreen: React.FC<DiseaseDetailProps> = ({ navigation, route }) => {
  const disease = route?.params?.disease || defaultDisease;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this crop disease: ${disease.title}\n\nDescription: ${disease.description}\n\nSeverity: ${disease.severity}\n\nRecommended actions: ${disease.treatment?.join('\n• ') || 'No specific treatment available'}`,
        title: `Crop Disease: ${disease.title}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openExternalResources = () => {
    Linking.openURL('https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests/en/');
  };

  const renderListItems = (items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return <Text style={styles.sectionContent}>No information available</Text>;
    }
    return items.map((item, index) => (
      <View key={index} style={styles.listItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.listItemText}>{item}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#46a200', '#39D2C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disease Details</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Disease Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: disease.image }} 
            style={styles.diseaseImage}
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/800x800' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.imageBadgeContainer}>
            <View style={[styles.severityBadge, { backgroundColor: disease.severityColor }]}>
              <Text style={styles.severityText}>{disease.severity}</Text>
            </View>
            <View style={[styles.typeBadge, disease.typeColor ? { backgroundColor: disease.typeColor } : null]}>
              <Text style={styles.typeText}>{disease.type}</Text>
            </View>
          </View>
        </View>

        {/* Disease Info */}
        <View style={styles.contentContainer}>
          <Text style={styles.diseaseTitle}>{disease.title}</Text>
          
          {/* Quick Facts */}
          <View style={styles.quickFactsContainer}>
            <View style={styles.quickFact}>
              <MaterialIcons name="local-florist" size={20} color="#46a200" />
              <Text style={styles.quickFactText}>
                <Text style={styles.quickFactLabel}>Affected Crops: </Text>
                {disease.affectedCrops?.join(', ') || 'Various'}
              </Text>
            </View>
            <View style={styles.quickFact}>
              <MaterialIcons name="public" size={20} color="#46a200" />
              <Text style={styles.quickFactText}>
                <Text style={styles.quickFactLabel}>Spread: </Text>
                {disease.spreadMethod || 'Various methods'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#46a200" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.sectionContent}>{disease.description}</Text>
          </View>

          {/* Symptoms */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <Text style={styles.sectionTitle}>Symptoms</Text>
            </View>
            {renderListItems(disease.symptoms)}
          </View>

          {/* Prevention */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Prevention</Text>
            </View>
            {renderListItems(disease.prevention)}
          </View>

          {/* Treatment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Treatment</Text>
            </View>
            {renderListItems(disease.treatment)}
          </View>

          {/* Lifecycle */}
          {disease.lifecycle && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="repeat" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Lifecycle</Text>
              </View>
              <Text style={styles.sectionContent}>{disease.lifecycle}</Text>
            </View>
          )}

          {/* Additional Resources */}
          <TouchableOpacity 
            style={styles.resourcesButton}
            onPress={openExternalResources}
          >
            <Ionicons name="link" size={20} color="#46a200" />
            <Text style={styles.resourcesButtonText}>FAO Pest & Disease Resources</Text>
            <Ionicons name="chevron-forward" size={20} color="#46a200" style={styles.resourcesChevron} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  shareButton: {
    padding: 8,
  },
  imageContainer: {
    height: 250,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  diseaseImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  imageBadgeContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
  },
  severityBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  severityText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  typeBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  typeText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 14,
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  diseaseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickFactsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  quickFact: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 32 > 500 ? '48%' : '100%',
    marginBottom: 12,
    paddingRight: 12,
  },
  quickFactText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  quickFactLabel: {
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
    color: '#4B5563',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  resourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 16,
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
  resourcesButtonText: {
    flex: 1,
    marginLeft: 8,
    color: '#46a200',
    fontWeight: '600',
    fontSize: 16,
  },
  resourcesChevron: {
    marginLeft: 8,
  },
});

export default CropDiseaseDetailScreen;
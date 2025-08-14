import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { RootStackParamList } from './navigationTypes';

interface ScanDetails {
  id: string;
  plantName: string;
  scientificName: string;
  imageUrl: string;
  createdAt: Date;
  diseases: any[];
  pests: any[];
  recommendations: string[];
  nextSteps: string[];
  confidence: number;
  overallHealth: number;
  isHealthy: boolean;
}

const ScanDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanDetailsScreen'>>();
  const { scanId } = route.params;

  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  useEffect(() => {
    checkSubscription();
    const fetchScanDetails = async () => {
      try {
        if (!auth.currentUser) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const scanRef = doc(db, 'users', auth.currentUser.uid, 'scans', scanId);
        const docSnap = await getDoc(scanRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setScanDetails({
            id: docSnap.id,
            plantName: data.plantName || 'Unknown Plant',
            scientificName: data.scientificName || '',
            imageUrl: data.imageUrl || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            diseases: data.diseases || [],
            pests: data.pests || [],
            recommendations: data.recommendations || [],
            nextSteps: data.nextSteps || [],
            confidence: data.confidence || 0,
            overallHealth: data.overallHealth || 100,
            isHealthy: data.isHealthy !== undefined ? data.isHealthy : (data.diseases?.length === 0 && data.pests?.length === 0),
          });
        } else {
          setError('Scan not found');
        }
      } catch (err) {
        console.error('Error fetching scan details:', err);
        setError('Failed to load scan details');
      } finally {
        setLoading(false);
      }
    };

    fetchScanDetails();
  }, [scanId]);

  const checkSubscription = async () => {
    if (!auth.currentUser) {
      setHasPremiumAccess(false);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.subscription) {
        setHasPremiumAccess(userData.subscription.tier === 'premium' && userData.subscription.status === 'active');
      } else {
        setHasPremiumAccess(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasPremiumAccess(false);
    }
  };

  const handleShare = async () => {
    if (!scanDetails) return;

    try {
      const status = scanDetails.isHealthy ? 'Healthy 🌿' : 'Unhealthy ⚠️';
      const hasDiseases = scanDetails.diseases.length > 0;
      const hasPests = scanDetails.pests.length > 0;
      
      const diseaseName = hasDiseases ? scanDetails.diseases[0]?.name || 'Disease detected' : 'No disease detected';
      const pestName = hasPests ? scanDetails.pests[0]?.name || 'Pest detected' : 'No pest detected';

      const imageDirectLink = scanDetails.imageUrl;

      const message = `🌱 My Plant Health Scan Results from Crop Guardian App\n\n` +
        `Just scanned my ${scanDetails.plantName} using Crop Guardian! Here's what I found:\n\n` +
        `🔍 Status: ${status}\n` +
        `🦠 Disease Detected: ${diseaseName}\n` +
        `🐛 Pest Detected: ${pestName}\n` +
        `📊 Overall Health: ${scanDetails.overallHealth}%\n` +
        `🎯 Confidence: ${Math.round(scanDetails.confidence * 100)}%\n\n` +
        `The app provided detailed insights on causes, treatments, and prevention methods to keep my plants thriving!\n\n` +
        `Try Crop Guardian App for your plant care needs – it's like having a botanist in your pocket!\n\n` +
        `View the scan image: ${imageDirectLink}\n\n` +
        `#PlantCare #SmartGardening #CropGuardianApp`;

      await Share.share({
        message,
        title: 'My Plant Scan Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = () => {
    return scanDetails?.isHealthy ? '#10B981' : '#EF4444';
  };

  const renderDiseaseDetails = (disease: any) => (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{disease.name}</Text>
      <Text style={styles.detailSubtitle}>{disease.scientificName}</Text>
      
      {hasPremiumAccess ? (
        <>
          {disease.description && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{disease.description}</Text>
            </View>
          )}
          
          {disease.causes && disease.causes.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Causes:</Text>
              {disease.causes.map((cause: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {cause}</Text>
              ))}
            </View>
          )}
          
          {disease.symptoms && disease.symptoms.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Symptoms:</Text>
              {disease.symptoms.map((symptom: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {symptom}</Text>
              ))}
            </View>
          )}
          
          {disease.treatments && disease.treatments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Treatments:</Text>
              {disease.treatments.map((treatment: any, i: number) => (
                <View key={i} style={styles.treatmentCard}>
                  <Text style={styles.treatmentName}>{treatment.name}</Text>
                  <Text style={styles.treatmentDescription}>{treatment.description}</Text>
                  <Text style={styles.treatmentMethod}>Method: {treatment.method}</Text>
                  <Text style={styles.treatmentFrequency}>Frequency: {treatment.frequency}</Text>
                  <Text style={styles.treatmentEffectiveness}>Effectiveness: {treatment.effectiveness}%</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeText}>Subscribe to Premium Plan to see full disease details and treatment guides</Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionScreen')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPestDetails = (pest: any) => (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{pest.name}</Text>
      <Text style={styles.detailSubtitle}>{pest.scientificName}</Text>
      
      {hasPremiumAccess ? (
        <>
          {pest.type && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{pest.type}</Text>
            </View>
          )}
          
          {pest.description && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{pest.description}</Text>
            </View>
          )}
          
          {pest.symptoms && pest.symptoms.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Damage/Symptoms:</Text>
              {pest.symptoms.map((symptom: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {symptom}</Text>
              ))}
            </View>
          )}
          
          {pest.treatments && pest.treatments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Treatments:</Text>
              {pest.treatments.map((treatment: any, i: number) => (
                <View key={i} style={styles.treatmentCard}>
                  <Text style={styles.treatmentName}>{treatment.name}</Text>
                  <Text style={styles.treatmentDescription}>{treatment.description}</Text>
                  <Text style={styles.treatmentMethod}>Method: {treatment.method}</Text>
                  <Text style={styles.treatmentFrequency}>Frequency: {treatment.frequency}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.upgradeContainer}>
          <Text style={styles.upgradeText}>Subscribe to Premium Plan to see full pest details and treatment guides</Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionScreen')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#46A200" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!scanDetails) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No scan details available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasDiseases = scanDetails.diseases.length > 0;
  const hasPests = scanDetails.pests.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#46A200', '#39D2C0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButtonIcon} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Details</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: scanDetails.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {scanDetails.isHealthy ? 'Healthy' : 'Unhealthy'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plant Name</Text>
            <Text style={styles.detailValue}>{scanDetails.plantName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scientific Name</Text>
            <Text style={styles.detailValue}>{scanDetails.scientificName || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scan Date</Text>
            <Text style={styles.detailValue}>
              {scanDetails.createdAt.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence Score</Text>
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { width: `${Math.min(scanDetails.confidence * 100, 100)}%` }]} />
              <Text style={styles.confidenceText}>{Math.round(scanDetails.confidence * 100)}%</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Overall Health</Text>
            <View style={styles.healthContainer}>
              <View style={[styles.healthBar, { width: `${scanDetails.overallHealth}%` }]} />
              <Text style={styles.healthText}>{scanDetails.overallHealth}%</Text>
            </View>
          </View>

          {hasDiseases && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Diseases Detected ({scanDetails.diseases.length})</Text>
              </View>
              {scanDetails.diseases.map((disease, index) => renderDiseaseDetails(disease))}
            </>
          )}

          {hasPests && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Pests Detected ({scanDetails.pests.length})</Text>
              </View>
              {scanDetails.pests.map((pest, index) => renderPestDetails(pest))}
            </>
          )}

          {scanDetails.recommendations && scanDetails.recommendations.length > 0 && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
              </View>
              <View style={styles.detailSection}>
                {scanDetails.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.bulletItem}>• {rec}</Text>
                ))}
              </View>
            </>
          )}

          {scanDetails.nextSteps && scanDetails.nextSteps.length > 0 && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
              </View>
              <View style={styles.detailSection}>
                {scanDetails.nextSteps.map((step, index) => (
                  <Text key={index} style={styles.bulletItem}>• {step}</Text>
                ))}
              </View>
            </>
          )}

          {!hasDiseases && !hasPests && (
            <View style={styles.healthyStatus}>
              <Ionicons name="checkmark-circle" size={24} color="#46A200" />
              <Text style={styles.healthyText}>Plant appears to be healthy! No diseases or pests detected.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#46A200',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  backButtonIcon: {
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
  shareButton: {
    padding: 8,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    paddingHorizontal: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#46A200',
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  healthBar: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginRight: 8,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailSection: {
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    marginBottom: 4,
  },
  treatmentCard: {
    backgroundColor: '#e9f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  treatmentName: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  treatmentMethod: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  treatmentFrequency: {
    fontSize: 12,
    color: '#666',
  },
  treatmentEffectiveness: {
    fontSize: 12,
    color: '#666',
  },
  healthyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  healthyText: {
    marginLeft: 10,
    color: '#46A200',
    fontWeight: 'bold',
    fontSize: 16,
  },
  upgradeContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  upgradeButton: {
    backgroundColor: '#46A200',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ScanDetailsScreen;
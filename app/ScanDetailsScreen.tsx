import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';

interface ScanDetails {
  id: string;
  plantName: string;
  imageUrl: string;
  createdAt: Date;
  diseaseName: string;
  cause: string;
  treatment: string;
  prevention: string;
  pestName: string;
  pestPrevention: string;
}

const ScanDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanDetailsScreen'>>();
  const { scanId } = route.params;

  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
            imageUrl: data.imageUrl || '', // This should be the ImgBB URL
            createdAt: data.createdAt?.toDate() || new Date(),
            diseaseName: data.diseaseName || 'No disease detected',
            cause: data.cause || 'N/A',
            treatment: data.treatment || 'N/A',
            prevention: data.prevention || 'N/A',
            pestName: data.pestName || 'No pest detected',
            pestPrevention: data.pestPrevention || 'N/A',
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

  const handleShare = async () => {
    if (!scanDetails) return;

    try {
      const status = scanDetails.diseaseName === 'No disease detected' ? 'Healthy 🌿' : 'Unhealthy ⚠️';

      const imageDirectLink = scanDetails.imageUrl;

      const message = `🌱 My Plant Health Scan Results from Crop Guardian App\n\n` +
        `Just scanned my ${scanDetails.plantName} using Crop Guardian! Here's what I found:\n\n` +
        `🔍 Status: ${status}\n` +
        `🦠 Disease Detected: ${scanDetails.diseaseName}\n` +
        `🐛 Pest Detected: ${scanDetails.pestName}\n\n` +
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
    return scanDetails?.diseaseName === 'No disease detected' ? '#10B981' : '#EF4444';
  };

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
              {scanDetails.diseaseName === 'No disease detected' ? 'Healthy' : 'Unhealthy'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plant Name</Text>
            <Text style={styles.detailValue}>{scanDetails.plantName}</Text>
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

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Disease Information</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disease</Text>
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {scanDetails.diseaseName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cause</Text>
            <Text style={styles.detailValue}>{scanDetails.cause}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Treatment</Text>
            <Text style={styles.detailValue}>{scanDetails.treatment}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prevention</Text>
            <Text style={styles.detailValue}>{scanDetails.prevention}</Text>
          </View>

          {scanDetails.pestName !== 'No pest detected' && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Pest Information</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pest</Text>
                <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                  {scanDetails.pestName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pest Prevention</Text>
                <Text style={styles.detailValue}>{scanDetails.pestPrevention}</Text>
              </View>
            </>
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
});

export default ScanDetailsScreen;
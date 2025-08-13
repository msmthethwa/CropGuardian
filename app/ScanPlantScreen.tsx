import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { plantModel } from '../utils/plantModelFixed';
import { getDiseaseInfo, getPestInfo } from '../utils/diseaseData';
import apiKeys from '../config/apiKeys';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { auth, db } from '../firebaseConfig';
import * as FileSystem from 'expo-file-system';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImageToImgBB } from '../utils/imgbb';
import { SubscriptionManager } from '../utils/subscription';

interface PlantHealthResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  diseases: any[];
  pests: any[];
  overallHealth: number;
  recommendations: string[];
  nextSteps: string[];
  scanDate: Date;
  imageUrl: string;
}

const ScanPlantScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScanPlantScreen'>>();
  const userName = route.params?.userName || 'User';
  const [hasResult, setHasResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [results, setResults] = useState<PlantHealthResult>({
    plantName: '',
    scientificName: '',
    confidence: 0,
    isHealthy: true,
    diseases: [],
    pests: [],
    overallHealth: 100,
    recommendations: [],
    nextSteps: [],
    scanDate: new Date(),
    imageUrl: '',
  });
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (hasResult && !hasSaved) {
      saveScanResults();
    }
  }, [hasResult, hasSaved]);

  const saveScanResults = async () => {
    if (!auth.currentUser || !imageUri || !hasResult) return;

    try {
      const userId = auth.currentUser.uid;
      const scansCollectionRef = collection(db, 'users', userId, 'scans');
      
      const scanData = {
        ...results,
        imageUrl: imageUri,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Additional fields for better display
        scientificName: results.scientificName || '',
        confidence: results.confidence || 0,
        overallHealth: results.overallHealth || 100,
        recommendations: results.recommendations || [],
        nextSteps: results.nextSteps || [],
      };

      const docRef = await addDoc(scansCollectionRef, scanData);
      
      // Mark as saved but don't navigate automatically
      setHasSaved(true);
      
    } catch (error) {
      console.error('Error saving scan results:', error);
      Alert.alert('Error', 'Failed to save scan results. Please try again.');
    }
  };

  const handleImageProcessing = async (base64Image: string) => {
    setIsLoading(true);
    try {
      // Use the AI model to analyze the image
      const result = await plantModel.analyzeImage(`data:image/jpeg;base64,${base64Image}`);

      setResults(result);
      setHasResult(true);
    } catch (error) {
      console.error('Model Error:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePicture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsLoading(true);
      try {
        const imgbbUrl = await uploadImageToImgBB(result.assets[0].base64);
        setImageUri(imgbbUrl);
        await handleImageProcessing(result.assets[0].base64);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUploadPicture = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsLoading(true);
      try {
        const imgbbUrl = await uploadImageToImgBB(result.assets[0].base64);
        setImageUri(imgbbUrl);
        await handleImageProcessing(result.assets[0].base64);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#46A200" />
          <Text style={styles.loadingText}>Analyzing Image...</Text>
        </View>
      )}
      <View style={styles.container}>
        <LinearGradient
          colors={['#46a200', '#39D2C0']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plant Scanner</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('PlantScanHistoryScreen')}
            style={styles.profileButton}
          >
            <LinearGradient
              colors={['#46a200', '#39D2C0']}
              style={styles.profileIcon}
            >
              <Ionicons name="time" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.scrollView}>
          {/* Image Display */}
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="leaf-outline" size={64} color="white" />
                <Text style={styles.imagePlaceholderTitle}>Scan Your Plant</Text>
                <Text style={styles.imagePlaceholderSubtitle}>
                  Take or upload a photo to identify plants and diagnose issues
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleTakePicture}
                disabled={isLoading}
              >
                <MaterialIcons name="camera-alt" size={24} color="white" />
                <Text style={styles.buttonTextPrimary}>Take a Picture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleUploadPicture}
                disabled={isLoading}
              >
                <MaterialIcons name="upload" size={24} color="#46A200" />
                <Text style={styles.buttonTextSecondary}>Upload a Picture</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Results Section */}
          {hasResult ? (
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Scan Results</Text>
          <TouchableOpacity onPress={() => {
            setHasResult(false);
            setHasSaved(false);
            setImageUri(null);
            setResults({
              plantName: '',
              scientificName: '',
              confidence: 0,
              isHealthy: true,
              diseases: [],
              pests: [],
              overallHealth: 100,
              recommendations: [],
              nextSteps: [],
              scanDate: new Date(),
              imageUrl: '',
            });
          }}>
            <MaterialIcons name="refresh" size={24} color="#46A200" />
          </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Plant Name</Text>
                <Text style={styles.resultValue}>{results.plantName}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Scientific Name</Text>
                <Text style={styles.resultValue}>{results.scientificName}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Health Status</Text>
                <Text style={styles.resultValue}>{results.isHealthy ? 'Healthy' : 'Issues Detected'}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Overall Health</Text>
                <Text style={styles.resultValue}>{results.overallHealth}%</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Diseases</Text>
                <Text style={styles.resultValue}>{results.diseases.length > 0 ? results.diseases.map(d => d.name).join(', ') : 'None detected'}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Pests</Text>
                <Text style={styles.resultValue}>{results.pests.length > 0 ? results.pests.map(p => p.name).join(', ') : 'None detected'}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Recommendations</Text>
                <Text style={styles.resultValue}>{results.recommendations.join('\n')}</Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Next Steps</Text>
                <Text style={styles.resultValue}>{results.nextSteps.join('\n')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Scan or upload a plant photo to see results
              </Text>
            </View>
          )}

          {/* Save Results Button */}
          {/* Removed Save Results Button for automatic saving */}
          {/*
          {hasResult && (
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveScanResults}
              >
                <Text style={styles.saveButtonText}>Save Results</Text>
              </TouchableOpacity>
            </View>
          )}
          */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#46A200',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  profileButton: {
    padding: 8,
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#46A200',
    height: 250,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imagePlaceholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    fontFamily: 'Roboto-SemiBold',
  },
  imagePlaceholderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Roboto-Regular',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#46A200',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    marginLeft: 8,
  },
  buttonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'Roboto-Medium',
  },
  buttonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'Roboto-Medium',
  },
  resultsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Roboto-SemiBold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  resultItem: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Roboto-Medium',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Roboto-Regular',
    lineHeight: 22,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Roboto-Regular',
  },
  saveButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: '#46A200',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#46A200',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default ScanPlantScreen;

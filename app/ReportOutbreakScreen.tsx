import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImageToImgBB } from '../utils/imgbb';

type FormData = {
  cropType: string;
  diseaseName: string;
  location: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | '';
  imageUri: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  userId?: string;
};

const ReportOutbreakScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [formData, setFormData] = useState<FormData>({
    cropType: '',
    diseaseName: '',
    location: '',
    description: '',
    severity: '',
    imageUri: null,
    coordinates: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);

  // Request camera roll permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload outbreak images.');
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      }));

      const address = await Location.reverseGeocodeAsync(location.coords);
      if (address.length > 0) {
        const loc = `${address[0].city || address[0].subregion}, ${address[0].region}, ${address[0].country}`;
        setFormData(prev => ({ ...prev, location: loc }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setFormData(prev => ({
          ...prev,
          imageUri: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Convert image URI to base64 string
  const uriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const uploadImage = async (uri: string) => {
    try {
      setImageUploadProgress(0);
      const base64Image = await uriToBase64(uri);
      const url = await uploadImageToImgBB(base64Image);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setImageUploadProgress(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.cropType || !formData.diseaseName || !formData.severity) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (formData.imageUri) {
        imageUrl = await uploadImage(formData.imageUri);
      }

      const reportData = {
        cropType: formData.cropType,
        diseaseName: formData.diseaseName,
        location: formData.location,
        description: formData.description,
        severity: formData.severity,
        imageUrl,
        coordinates: formData.coordinates,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending', // pending/approved/rejected
      };

      await addDoc(collection(db, 'outbreakReports'), reportData);

      Alert.alert(
        'Report Submitted',
        'Thank you for reporting this outbreak. Agricultural authorities will review your submission.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate({ name: 'HomeScreen', params: { userName: '' } })
          }
        ]
      );
      
      // Reset form after successful submission
      setFormData({
        cropType: '',
        diseaseName: '',
        location: '',
        description: '',
        severity: '',
        imageUri: null,
        coordinates: null
      });
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={styles.headerTitle}>Report Outbreak</Text>
          <View style={styles.headerRightPlaceholder} />
        </LinearGradient>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionHeader}>Outbreak Details</Text>

          {/* Crop Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Crop Type <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Rice, Wheat, Corn"
              value={formData.cropType}
              onChangeText={text => setFormData({ ...formData, cropType: text })}
            />
          </View>

          {/* Disease Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Disease Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Rice Blast, Wheat Rust"
              value={formData.diseaseName}
              onChangeText={text => setFormData({ ...formData, diseaseName: text })}
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                placeholder="e.g., Village, District, Country"
                value={formData.location}
                onChangeText={text => setFormData({ ...formData, location: text })}
              />
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name="location" size={20} color="#46a200" />
              </TouchableOpacity>
            </View>
            {locationError && (
              <Text style={styles.errorText}>{locationError}</Text>
            )}
          </View>

          {/* Severity */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Severity <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.severityContainer}>
              {(['Low', 'Medium', 'High'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    formData.severity === level && styles.selectedSeverity
                  ]}
                  onPress={() => setFormData({ ...formData, severity: level })}
                >
                  <Text 
                    style={[
                      styles.severityText,
                      formData.severity === level && styles.selectedSeverityText
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Describe the symptoms and affected area..."
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
            />
          </View>

          {/* Image Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Upload Photo</Text>
            <TouchableOpacity 
              style={styles.imageUploadButton}
              onPress={pickImage}
            >
              {formData.imageUri ? (
                <Image 
                  source={{ uri: formData.imageUri }} 
                  style={styles.uploadedImage}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={32} color="#6B7280" />
                  <Text style={styles.uploadText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUploadProgress !== null && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${imageUploadProgress}%` }]} />
                <Text style={styles.progressText}>
                  Uploading: {Math.round(imageUploadProgress)}%
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By submitting this report, you agree that the information will be shared with agricultural authorities to help monitor and control disease outbreaks.
          </Text>
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
    paddingBottom: 40,
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
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    fontFamily: 'Roboto-Bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Roboto-Medium',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Roboto-Regular',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedSeverity: {
    backgroundColor: '#46a200',
  },
  severityText: {
    color: '#1F2937',
    fontFamily: 'Roboto-Medium',
  },
  selectedSeverityText: {
    color: 'white',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageUploadButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
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
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'Roboto-Regular',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#46a200',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  disclaimer: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
  },
  progressContainer: {
    marginTop: 8,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#46a200',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 20,
    color: '#1F2937',
    fontSize: 12,
  },
});

export default ReportOutbreakScreen;

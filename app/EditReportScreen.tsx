import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type ReportData = {
  cropType: string;
  diseaseName: string;
  location: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  imageUrl?: string;
  userId?: string;
  coordinates?: { latitude: number; longitude: number };
  createdAt?: any;
  updatedAt?: any;
  status?: 'pending' | 'approved' | 'rejected';
};

const EditReportScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { reportId } = route.params as { reportId: string };

  const [report, setReport] = useState<ReportData>({
    cropType: '',
    diseaseName: '',
    location: '',
    description: '',
    severity: 'Low',
    imageUrl: undefined,
    userId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'outbreakReports', reportId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ReportData;
          setReport(data);
          if (data.imageUrl) {
            setImage(data.imageUrl);
          }
          // Check if current user is the owner
          if (auth.currentUser && data.userId === auth.currentUser.uid) {
            setIsOwner(true);
          }
        } else {
          Alert.alert('Error', 'Report not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        Alert.alert('Error', 'Failed to load report');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `report_images/${reportId}_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!isOwner) {
      Alert.alert('Error', 'You can only edit your own reports');
      return;
    }

    try {
      setSaving(true);
      let imageUrl = report.imageUrl;

      // Validate required fields before update
      if (!report.cropType || !report.diseaseName || !report.location || !report.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        setSaving(false);
        return;
      }

      // Upload new image if selected
      if (image && image !== report.imageUrl) {
        imageUrl = await uploadImage(image);
      }

      const docRef = doc(db, 'outbreakReports', reportId);
      await updateDoc(docRef, {
        cropType: report.cropType,
        diseaseName: report.diseaseName,
        location: report.location,
        description: report.description,
        severity: report.severity,
        imageUrl: imageUrl,
        coordinates: report.coordinates,
        updatedAt: new Date(),
        ...(report.status && { status: report.status }),
        ...(report.userId && { userId: report.userId }),
        ...(report.createdAt && { createdAt: report.createdAt }),
      });

      Alert.alert('Success', 'Report updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#46a200" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notOwnerContainer}>
          <Ionicons name="warning" size={48} color="#DC2626" />
          <Text style={styles.notOwnerText}>You can only edit your own reports</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Edit Report</Text>
              <Text style={styles.headerSubtitle}>
                Update your outbreak report
              </Text>
            </View>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Image Upload */}
          <TouchableOpacity 
            style={styles.imageUploadContainer}
            onPress={pickImage}
          >
            {image ? (
              <Image 
                source={{ uri: image }} 
                style={styles.reportImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#6B7280" />
                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Disease Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Disease Name*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter disease name"
              value={report.diseaseName}
              onChangeText={(text) => setReport({...report, diseaseName: text})}
            />
          </View>

          {/* Crop Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Crop Type*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter crop type"
              value={report.cropType}
              onChangeText={(text) => setReport({...report, cropType: text})}
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={report.location}
              onChangeText={(text) => setReport({...report, location: text})}
            />
            {report.coordinates && (
              <Text style={styles.coordinatesText}>
                Coordinates: {report.coordinates.latitude.toFixed(4)}, {report.coordinates.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          {/* Severity */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Severity</Text>
            <View style={styles.severityButtons}>
              <TouchableOpacity
                style={[
                  styles.severityButton,
                  report.severity === 'Low' && styles.severityButtonActiveLow
                ]}
                onPress={() => setReport({...report, severity: 'Low'})}
              >
                <Text style={[
                  styles.severityButtonText,
                  report.severity === 'Low' && styles.severityButtonTextActive
                ]}>
                  Low
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.severityButton,
                  report.severity === 'Medium' && styles.severityButtonActiveMedium
                ]}
                onPress={() => setReport({...report, severity: 'Medium'})}
              >
                <Text style={[
                  styles.severityButtonText,
                  report.severity === 'Medium' && styles.severityButtonTextActive
                ]}>
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.severityButton,
                  report.severity === 'High' && styles.severityButtonActiveHigh
                ]}
                onPress={() => setReport({...report, severity: 'High'})}
              >
                <Text style={[
                  styles.severityButtonText,
                  report.severity === 'High' && styles.severityButtonTextActive
                ]}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description*</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              value={report.description}
              onChangeText={(text) => setReport({...report, description: text})}
            />
          </View>

          {/* Status Display */}
          {report.status && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                report.status === 'approved' && styles.statusDotApproved,
                report.status === 'rejected' && styles.statusDotRejected
              ]} />
              <Text style={[
                styles.statusText,
                report.status === 'approved' && styles.statusApproved,
                report.status === 'rejected' && styles.statusRejected
              ]}>
                {report.status.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
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
  headerRightPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  notOwnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notOwnerText: {
    marginTop: 16,
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButtonText: {
    marginTop: 20,
    color: '#46a200',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  reportImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  severityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  severityButtonActiveLow: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  severityButtonActiveMedium: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  severityButtonActiveHigh: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  severityButtonTextActive: {
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#F59E0B', // pending color
  },
  statusDotApproved: {
    backgroundColor: '#10B981', // approved color
  },
  statusDotRejected: {
    backgroundColor: '#DC2626', // rejected color
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B', // pending color
  },
  statusApproved: {
    color: '#10B981', // approved color
  },
  statusRejected: {
    color: '#DC2626', // rejected color
  },
  saveButton: {
    backgroundColor: '#46a200',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditReportScreen;
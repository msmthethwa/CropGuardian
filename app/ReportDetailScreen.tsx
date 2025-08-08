import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadImageToImgBB } from '../utils/imgbb';
import * as ImagePicker from 'expo-image-picker';

type Report = {
  id: string;
  cropType: string;
  diseaseName: string;
  location: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  imageUrl?: string;
  coordinates?: { latitude: number; longitude: number };
  userId: string;
  createdAt: any;
  updatedAt?: any;
  status: 'pending' | 'approved' | 'rejected';
};

const ReportDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { reportId } = route.params as { reportId: string };

  const [report, setReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<Partial<Report>>({});
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'outbreakReports', reportId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Report;
          setReport(data);
          setEditedReport({ ...data });
        } else {
          Alert.alert('Error', 'Report not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching report:', error);
        Alert.alert('Error', 'Failed to fetch report');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, navigation]);

  // Check if the report can be edited (within 30 minutes of creation and not rejected)
  useEffect(() => {
    const checkEditAvailability = () => {
      if (!report?.createdAt) return false;

      const createdAt = report.createdAt.toDate();
      const now = new Date();
      const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      setCanEdit(diffInMinutes <= 30 && report.userId === auth.currentUser?.uid && report.status !== 'rejected');
    };

    checkEditAvailability();
  }, [report]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUploading(true);
        const uri = result.assets[0].uri;
        const imageUrl = await uploadImageToImgBB(uri);
        setEditedReport(prev => ({ ...prev, imageUrl }));
        setImageUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
      setImageUploading(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editedReport.cropType || !editedReport.diseaseName || !editedReport.severity) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const reportRef = doc(db, 'outbreakReports', report.id);
      await updateDoc(reportRef, {
        ...editedReport,
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Report updated successfully');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, 'outbreakReports', report.id));
              Alert.alert('Success', 'Report deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderField = (label: string, value: string, fieldName: keyof Report) => {
    if (isEditing) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.editInput}
            value={editedReport[fieldName] as string}
            onChangeText={(text) => setEditedReport(prev => ({ ...prev, [fieldName]: text }))}
          />
        </View>
      );
    }
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'Not specified'}</Text>
      </View>
    );
  };

  const renderSeverity = () => {
    if (isEditing) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityContainer}>
            {(['Low', 'Medium', 'High'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  editedReport.severity === level && styles.selectedSeverity
                ]}
                onPress={() => setEditedReport(prev => ({ ...prev, severity: level }))}
              >
                <Text 
                  style={[
                    styles.severityText,
                    editedReport.severity === level && styles.selectedSeverityText
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Severity</Text>
        <Text style={styles.value}>{report?.severity}</Text>
      </View>
    );
  };

  if (loading || !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#46a200" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Status Badge */} 
        {report?.status && (
          <View style={[styles.statusBadge, { 
            backgroundColor: report.status === 'approved' ? '#46a200' : 
                           report.status === 'rejected' ? '#EF4444' : '#F59E0B'
          }]}>
            <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
          </View>
        )}

        {/* Report Image */}
        {editedReport.imageUrl ? (
          <TouchableOpacity 
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing}
          >
            <Image
              source={{ uri: editedReport.imageUrl }}
              style={styles.reportImage}
              resizeMode="cover"
            />
            {isEditing && (
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={32} color="white" />
                <Text style={styles.imageOverlayText}>Change Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : isEditing ? (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickImage}
          >
            <Ionicons name="camera" size={32} color="#6B7280" />
            <Text style={styles.uploadText}>Add Photo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image" size={48} color="#6B7280" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}

        {/* Report Details */}
        {renderField('Crop Type', editedReport.cropType || report?.cropType, 'cropType')}
        {renderField('Disease Name', editedReport.diseaseName || report?.diseaseName, 'diseaseName')}
        {renderField('Location', editedReport.location || report?.location, 'location')}
        
        {renderSeverity()}

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editInput, styles.multilineInput]}
              value={editedReport.description || report.description}
              onChangeText={(text) => setEditedReport(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.value}>
              {report?.description || 'No description provided'}
            </Text>
          )}
        </View>

        {/* Coordinates */}
        {report?.coordinates && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Coordinates</Text>
            <Text style={styles.value}>
              {report.coordinates.latitude.toFixed(6)}, {report.coordinates.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Dates */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Reported On</Text>
          <Text style={styles.value}>
            {report?.createdAt ? formatDate(report.createdAt.toDate()) : 'Unknown'}
          </Text>
        </View>

        {report?.updatedAt && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Last Updated</Text>
            <Text style={styles.value}>
              {formatDate(report.updatedAt.toDate())}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDeleteReport}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {!canEdit && report?.status === 'pending' && (
          <Text style={styles.editNotice}>
            Note: Reports can only be edited within 30 minutes of submission.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  reportImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageOverlayText: {
    color: 'white',
    marginTop: 8,
  },
  uploadButton: {
    height: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
  },
  uploadText: {
    color: '#6B7280',
    marginTop: 8,
  },
  noImage: {
    height: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  noImageText: {
    color: '#6B7280',
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  editInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
    fontWeight: '500',
  },
  selectedSeverityText: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  saveButton: {
    backgroundColor: '#46a200',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  editNotice: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ReportDetailScreen;
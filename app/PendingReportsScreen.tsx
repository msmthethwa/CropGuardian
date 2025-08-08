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
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

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
  status: 'pending' | 'approved' | 'rejected';
};

const adminUserIds = [
  'adminUserId1', // Replace with actual admin user IDs
  'adminUserId2',
];

const PendingReportsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isAdmin = currentUserId ? adminUserIds.includes(currentUserId) : false;

  const fetchPendingReports = async () => {
    try {
      const q = query(
        collection(db, 'outbreakReports'),
        where('status', 'in', ['pending', 'rejected'])
      );
      const querySnapshot = await getDocs(q);
      const reportsData: Report[] = [];
      
      querySnapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data(),
        } as Report);
      });

      // Sort by newest first
      reportsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to fetch pending and rejected reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingReports();
  };

  const handleApprove = async (reportId: string) => {
    try {
      const reportRef = doc(db, 'outbreakReports', reportId);
      await updateDoc(reportRef, {
        status: 'approved',
        updatedAt: new Date(),
        reviewedBy: auth.currentUser?.uid,
      });
      setReports(reports.filter(report => report.id !== reportId));
      Alert.alert('Success', 'Report approved successfully');
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report');
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      const reportRef = doc(db, 'outbreakReports', reportId);
      await updateDoc(reportRef, {
        status: 'rejected',
        updatedAt: new Date(),
        reviewedBy: auth.currentUser?.uid,
      });
      setReports(reports.filter(report => report.id !== reportId));
      Alert.alert('Success', 'Report rejected successfully');
    } catch (error) {
      console.error('Error rejecting report:', error);
      Alert.alert('Error', 'Failed to reject report');
    }
  };

  const navigateToReportDetail = (report: Report) => {
    navigation.navigate('ReportDetailScreen', { reportId: report.id });
  };

  const navigateToEditReport = (report: Report) => {
    navigation.navigate('EditReportScreen', { reportId: report.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
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
        <Text style={styles.headerTitle}>Pending Reports</Text>
        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#46a200']}
          />
        }
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No pending or rejected reports</Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <TouchableOpacity onPress={() => navigateToReportDetail(report)}>
                <View style={styles.reportHeader}>
                  <Text style={styles.cropName}>{report.cropType}</Text>
                  <Text style={styles.diseaseName}>{report.diseaseName}</Text>
                </View>
                
                {report.imageUrl && (
                  <Image
                    source={{ uri: report.imageUrl }}
                    style={styles.reportImage}
                    resizeMode="cover"
                  />
                )}
                
                <View style={styles.reportDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{report.location || 'Location not specified'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="warning" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>Severity: {report.severity}</Text>
                  </View>
                  
                  {report.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                {isAdmin ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => navigateToEditReport(report)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={[styles.statusIndicator, styles[report.status]]}>
                    <Text style={styles.statusText}>{report.status.charAt(0).toUpperCase() + report.status.slice(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  diseaseName: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  reportImage: {
    width: '100%',
    height: 200,
  },
  reportDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 14,
  },
  descriptionText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#46a200',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#2563EB',
  },
  statusIndicator: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: {
    backgroundColor: '#FBBF24',
  },
  approved: {
    backgroundColor: '#22C55E',
  },
  rejected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PendingReportsScreen;
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { useNavigation } from '@react-navigation/native';

type UserManualScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserManualScreen'>;

const UserManualScreen: React.FC = () => {
  const navigation = useNavigation<UserManualScreenNavigationProp>();

  const manualSections = [
    {
      title: 'Overview',
      content: 'Crop Guardian is a mobile and web application designed for farmers and agricultural professionals to manage crop health with the power of AI-driven diagnostics, community collaboration, and real-time insights.'
    },
    {
      title: 'Getting Started',
      content: 'Download & Install the app from the Google Play Store or Apple App Store. Launch the app to reach the Welcome Screen. Tap "Get Started" to begin the login or sign-up process.'
    },
    {
      title: 'Authentication',
      content: 'Sign In using your email and password. Sign Up if you\'re new. Email verification is required. Tap "Forgot Password?" to reset via email.'
    },
    {
      title: 'Home Screen',
      content: 'Upon login, you are greeted with a personalized welcome message, profile image, recent notifications, and grid menu with navigation to various features.'
    },
    {
      title: 'Scan Plant',
      content: 'Diagnose your crops with AI: Tap Scan Plant, choose to take a photo or upload from gallery, the image is analyzed to identify disease, pest, and recommended treatment.'
    },
    {
      title: 'Disease Guide',
      content: 'Explore a detailed list of plant diseases. Search by disease name and tap a disease to view symptoms, severity, prevention, and treatment.'
    },
    {
      title: 'AI Treatment Advice',
      content: 'Get AI-powered treatment suggestions. Enter the disease/pest name and receive categorized solutions: Organic, Chemical, and Preventive.'
    },
    {
      title: 'Pest Risk Analyst',
      content: 'Analyze pest threats based on weather & location. Features include auto-detect location, weather forecast with rain risk, and tips for crop protection.'
    },
    {
      title: 'Community Chat',
      content: 'Engage with fellow farmers and experts. Send messages or images, reply, edit, delete, like, dislike, and access Community Guidelines.'
    },
    {
      title: 'Plant Scan History',
      content: 'Access past diagnoses. View all scan results, search by plant, disease, pest, filter by health status, and tap for full scan detail.'
    },
    {
      title: 'Crop Health Monitor',
      content: 'Stay informed on crop outbreaks from Global Reports and Community Reports. Features include local detection, search and severity filters.'
    },
    {
      title: 'Report New Outbreak',
      content: 'Submit a disease outbreak by entering crop, disease, severity, location, description, and uploading an image.'
    },
    {
      title: 'Support & Feedback',
      content: 'Email: support@cropguardian.app or use the community chat for quick tips and answers.'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#46A200" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Manual</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Crop Guardian App - User Manual</Text>
        
        {manualSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Crop Guardian empowers farmers with technology to detect, prevent, and treat crop issues swiftly and accurately.
          </Text>
          <Text style={styles.footerText}>
            Happy Farming!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#46A200',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#46A200',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default UserManualScreen;

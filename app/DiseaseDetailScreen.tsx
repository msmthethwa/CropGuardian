import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './navigationTypes';

type DiseaseDetailScreenRouteProp = RouteProp<RootStackParamList, 'DiseaseDetailScreen'>;

const DiseaseDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DiseaseDetailScreenRouteProp>();
  const { disease } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#46a200', '#39D2C0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disease Details</Text>
        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: disease.image }} style={styles.diseaseImage} />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{disease.title}</Text>
          
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: disease.severityColor }]}>
              <Text style={styles.tagText}>Severity: {disease.severity}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: disease.typeColor }]}>
              <Text style={styles.tagText}>Type: {disease.type}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>
              {disease.description || 'No detailed description available for this disease.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <Text style={styles.sectionText}>
              • Yellowing or browning of leaves{'\n'}
              • Spots or lesions on plant surfaces{'\n'}
              • Stunted growth or wilting{'\n'}
              • Abnormal growth patterns
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment</Text>
            <Text style={styles.sectionText}>
              1. Remove and destroy infected plant parts{'\n'}
              2. Apply appropriate fungicide or pesticide{'\n'}
              3. Improve air circulation around plants{'\n'}
              4. Adjust watering practices to avoid excess moisture
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prevention</Text>
            <Text style={styles.sectionText}>
              • Use disease-resistant plant varieties{'\n'}
              • Maintain proper plant spacing{'\n'}
              • Practice crop rotation{'\n'}
              • Keep tools and equipment clean
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.externalLinkButton}
            onPress={() => openExternalLink('https://www.apsnet.org/')}
          >
            <Text style={styles.externalLinkText}>Learn more on APSnet</Text>
            <Ionicons name="open-outline" size={20} color="#46A200" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    marginBottom: 12,
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
    fontFamily: 'Raleway-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  diseaseImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'Roboto-Bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tag: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Roboto-SemiBold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Roboto-SemiBold',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    fontFamily: 'Roboto-Regular',
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#46A200',
    borderRadius: 8,
    marginTop: 16,
  },
  externalLinkText: {
    color: '#46A200',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Roboto-SemiBold',
  },
});

export default DiseaseDetailScreen;
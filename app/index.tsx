import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Index: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#46a200', '#249689']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://i.ibb.co/23rm1rVx/Minimalist-Overlapping-White-Leaves-Icon.png' }}
              style={{ width: 48, height: 48 }}
            />
            <Text style={styles.title}>Crop Guardian</Text>
            <Text style={styles.tagline}>Precision Farming, Powered by AI</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <Ionicons name="scan" size={32} color="#46a200" />
              <Text style={styles.featureTitle}>AI-Powered Diagnosis</Text>
              <Text style={styles.featureText}>
                Instant identification of plant diseases and pest infestations
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="people" size={32} color="#46a200" />
              <Text style={styles.featureTitle}>Expert Community</Text>
              <Text style={styles.featureText}>
                Connect with farmers and agricultural experts in real-time
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="alert" size={32} color="#46a200" />
              <Text style={styles.featureTitle}>Risk Prevention</Text>
              <Text style={styles.featureText}>
                Weather-based pest predictions and prevention strategies
              </Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    fontFamily: 'Raleway-Bold',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontFamily: 'Roboto-Italic',
  },
  featuresContainer: {
    marginTop: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a3c05',
    marginVertical: 12,
    fontFamily: 'Roboto-Medium',
  },
  featureText: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
    fontFamily: 'Roboto-Regular',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#46a200',
    borderRadius: 30,
    padding: 20,
    margin: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
    fontFamily: 'Roboto-Medium',
  },
});

export default Index;
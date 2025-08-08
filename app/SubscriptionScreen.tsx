import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

type SubscriptionTier = 'free' | 'premium';
type SubscriptionStatus = 'active' | 'inactive' | 'expired';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  tier: SubscriptionTier;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    tier: 'free',
    features: [
      'Basic plant identification',
      'Plant name display',
      'Limited scan history',
      'Community access',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 9.99,
    tier: 'premium',
    features: [
      'Full plant identification',
      'Complete disease analysis',
      'Detailed treatment guides',
      'Prevention strategies',
      'Pest identification',
      'Unlimited scan history',
      'Priority support',
      'Ad-free experience',
    ],
  },
];

const SubscriptionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState<{
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    expiryDate?: Date;
  }>({ tier: 'free', status: 'active' });

  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.subscription) {
        setUserSubscription({
          tier: userData.subscription.tier || 'free',
          status: userData.subscription.status || 'active',
          expiryDate: userData.subscription.expiryDate?.toDate(),
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoading(true);
    
    try {
      // Check if user is already on this plan
      if (userSubscription.tier === plan.tier) {
        Alert.alert(
          'Already Subscribed', 
          `You are already subscribed to ${plan.name}.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Update subscription in database
      const subscriptionData = {
        tier: plan.tier,
        status: 'active' as SubscriptionStatus,
        updatedAt: serverTimestamp(),
      };

      // Add expiry date for premium plans
      if (plan.tier === 'premium') {
        (subscriptionData as any).expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        subscription: subscriptionData,
      });
      
      // Update local state
      setUserSubscription({
        tier: plan.tier,
        status: 'active',
        expiryDate: plan.tier === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      });
      
      // Provide feedback to user
      Alert.alert(
        'Subscription Updated',
        `You have successfully changed to ${plan.name}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlan = (plan: SubscriptionPlan) => {
    const isCurrentPlan = userSubscription.tier === plan.tier;
    const isPremium = plan.tier === 'premium';

    return (
      <View key={plan.id} style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          {isCurrentPlan && <Text style={styles.currentBadge}>Current</Text>}
        </View>
        
        <Text style={styles.planPrice}>
          ${plan.price === 0 ? 'Free' : `${plan.price}/month`}
        </Text>
        
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={isPremium ? "#46A200" : "#666"} 
              />
              <Text style={[styles.featureText, isPremium && styles.premiumFeature]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.subscribeButton, isCurrentPlan && styles.disabledButton]}
          onPress={() => handleSubscribe(plan)}
          disabled={isCurrentPlan || loading}
        >
          <Text style={[styles.subscribeButtonText, isCurrentPlan && styles.disabledText]}>
            {isCurrentPlan ? 'Current Plan' : (plan.tier === 'free' ? 'Switch to Free' : 'Subscribe')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#46a200', '#39D2C0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.subscriptionInfo}>
          <Text style={styles.currentPlanText}>
            Current Plan: {userSubscription.tier.toUpperCase()}
          </Text>
          {userSubscription.expiryDate && (
            <Text style={styles.expiryText}>
              Expires: {userSubscription.expiryDate.toLocaleDateString()}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
        {subscriptionPlans.map(renderPlan)}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#46A200" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subscriptionInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentPlanText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expiryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentPlanCard: {
    borderColor: '#46A200',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  currentBadge: {
    backgroundColor: '#46A200',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#46A200',
    marginBottom: 12,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  premiumFeature: {
    color: '#46A200',
    fontWeight: '500',
  },
  subscribeButton: {
    backgroundColor: '#46A200',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledText: {
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionScreen;

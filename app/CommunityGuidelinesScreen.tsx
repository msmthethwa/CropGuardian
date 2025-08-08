import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CommunityGuidelinesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.title}>Community Guidelines</Text>
          <View style={{ width: 24, height: 24 }} />
        </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Ionicons name="people-circle" size={60} color="#46a200" />
          <Text style={styles.heroText}>Building a Supportive Community</Text>
        </View>

        <View style={styles.card}>
          <GuidelineItem 
            icon="heart"
            title="Be Respectful"
            content="Treat all members with kindness and respect. No hate speech, bullying, or harassment."
          />

          <GuidelineItem
            icon="chatbubbles"
            title="Stay On Topic"
            content="Keep conversations relevant to plant care, gardening, and agriculture."
          />

          <GuidelineItem
            icon="alert-circle"
            title="No Spam"
            content="Avoid promotional content, advertisements, or repetitive messages."
          />

          <GuidelineItem
            icon="book"
            title="Share Knowledge"
            content="Encourage constructive discussions and share evidence-based information."
          />

          <GuidelineItem
            icon="shield-checkmark"
            title="Safety First"
            content="Never share personal information or dangerous advice."
          />
        </View>

        <View style={styles.footer}>
          <Ionicons name="warning" size={20} color="#718096" />
          <Text style={styles.footerText}>
            Violations may result in account suspension. Please report any issues to moderators.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GuidelineItem = ({ icon, title, content }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; content: string }) => (
  <View style={styles.guidelineContainer}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={24} color="#46a200" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.guidelineTitle}>{title}</Text>
      <Text style={styles.guidelineContent}>{content}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 20,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
  },
  heroText: {
    fontSize: 18,
    color: '#1a3c05',
    marginTop: 15,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
  },
  guidelineContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  iconContainer: {
    backgroundColor: '#e9f5e1',
    borderRadius: 8,
    padding: 10,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a3c05',
    marginBottom: 6,
    fontFamily: 'Roboto-Medium',
  },
  guidelineContent: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    fontFamily: 'Roboto-Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Roboto-Italic',
    marginLeft: 10,
    flex: 1,
  },
});

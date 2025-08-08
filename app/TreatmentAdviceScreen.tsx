import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';

type TreatmentResult = {
  title: string;
  description: string;
  organic: string[];
  chemical: string[];
  prevention: string[];
};

const OPENAI_API_KEY = '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';

const TreatmentAdviceScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TreatmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const parseOpenAIResponse = (responseText: string): TreatmentResult => {
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText);
      return {
        title: `Treatment for ${input}`,
        description: jsonResponse.description || 'No description available',
        organic: jsonResponse.organic || [],
        chemical: jsonResponse.chemical || [],
        prevention: jsonResponse.prevention || []
      };
    } catch (e) {
      // Fallback to text parsing if JSON parsing fails
      const sections = responseText.split('\n\n');
      const result: TreatmentResult = {
        title: `Treatment for ${input}`,
        description: '',
        organic: [],
        chemical: [],
        prevention: []
      };

      sections.forEach(section => {
        if (section.includes('DESCRIPTION:')) {
          result.description = section.replace('DESCRIPTION:', '').trim();
        } else if (section.includes('ORGANIC SOLUTIONS:')) {
          result.organic = section.replace('ORGANIC SOLUTIONS:', '')
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace('-', '').trim());
        } else if (section.includes('CHEMICAL SOLUTIONS:')) {
          result.chemical = section.replace('CHEMICAL SOLUTIONS:', '')
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace('-', '').trim());
        } else if (section.includes('PREVENTION:')) {
          result.prevention = section.replace('PREVENTION:', '')
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace('-', '').trim());
        }
      });

      return result;
    }
  };

  const handleSearch = async () => {
    if (!input.trim()) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      const prompt = `
        Provide a detailed treatment plan for ${input} in the following JSON format:
        {
          "description": "Brief description of the pest/disease",
          "organic": ["List of organic solutions", "Each item as a string"],
          "chemical": ["List of chemical solutions", "Each item as a string"],
          "prevention": ["List of prevention methods", "Each item as a string"]
        }
        
        If you cannot provide JSON, format your response with clear sections:
        DESCRIPTION: [description here]
        
        ORGANIC SOLUTIONS:
        - [solution 1]
        - [solution 2]
        
        CHEMICAL SOLUTIONS:
        - [solution 1]
        - [solution 2]
        
        PREVENTION:
        - [method 1]
        - [method 2]
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an agricultural expert providing detailed treatment plans for plant diseases and pests.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch treatment advice');
      }

      const responseText = data.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response content from AI');
      }

      const parsedResult = parseOpenAIResponse(responseText);
      setResult(parsedResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // Additional error handling for network issues
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setResult(null);
      setInput('');
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Treatment Advisor</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Find Treatment Solutions</Text>
            <Text style={styles.subtitle}>
              Enter the name of the plant pest or disease to get AI-powered treatment recommendations.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Aphids, Powdery Mildew, Black Spot..."
              placeholderTextColor="#888"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSearch}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Searching...' : 'Get Treatment Advice'}
              </Text>
            </TouchableOpacity>

            {result ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <MaterialIcons name="eco" size={24} color="#46a200" />
                </View>

                <View style={styles.divider} />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>DESCRIPTION</Text>
                  <Text style={styles.sectionContent}>{result.description}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>ORGANIC SOLUTIONS</Text>
                  {result.organic.map((item, index) => (
                    <Text key={`organic-${index}`} style={styles.sectionContent}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>CHEMICAL SOLUTIONS</Text>
                  {result.chemical.map((item, index) => (
                    <Text key={`chemical-${index}`} style={styles.sectionContent}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PREVENTION</Text>
                  {result.prevention.map((item, index) => (
                    <Text key={`prevention-${index}`} style={styles.sectionContent}>• {item}</Text>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={64} color="#EE8B60" />
                <Text style={styles.emptyText}>
                  Enter a pest or disease name above to get treatment recommendations
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by OpenAI - Results are suggestions only. Always verify with local gardening experts.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#46a200',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#46a200',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptyState: {
    backgroundColor: 'white',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TreatmentAdviceScreen;
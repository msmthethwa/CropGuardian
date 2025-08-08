import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { LinearGradient } from 'expo-linear-gradient';

interface RainForecastItem {
  day: string;
  percent: number;
  risk: string;
  color: string;
  icon: 'wb-sunny' | 'wb-cloudy' | 'umbrella';
}

interface RainfallAmountItem {
  day: string;
  desc: string;
  mm: string;
  color: string;
}

interface WeatherLocation {
  name: string;
  region: string;
  country: string;
}

interface WeatherCondition {
  text: string;
}

interface WeatherCurrent {
  temp_c: number;
  condition: WeatherCondition;
}

interface WeatherDay {
  daily_chance_of_rain: number;
  totalprecip_mm: number;
}

interface WeatherForecastDay {
  date: string;
  day: WeatherDay;
}

interface WeatherForecast {
  forecastday: WeatherForecastDay[];
}

interface WeatherData {
  location: WeatherLocation;
  current: WeatherCurrent;
  forecast: WeatherForecast;
}

type PestRiskAnalystScreenProps = NativeStackScreenProps<RootStackParamList, 'PestRiskAnalystScreen'>;

const PestRiskAnalystScreen: React.FC<PestRiskAnalystScreenProps> = ({ route }) => {
  const userName = route?.params?.userName ?? 'User';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expanded, setExpanded] = useState(false);
  const [locationName, setLocationName] = useState('Fetching location...');
  const [weather, setWeather] = useState('Fetching weather...');
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [rainForecast, setRainForecast] = useState<RainForecastItem[]>([]);
  const [rainfallAmount, setRainfallAmount] = useState<RainfallAmountItem[]>([]);
  const [highRiskToday, setHighRiskToday] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to fetch weather data.");
        setLocationName('Location access denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        let addressFound = false;

        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (address.length > 0) {
            const addr = address[0];
            const streetParts = [];
            if (addr.streetNumber) streetParts.push(addr.streetNumber);
            if (addr.street) streetParts.push(addr.street);
            const street = streetParts.join(' ');
            
            const locationParts = [];
            if (street) locationParts.push(street);
            if (addr.city) locationParts.push(addr.city);
            if (addr.region) locationParts.push(addr.region);
            if (addr.postalCode) locationParts.push(addr.postalCode);

            const formattedAddress = locationParts.join(', ');
            if (formattedAddress) {
              setLocationName(formattedAddress);
              addressFound = true;
            }
          }
        } catch (geocodeError) {
          console.log('Reverse geocoding error:', geocodeError);
        }

        if (!addressFound) {
          setLocationName('Getting location details...');
        }

        fetchWeather(location.coords.latitude, location.coords.longitude, !addressFound);

      } catch (error) {
        console.error('Failed to get location:', error);
        Alert.alert('Error', 'Failed to get location data.');
        setLocationName('Location unavailable');
        setLoading(false);
      }
    })();
  }, []);

  const fetchWeather = async (lat: number, lon: number, needsLocationFallback: boolean) => {
    try {
      const response = await axios.get<WeatherData>(
        `https://api.weatherapi.com/v1/forecast.json?key=55c538bf41554ff3b69162709250203&q=${lat},${lon}&days=5`
      );
      
      const data: WeatherData = response.data;
      
      if (needsLocationFallback) {
        setLocationName(`${data.location.name}, ${data.location.region}, ${data.location.country}`);
      }

      const condition = data.current.condition.text;
      const tempC = data.current.temp_c;
      setWeather(`${condition}, ${tempC}°C`);
      
      processForecastData(data);
      
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      Alert.alert('Error', 'Failed to fetch weather data.');
      setWeather('Unavailable');
    } finally {
      setLoading(false);
    }
  };

  const processForecastData = (data: WeatherData) => {
    const todayForecast = data.forecast.forecastday[0];
    const date = new Date(todayForecast.date);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    const calculateRiskLevel = (
      rainChance: number, 
      precipMm: number
    ): { level: string; color: string; icon: 'wb-sunny' | 'wb-cloudy' | 'umbrella' } => {
      const riskScore = (rainChance * 0.6) + (Math.min(precipMm, 50) * 0.8);
      
      if (riskScore > 75 || rainChance > 80 || precipMm > 30) {
        return { 
          level: 'High Risk', 
          color: '#F44336', 
          icon: 'umbrella'
        };
      }
      if (riskScore > 50 || rainChance > 60 || precipMm > 15) {
        return { 
          level: 'Medium Risk', 
          color: '#FF9800', 
          icon: 'wb-cloudy'
        };
      }
      return { 
        level: 'Low Risk', 
        color: '#46A200', 
        icon: 'wb-sunny'
      };
    };

    const classifyRainfall = (precipMm: number): { desc: string; color: string } => {
      if (precipMm > 30) return { desc: 'Torrential rain', color: '#D32F2F' };
      if (precipMm > 20) return { desc: 'Heavy rainfall', color: '#F44336' };
      if (precipMm > 10) return { desc: 'Moderate rain', color: '#FF9800' };
      if (precipMm > 5) return { desc: 'Light showers', color: '#46A200' };
      return { desc: 'Minimal precipitation', color: '#46A200' };
    };

    const forecastRainData = data.forecast.forecastday.map((day: WeatherForecastDay, index: number) => {
      const date = new Date(day.date);
      const rainChance = day.day.daily_chance_of_rain;
      const precipMm = day.day.totalprecip_mm;
      
      const { level, color, icon } = calculateRiskLevel(rainChance, precipMm);

      let dayLabel = '';
      switch(index) {
        case 0: dayLabel = 'Today'; break;
        case 1: dayLabel = 'Tomorrow'; break;
        default: dayLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
      }

      return { 
        day: dayLabel, 
        percent: rainChance, 
        risk: level, 
        color, 
        icon 
      } as RainForecastItem;
    });

    const forecastRainfallData = data.forecast.forecastday.map((day: WeatherForecastDay, index: number) => {
      const date = new Date(day.date);
      const precipMm = day.day.totalprecip_mm;
      const { desc, color } = classifyRainfall(precipMm);

      let dayLabel = '';
      switch(index) {
        case 0: dayLabel = 'Today'; break;
        case 1: dayLabel = 'Tomorrow'; break;
        default: dayLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
      }

      return { day: dayLabel, desc, mm: precipMm.toFixed(0), color };
    });

    setHighRiskToday(forecastRainData[0].risk === 'High Risk');
    setRainForecast(forecastRainData);
    setRainfallAmount(forecastRainfallData);
  };

  const handleRefresh = () => {
    setLoading(true);
    setLocationName('Updating location...');
    setWeather('Updating weather...');
    
    (async () => {
      try {
        let location = await Location.getCurrentPositionAsync({});
        fetchWeather(location.coords.latitude, location.coords.longitude, true);
      } catch (error) {
        console.error('Failed to refresh location:', error);
        Alert.alert('Error', 'Failed to refresh location data.');
        setLoading(false);
      }
    })();
  };

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
            onPress={() => navigation.navigate('HomeScreen', { userName })}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pest Risk Analyst</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="refresh" size={24} color="white" />
            )}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.scrollView}>
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={20} color="white" />
              <Text style={styles.locationText}>Current Location: {locationName}</Text>
            </View>
            <View style={styles.weatherRow}>
              <MaterialIcons name="cloud" size={20} color="white" />
              <Text style={styles.weatherText}>Weather: {weather}</Text>
            </View>
            <View style={styles.dateRow}>
              <MaterialIcons name="date-range" size={20} color="white" />
              <Text style={styles.dateText}>{currentDate}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#46A200" />
              <Text style={styles.loadingText}>Fetching weather data...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Heavy Rain Expectation</Text>
              <View style={styles.rainGrid}>
                {rainForecast.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.rainCard}>
                    <Text style={styles.rainDay}>{item.day}</Text>
                    <MaterialIcons name={item.icon} size={36} color={item.color} />
                    <Text style={[styles.rainPercentage, { color: item.color }]}>{item.percent}%</Text>
                    <Text style={[styles.rainRisk, { color: item.color }]}>{item.risk}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Crop Protection Tips</Text>
              <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <MaterialIcons 
                    name={highRiskToday ? "warning" : "info-outline"} 
                    size={24} 
                    color={highRiskToday ? "#F44336" : "#2196F3"} 
                  />
                  <Text style={[styles.tipTitle, { color: highRiskToday ? '#F44336' : '#2196F3' }]}>
                    {highRiskToday ? 'High Risk Today' : 'Weather Advisory'}
                  </Text>
                </View>
                <Text style={styles.tipText}>
                  {highRiskToday 
                    ? 'Apply fungicide before rainfall to prevent fungal diseases. Ensure proper drainage in fields.'
                    : 'Monitor weather conditions closely. Be prepared for changing conditions and take preventive measures as needed.'}
                </Text>
              </View>

              <View style={styles.tipCard}>
                <TouchableOpacity
                  style={styles.expandableHeader}
                  onPress={() => setExpanded(!expanded)}
                >
                  <Text style={styles.expandableTitle}>Recommended Preventive Measures</Text>
                  <FontAwesome
                    name={expanded ? 'angle-up' : 'angle-down'}
                    size={24}
                    color="#46A200"
                  />
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.expandedContent}>
                    {[
                      'Apply copper-based fungicides before heavy rain',
                      'Ensure proper field drainage systems',
                      'Consider raised beds for vulnerable crops',
                      'Monitor for early signs of disease after rainfall',
                      'Apply mulch to retain soil moisture and prevent erosion',
                      'Stake tall plants to prevent wind damage',
                    ].map((tip, i) => (
                      <View key={i} style={styles.tipItem}>
                        <MaterialIcons name="check-circle" size={20} color="#46A200" />
                        <Text style={styles.tipItemText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>Heavy Rain Forecast</Text>
              {rainfallAmount.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.forecastCard}>
                  <View style={styles.forecastTextContainer}>
                    <Text style={styles.forecastDay}>{item.day}</Text>
                    <Text style={[styles.forecastDesc, { color: item.color }]}>{item.desc}</Text>
                  </View>
                  <View style={styles.forecastValueContainer}>
                    <MaterialIcons name="water-drop" size={36} color={item.color} />
                    <Text style={[styles.forecastAmount, { color: item.color }]}>{item.mm}mm</Text>
                  </View>
                </View>
              ))}

              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={24} color="#2196F3" />
                <Text style={styles.infoText}>
                  Weather data is for informational purposes only. Always consult local agricultural experts.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
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
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    padding: 16,
  },
  locationContainer: {
    backgroundColor: '#46A200',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  weatherText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#46A200',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  rainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rainCard: {
    width: '48%',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  rainDay: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  rainPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rainRisk: {
    fontSize: 14,
  },
  tipCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#444',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandableTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  expandedContent: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  forecastCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  forecastTextContainer: {
    flex: 1,
  },
  forecastDay: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  forecastDesc: {
    fontSize: 14,
    color: '#666',
  },
  forecastValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastAmount: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#e1f5fe',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  infoText: {
    marginLeft: 10,
    color: '#1565C0',
    fontSize: 14,
    flex: 1,
  },
});

export default PestRiskAnalystScreen;

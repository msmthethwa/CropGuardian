import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView, 
  Image,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import RNPickerSelect from 'react-native-picker-select';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { uploadImageToImgBB } from '../utils/imgbb';

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfileScreen'>;

const UserProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProfileScreenRouteProp>();
  
  const [fullName, setFullName] = useState(route.params?.userName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [location, setLocation] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string>('https://www.gravatar.com/avatar/?d=mp');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const cropOptions = [
    { label: 'Corn', value: 'corn' },
    { label: 'Wheat', value: 'wheat' },
    { label: 'Soybeans', value: 'soybeans' },
    { label: 'Rice', value: 'rice' },
    { label: 'Cotton', value: 'cotton' },
  ];

  useEffect(() => {
    const loadUserData = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.name || '');
            setLocation(userData.location || '');
            setSelectedCrop(userData.crop || null);

            if (userData.profileImageUrl) {
              setProfileImage(userData.profileImageUrl);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user?.email) {
        setEmail(user.email);
        loadUserData();
      }
    });
    return () => unsubscribe();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      
      const address = await Location.reverseGeocodeAsync(locationData.coords);
      if (address.length > 0) {
        const loc = `${address[0].city || address[0].subregion}, ${address[0].region}, ${address[0].country}`;
        setLocation(loc);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your photos to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user?.uid) throw new Error('User not authenticated');

      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const imageUrl = await uploadImageToImgBB(base64Image);

      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: imageUrl,
        updatedAt: serverTimestamp()
      });

      setProfileImage(imageUrl);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user?.uid) throw new Error('User not authenticated');

      const updateData = {
        name: fullName,
        location,
        updatedAt: serverTimestamp(),
        ...(selectedCrop && { crop: selectedCrop })
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.navigate('HomeScreen', { userName: fullName });
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('User not authenticated');

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = 'Failed to change password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation requires recent authentication. Please log in again.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.navigate('LoginScreen');
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert('Logout Error', 'Failed to sign out');
    }
  };

  const handleManageSubscription = () => {
    navigation.navigate('SubscriptionScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.title}>User Profile</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} disabled={loading}>
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage} 
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Enter your email"
              value={email}
              editable={false}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                placeholder="Enter your location"
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name="location" size={20} color="#46a200" />
              </TouchableOpacity>
            </View>
            {locationError && (
              <Text style={styles.errorText}>{locationError}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Crop Preference <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <RNPickerSelect
              onValueChange={(value) => setSelectedCrop(value)}
              items={cropOptions}
              value={selectedCrop}
              style={pickerSelectStyles}
              placeholder={{ label: 'Select your crop preference...', value: null }}
              useNativeAndroidPickerStyle={false}
              Icon={() => <Ionicons name="chevron-down" size={20} color="#6B7280" />}
            />
          </View>

          {!showPasswordChange ? (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowPasswordChange(true)}
            >
              <Ionicons name="key-outline" size={20} color="#46A200" />
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Change Password</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons 
                      name={showCurrentPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordButtonContainer}>
                <TouchableOpacity 
                  style={[styles.secondaryButton, { flex: 1 }]}
                  onPress={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.updateButton, { flex: 1 }, loading && styles.disabledButton]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.updateButton, loading && styles.disabledButton]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { marginTop: 16 }]}
            onPress={handleManageSubscription}
          >
            <Ionicons name="card-outline" size={20} color="#46A200" />
            <Text style={styles.secondaryButtonText}>Manage Subscription</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputAndroid: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    top: 18,
    right: 12,
  },
  placeholder: {
    color: '#9CA3AF',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Raleway-SemiBold',
  },
  profileCard: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 16,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#46A200',
    borderRadius: 15,
    padding: 6,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Roboto-Medium',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Roboto-Regular',
  },
  formContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Roboto-Medium',
    marginBottom: 8,
  },
  optionalText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Roboto-Regular',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  updateButton: {
    backgroundColor: '#46A200',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#46A200',
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#46A200',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});

export default UserProfileScreen;
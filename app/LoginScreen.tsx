import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigationTypes';
import { useNavigation } from '@react-navigation/native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  const showModal = (message: string, success: boolean = false) => {
    setModalMessage(message);
    setModalVisible(true);
    setIsSuccess(success);
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (!name.trim()) {
        showModal("Full Name is required.");
        return;
      }
      if (!validateEmail(email)) {
        showModal("Invalid email format. Please enter a valid email.");
        return;
      }
      if (!validatePassword(password)) {
        showModal("Password must be at least 8 characters long, contain at least one uppercase letter, and one number.");
        return;
      }
      await handleSignUp();
    } else {
      if (!email.trim() || !password.trim()) {
        showModal("Please enter both email and password.");
        return;
      }
      await handleLogin();
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        showModal("Please verify your email before logging in. Check your inbox for the verification link.");
        await sendEmailVerification(user); // Resend verification email if not verified
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        showModal(`Welcome back, ${userData.name || "User"}!`, true);
        setTimeout(() => {
          setModalVisible(false);
          navigation.replace("HomeScreen", { userName: userData.name || "User" });
        }, 2000);
      } else {
        showModal("Error: User details not found. Please contact support.");
      }
    } catch (error: any) {
      // console.error("Login Error:", error.message);
      let errorMessage = "Login Failed: " + error.message;
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      showModal(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        emailVerified: false,
        location: null,
        crop: null,
        profileImageUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      showModal(
        "Account created successfully! Please check your email for the verification link. " +
        "You'll need to verify your email before logging in.", 
        true
      );
      
      // Reset form after successful signup
      setTimeout(() => {
        setModalVisible(false);
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setName('');
      }, 5000);
    } catch (error: any) {
      console.error("Signup Error:", error.message);
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use. Please sign in or use a different email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. It should be at least 8 characters with at least one uppercase letter and one number.";
      }
      
      showModal(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      showModal("Please enter your email address.");
      return;
    }
    
    if (!validateEmail(resetEmail)) {
      showModal("Invalid email format. Please enter a valid email.");
      return;
    }

    try {
      setIsResetting(true);
      await sendPasswordResetEmail(auth, resetEmail);
      showModal("Password reset email sent. Please check your inbox.", true);
      setForgotPasswordModalVisible(false);
      setResetEmail('');
    } catch (error: any) {
      console.error("Password Reset Error:", error.code, error.message);
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is invalid.";
      }
      
      showModal(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#46a200', '#249689']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Image
                source={{ uri: 'https://i.ibb.co/23rm1rVx/Minimalist-Overlapping-White-Leaves-Icon.png' }}
                style={{ width: 48, height: 48 }}
              />
              <Text style={styles.title}>Crop Guardian</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={24} color="white" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={24} color="white" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="white" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.authButton, isLoading && styles.disabledButton]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#46a200" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchAuthButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchAuthText}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={() => setForgotPasswordModalVisible(true)}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Success/Error Modal */}
            <Modal transparent={true} visible={modalVisible} animationType="fade">
              <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { backgroundColor: isSuccess ? '#f0fdf4' : '#fef2f2' }]}>
                    <Text style={[styles.modalText, { color: isSuccess ? '#14532d' : '#991b1b' }]}>
                      {modalMessage}
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: isSuccess ? '#46A200' : '#dc2626' }]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* Forgot Password Modal */}
            <Modal transparent={true} visible={forgotPasswordModalVisible} animationType="fade">
              <TouchableWithoutFeedback onPress={() => setForgotPasswordModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { backgroundColor: '#f0f9ff' }]}>
                      <Text style={[styles.modalText, { color: '#46a200', marginBottom: 16 }]}>
                        Enter your email to receive a password reset link
                      </Text>
                      
                      <View style={[styles.inputContainer, { width: '100%', marginBottom: 24 }]}>
                        <Ionicons name="mail-outline" size={24} color="#46a200" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: '#46a200' }]}
                          placeholder="Email"
                          placeholderTextColor="rgba(70, 162, 0, 0.3)"
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      
                      <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                          style={[styles.modalButton, { 
                            backgroundColor: 'rgba(70, 162, 0, 0.3)',
                            marginRight: 12 
                          }]}
                          onPress={() => setForgotPasswordModalVisible(false)}
                        >
                          <Text style={[styles.modalButtonText, { color: '#46a200' }]}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.modalButton, { 
                            backgroundColor: '#46a200',
                            opacity: isResetting ? 0.7 : 1 
                          }]}
                          onPress={handlePasswordReset}
                          disabled={isResetting}
                        >
                          {isResetting ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.modalButtonText}>Send Link</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    fontFamily: 'Raleway-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontFamily: 'Roboto-Regular',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    paddingVertical: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  authButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  buttonText: {
    color: '#46a200',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Roboto-Medium',
  },
  switchAuthButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchAuthText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'underline',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Roboto-Regular',
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    elevation: 2,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
});

export default LoginScreen;
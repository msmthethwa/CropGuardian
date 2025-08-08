# Crop Guardian App Documentation

## Overview

Crop Guardian is a React Native mobile application designed to assist farmers and agricultural experts with precision farming powered by AI. The app provides features such as AI-powered plant disease diagnosis, community chat, pest risk analysis, disease guides, and treatment advice. It integrates with external services like Firebase for authentication and data storage, ImgBB for image hosting, and third-party APIs for plant and disease data.

---

## Entry Point: `app/index.tsx`

- **Core Functionality:**  
  The landing screen of the app presenting the app title, tagline, and key features (AI-Powered Diagnosis, Expert Community, Risk Prevention). It serves as the welcome page and entry point for users.

- **User Interactions:**  
  Users can tap the "Get Started" button to navigate to the `LoginScreen`.

- **Navigation:**  
  Uses React Navigation's `useNavigation` hook to navigate to `LoginScreen`.

- **UI Elements:**  
  Uses Expo's `LinearGradient` for background, Ionicons for icons, and React Native components for layout.

---

## Navigation Structure: `app/navigationTypes.ts`

- Defines the app's navigation stack and route parameters using TypeScript types.
- Key routes include:
  - `Index` (entry point)
  - `LoginScreen`
  - `HomeScreen` (main dashboard)
  - `UserProfileScreen`
  - `ScanPlantScreen`
  - `CommunityScreen`
  - `DiseaseGuideScreen`
  - `DiseaseDetailScreen`
  - `CropHealthScreen`
  - `TreatmentAdviceScreen`
  - Other screens for reports, notifications, and history.
- Navigation parameters are strongly typed for safety and clarity.

---

## Authentication: `app/LoginScreen.tsx`

- **Core Functionality:**  
  Handles user sign-in, sign-up, email verification, and password reset using Firebase Authentication.

- **User Interactions:**  
  - Toggle between sign-in and sign-up forms.  
  - Input fields for name (sign-up), email, and password with validation.  
  - Show/hide password toggle.  
  - Forgot password flow with email input and reset link.  
  - Modal dialogs for success/error messages.

- **API Integrations:**  
  - Firebase Auth methods: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendEmailVerification`, `sendPasswordResetEmail`.  
  - Firestore for storing user profile data.

- **State Management:**  
  Local React state for form inputs, loading states, modals, and toggles.

- **Navigation:**  
  Navigates to `HomeScreen` on successful login.

---

## Main Dashboard: `app/HomeScreen.tsx`

- **Core Functionality:**  
  Displays a personalized welcome message, user profile image, recent community messages, and a grid of feature navigation buttons.

- **User Interactions:**  
  - Tap profile icon to navigate to `UserProfileScreen`.  
  - Tap notification icon to view recent community messages in a modal.  
  - Tap grid items to navigate to respective features (Scan Plant, Pest Risk Analyst, Community Chat, Disease Guide, Crop Health, Treatment Advice).  
  - Tap weather advisory alert to navigate to `PestRiskAnalystScreen`.

- **API Integrations:**  
  - Firebase Firestore for user profile image and real-time community messages using `onSnapshot`.

- **State Management:**  
  Local React state for profile image, notifications, recent messages, and unread message indicator.

- **Navigation:**  
  Uses React Navigation to navigate to various feature screens with parameters.

---


## Plant Scanner: `app/ScanPlantScreen.tsx`

- **Core Functionality:**  
  Allows users to take or upload a plant photo, which is analyzed using the Plant.id API to identify diseases and pests. Scan results are displayed and saved.

- **User Interactions:**  
  - Take a picture using the camera.  
  - Upload a picture from the gallery.  
  - View scan results including plant name, disease, cause, treatment, prevention, pest name, and pest prevention.  
  - Refresh scan.

- **API Integrations:**  
  - Plant.id API for image analysis.  
  - ImgBB for image hosting.  
  - Firebase Firestore for saving scan results.

- **State Management:**  
  Local React state for image URI, scan results, loading, and save status.

- **Navigation:**  
  Back navigation and navigation to `PlantScanHistoryScreen`.

---

## Plant Scan History: `app/PlantScanHistoryScreen.tsx`

- **Core Functionality:**  
  Displays a history of plant scans for the logged-in user, showing scan results including plant name, disease, pest information, and timestamps.

- **User Interactions:**  
  - Search scans by plant name, disease, or pest.  
  - Filter scans by health status (all, healthy, diseased, pest-affected).  
  - Tap on a scan card to view detailed scan information.  
  - Access filter options via a modal.

- **API Integrations:**  
  - Firebase Firestore for fetching user-specific scan history data.

- **State Management:**  
  Local React state for scans data, search query, loading state, filter modal visibility, and selected filter.

- **Navigation:**  
  Navigates to `ScanDetailsScreen` for detailed scan information.

---

## Scan Details: `app/ScanDetailsScreen.tsx`

- **Core Functionality:**  
  Displays detailed information about a specific plant scan, including plant name, scan date, disease and pest details, causes, treatments, and prevention methods.

- **User Interactions:**  
  - View detailed scan results with images and status badges.  
  - Share scan results via device sharing options.  
  - Navigate back to the previous screen.

- **API Integrations:**  
  - Firebase Firestore for fetching detailed scan data by scan ID.

- **State Management:**  
  Local React state for scan details, loading, and error handling.

- **Navigation:**  
  Navigates back to the previous screen.

---

## Pest Risk Analyst: `app/PestRiskAnalystScreen.tsx`

- **Core Functionality:** 
  Provides pest risk analysis based on current location and weather forecast data, highlighting heavy rain expectations and crop protection tips.

- **User Interactions:** 
  - View current location and weather conditions.
  - Refresh weather and location data.
  - Expand/collapse recommended preventive measures.

- **API Integrations:**  
  - Expo Location API for location permissions and geolocation.
  - WeatherAPI for fetching weather forecast data.

- **State Management:**  
  Local React state for location, weather, loading status, rain forecast, rainfall amounts, and UI expansion state.

- **Navigation:**  
  Navigates back to `HomeScreen`.

---

## Community Chat: `app/CommunityScreen.tsx`

- **Core Functionality:**  
  Real-time community chat allowing users to send text and image messages, reply, edit, delete, and react to messages.

- **User Interactions:**  
  - Send text messages.  
  - Upload images with optional captions (images uploaded to ImgBB).  
  - Reply to messages.  
  - Edit or delete own messages.  
  - Like or dislike messages.  
  - Mute/unmute notifications.  
  - Access community guidelines and logout via menu.

- **API Integrations:**  
  - Firebase Firestore for real-time messages and user data.  
  - ImgBB for image uploads.

- **State Management:**  
  Local React state for messages, user info, UI states (modals, menus), reactions, and image upload status.

- **Navigation:**  
  Navigates back to `HomeScreen`, to `CommunityGuidelinesScreen`, and `LoginScreen`.

- **Performance:**  
  Uses Firestore's `onSnapshot` for real-time updates and `FlatList` for efficient rendering.

---

## Community Guidelines: `app/CommunityGuidelinesScreen.tsx`

- **Core Functionality:**  
  Displays community guidelines to foster a supportive and respectful environment for users.

- **User Interactions:**  
  - View key guidelines such as being respectful, staying on topic, no spam, sharing knowledge, and safety first.  
  - Navigate back to the previous screen using the back button.

- **UI Elements:**  
  - Header with gradient background and back button.  
  - Scrollable content with icons and guideline descriptions.  
  - Footer with warning about violations and reporting.

- **Navigation:**  
  Uses React Navigation to go back to the previous screen.

---

## Disease Guide: `app/DiseaseGuideScreen.tsx`

- **Core Functionality:**  
  Displays a searchable list of plant diseases fetched from the Trefle API. Users can view detailed disease information.

- **User Interactions:**  
  - Search diseases by name.  
  - Tap disease cards to view detailed information on `DiseaseDetailScreen`.  
  - Refresh disease list.

- **API Integrations:**  
  - Trefle API for plant and disease data.

- **State Management:**  
  Local React state for diseases list, search query, and loading state.

- **Navigation:**  
  Navigates to `DiseaseDetailScreen` with selected disease data.

---

## Disease Detail: `app/DiseaseDetailScreen.tsx`

- **Core Functionality:**  
  Displays detailed information about a specific plant disease, including images, severity, type, description, symptoms, treatment, and prevention.

- **User Interactions:**  
  - View detailed disease information.  
  - Navigate back to the previous screen using the back button.  
  - Open external links for more information.

- **UI Elements:**  
  - Header with gradient background and back button.  
  - Scrollable content with images, tags, and text sections.  
  - External link button to APSnet website. 

---

## Crop Health: `app/CropHealthScreen.tsx`

The `CropHealthScreen` is a React Native screen component that provides comprehensive crop health intelligence to users. It displays up-to-date information on crop diseases and outbreaks from two primary sources:

- **Global Reports:** Data fetched from the FAO AGROVOC database, which includes a curated list of plant diseases with detailed descriptions, symptoms, prevention methods, and treatment options.
- **Community Reports:** Verified user-submitted reports on crop diseases and outbreaks in various locations.

### Key Features

- **Location Detection:** Automatically detects the user's region to provide localized information.
- **Search Functionality:** Allows users to search diseases, crops, or reports by keywords.
- **Severity Filtering:** Users can filter disease outbreaks and reports by severity levels such as Mild, Moderate, Severe, Low, Medium, and High.
- **Tabs for Data Sources:** Switch between global AGROVOC data and community reports using tabs.
- **Expandable Cards:** Each disease or report is displayed in a card that can be expanded to show detailed information including description, symptoms, prevention, treatment, and probability metrics.
- **Navigation:** Users can navigate to report new outbreaks or view pending reports directly from the screen.
- **Loading and Error Handling:** Displays loading indicators while fetching data and shows error messages with retry options if data loading fails.
- **Data Refresh:** Supports pull-to-refresh functionality to update the displayed data.

### User Interface Elements

- **Header:** Displays the screen title, user region, and active data source tab.
- **Search Bar:** Input field with clear button for searching.
- **Severity Filters:** Horizontal scrollable buttons to filter by threat level.
- **Content Area:** Scrollable list of disease outbreaks or community reports with detailed expandable cards.
- **Footer:** Displays data source attribution and update frequency.
- **Menu:** Dropdown menu with options to refresh data or navigate to reporting screens.

This screen is a central part of the Crop Guardian app, providing users with actionable insights to monitor and respond to crop health threats effectively.

---

## Report New Outbreak: `app/ReportNewOutbreakScreen.tsx`

The `ReportOutbreakScreen` is a React Native screen component that allows users to submit reports about crop disease outbreaks. It provides a form for entering detailed information about the outbreak, including:

- Crop Type
- Disease Name
- Location (with optional geolocation support)
- Severity (Low, Medium, High)
- Description of symptoms and affected area
- Image upload for visual evidence

### Key Features

- **Permission Handling:** Requests access to the user's photo library and location services.
- **Image Picking and Uploading:** Users can select an image from their device, which is uploaded to ImgBB.
- **Form Validation:** Ensures required fields are filled before submission.
- **Submission to Firebase Firestore:** Reports are saved with status 'pending' for review by agricultural authorities.
- **User Feedback:** Displays alerts on successful submission or errors.
- **Navigation:** Returns users to the home screen after successful report submission.

This screen is essential for community-driven monitoring and helps agricultural authorities respond to disease outbreaks promptly.

---

## Pending Reports: `app/PendingReportsScreen.tsx`

The `PendingReportsScreen` is a React Native screen component that allows users to view and manage crop disease outbreak reports with status 'pending' or 'rejected'. It provides a list of reports with detailed information including:

- Crop Type
- Disease Name
- Location
- Severity
- Description
- Image (if available)

### Key Features

- **Admin Capabilities:** Allows admin users to approve, reject, or edit reports.
- **Report Listing:** Displays reports sorted by newest first with refresh control.
- **Navigation:** Supports navigation to report detail and edit screens.
- **Loading and Error Handling:** Shows loading indicators and alerts on errors.
- **User Feedback:** Provides alerts on successful approval or rejection actions.

This screen is important for the review and moderation process of community-submitted outbreak reports, ensuring data quality and reliability.

---

## Treatment Advice: `app/TreatmentAdviceScreen.tsx`

The `TreatmentAdviceScreen` is a React Native screen component that provides AI-powered treatment recommendations for plant pests and diseases. Users can enter the name of a pest or disease to receive detailed advice on treatment options.

### Key Features

- **User Input:** Allows users to input the name of a plant pest or disease.
- **AI Integration:** Fetches treatment advice from OpenAI's API, including organic, chemical, and prevention solutions.
- **Structured Display:** Presents treatment information in clearly separated sections for easy reading.
- **Loading and Error Handling:** Shows loading indicators during API calls and alerts users to any errors.
- **User Interface:** Clean and intuitive UI with navigation and input handling.

This screen helps users access expert treatment advice quickly, supporting effective crop disease management.

---

## External Services

- **Firebase:**  
  Used for Authentication, Firestore database for user profiles, messages, scans, and other app data.

- **ImgBB:**  
  Used for image hosting. Images are uploaded as base64 strings and URLs are stored in Firestore.

- **Plant.id API:**  
  Used for plant image analysis to identify diseases and pests.

- **Trefle API:**  
  Used to fetch plant and disease data for the Disease Guide.

---

## State Management and Data Flow

- The app primarily uses local React state within components for UI state and data.
- Firebase Firestore is used for real-time data synchronization (e.g., community messages, user profiles).
- Navigation parameters are used to pass data between screens.
- Image uploads are handled asynchronously with ImgBB, and URLs are stored in Firestore or used directly.

---

## Navigation Relationships

- The app uses a stack navigator with strongly typed routes.
- Entry point is `Index` screen, which navigates to `LoginScreen`.
- After login, users navigate to `HomeScreen`.
- From `HomeScreen`, users can navigate to various feature screens such as `ScanPlantScreen`, `CommunityScreen`, `DiseaseGuideScreen`, etc.
- Detail screens receive data via navigation parameters.

---

## Notes on Reusability, Performance, and Custom Logic

- Components use React Native best practices with hooks and functional components.
- Real-time updates use Firestore's `onSnapshot` for efficient data syncing.
- `FlatList` is used for rendering lists efficiently.
- Image uploads are offloaded to ImgBB to reduce backend load.
- Custom modals and UI elements provide user feedback and interaction.
- Navigation is strongly typed for safety and maintainability.
- Validation and error handling are implemented in authentication and API calls.

---

This documentation provides a thorough reference for developers to understand the app's structure, functionality, and integrations to facilitate maintenance and future development.
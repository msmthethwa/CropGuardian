import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from 'react-native-paper';
import Index from "./app/index";
import HomeScreen from "./app/HomeScreen";
import UserProfileScreen from "./app/UserProfileScreen";
import ScanPlantScreen from "./app/ScanPlantScreen";
import PestRiskAnalystScreen from "./app/PestRiskAnalystScreen";
import CommunityScreen from "./app/CommunityScreen";
import DiseaseGuideScreen from "./app/DiseaseGuideScreen";
import CropHealthScreen from "./app/CropHealthScreen";
import TreatmentAdviceScreen from "./app/TreatmentAdviceScreen";
import CommunityGuidelinesScreen from "./app/CommunityGuidelinesScreen";
import LoginScreen from "./app/LoginScreen"; 
import ReportOutbreakScreen from "./app/ReportOutbreakScreen"; 
import CropDiseaseDetailScreen from "./app/CropDiseaseDetailScreen";
import PendingReportsScreen from './app/PendingReportsScreen';
import { RootStackParamList } from "./app/navigationTypes";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Index">
          <Stack.Screen name="Index" component={Index} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
          <Stack.Screen name="ScanPlantScreen" component={ScanPlantScreen} />
          <Stack.Screen name="PestRiskAnalystScreen" component={PestRiskAnalystScreen} />
          <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
          <Stack.Screen name="DiseaseGuideScreen" component={DiseaseGuideScreen} />
          <Stack.Screen name="CropHealthScreen" component={CropHealthScreen} />
          <Stack.Screen name="TreatmentAdviceScreen" component={TreatmentAdviceScreen} />
          <Stack.Screen 
            name="CommunityGuidelinesScreen" 
            component={CommunityGuidelinesScreen} 
            options={{ title: 'Community Guidelines' }}
          />
          <Stack.Screen 
            name="LoginScreen" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="CropDiseaseDetailScreen" component={CropDiseaseDetailScreen} />
          <Stack.Screen name="ReportOutbreakScreen" component={ReportOutbreakScreen} />
          <Stack.Screen name="PendingReportsScreen" component={PendingReportsScreen} />
          <Stack.Screen name="EditReportScreen" component={require('./app/EditReportScreen').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

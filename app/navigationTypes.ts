export type RootStackParamList = {
  Index: undefined;
  HomeScreen: { userName: string };
  UserProfileScreen: { userName: string };
  ScanPlantScreen: { userName: string };
  ScanDetailsScreen: { scanId: string };
  PestRiskAnalystScreen: { userName: string };
  CommunityScreen: { userName: string; email?: string; uid?: string };
  DiseaseGuideScreen: undefined;
  DiseaseDetailScreen: {
    disease: {
      id: number;
      title: string;
      description: string;
      image: string;
      severity: string;
      type: string;
      severityColor: string;
      typeColor: string;
    };
  };
  CropHealthScreen: undefined;
  TreatmentAdviceScreen: { scanId: string };
  CommunityGuidelinesScreen: undefined;
  LoginScreen: undefined;
  NotificationsScreen: undefined;
  ImageViewScreen: { imageUrl?: string; caption?: string };
  PlantScanHistoryScreen: undefined;
  ReportOutbreakScreen: { disease: string };
  CropDiseaseDetailScreen: { 
    disease: {
      id: string | number;
      title: string;
      description: string;
      image: string;
      severity: string;
      type: string;
      severityColor: string;
      typeColor?: string;
      symptoms?: string[];
      prevention?: string[];
      treatment?: string[];
      affectedCrops?: string[];
      spreadMethod?: string;
      lifecycle?: string;
      recommendations?: string[];
    }
  };
  PendingReportsScreen: undefined;
  EditReportScreen: { reportId: string };
  ReportDetailScreen: { reportId: string };
  UserManualScreen: undefined;
  SubscriptionScreen: undefined;
};

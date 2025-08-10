export interface PlantDisease {
  id: string;
  name: string;
  scientificName: string;
  commonNames: string[];
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: Treatment[];
  prevention: Prevention[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  images: string[];
}

export interface PestInfo {
  id: string;
  name: string;
  scientificName: string;
  type: 'insect' | 'fungus' | 'bacteria' | 'virus' | 'mite' | 'nematode';
  description: string;
  damage: string[];
  symptoms: string[];
  prevention: Prevention[];
  treatments: Treatment[];
  images: string[];
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  method: 'chemical' | 'organic' | 'cultural' | 'biological';
  application: string;
  frequency: string;
  duration: string;
  precautions: string[];
  effectiveness: number; // 0-100
}

export interface Prevention {
  id: string;
  name: string;
  description: string;
  methods: string[];
  timing: string;
  frequency: string;
}

export interface PlantHealthResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  diseases: PlantDisease[];
  pests: PestInfo[];
  overallHealth: number; // 0-100
  recommendations: string[];
  nextSteps: string[];
  scanDate: Date;
  imageUrl: string;
}

export interface ModelPrediction {
  plantClass: string;
  diseaseClass: string;
  pestClass: string;
  confidence: number;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
  }>;
}

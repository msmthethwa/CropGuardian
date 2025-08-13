import * as tf from '@tensorflow/tfjs';
import { PlantHealthResult } from '../types/plantHealth';
import { getDiseaseInfo, getPestInfo } from './diseaseData';

// PlantVillage dataset mapping
const plantVillageMapping = {
  'Apple___Apple_scab': {
    plantName: 'Apple',
    scientificName: 'Malus domestica',
    disease: 'early_blight',
    pest: 'none',
    healthScore: 65
  },
  'Apple___Black_rot': {
    plantName: 'Apple',
    scientificName: 'Malus domestica',
    disease: 'black_rot',
    pest: 'none',
    healthScore: 45
  },
  'Apple___Cedar_apple_rust': {
    plantName: 'Apple',
    scientificName: 'Malus domestica',
    disease: 'cedar_apple_rust',
    pest: 'none',
    healthScore: 55
  },
  'Apple___healthy': {
    plantName: 'Apple',
    scientificName: 'Malus domestica',
    disease: 'healthy',
    pest: 'none',
    healthScore: 95
  },
  'Tomato___Bacterial_spot': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    disease: 'bacterial_spot',
    pest: 'none',
    healthScore: 60
  },
  'Tomato___Early_blight': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    disease: 'early_blight',
    pest: 'none',
    healthScore: 65
  },
  'Tomato___healthy': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    disease: 'healthy',
    pest: 'none',
    healthScore: 95
  },
  'Tomato___Late_blight': {
    plantName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    disease: 'late_blight',
    pest: 'none',
    healthScore: 50
  },
  'Potato___Early_blight': {
    plantName: 'Potato',
    scientificName: 'Solanum tuberosum',
    disease: 'early_blight',
    pest: 'none',
    healthScore: 65
  },
  'Potato___Late_blight': {
    plantName: 'Potato',
    scientificName: 'Solanum tuberosum',
    disease: 'late_blight',
    pest: 'none',
    healthScore: 50
  },
  'Potato___healthy': {
    plantName: 'Potato',
    scientificName: 'Solanum tuberosum',
    disease: 'healthy',
    pest: 'none',
    healthScore: 95
  }
};

export class PlantModel {
  private model: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('Plant model initialized for PlantVillage dataset');
  }

  async analyzeImage(imageUri: string): Promise<PlantHealthResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // For now, simulate analysis based on PlantVillage dataset
      // In production, this would use actual TensorFlow.js model
      const plantClass = this.detectPlantClassFromImage(imageUri);
      const mapping = plantVillageMapping[plantClass] || {
        plantName: 'Unknown Plant',
        scientificName: 'Unknown',
        disease: 'healthy',
        pest: 'none',
        healthScore: 75
      };

      const disease = getDiseaseInfo(mapping.disease);
      const pest = getPestInfo(mapping.pest);

      return {
        plantName: mapping.plantName,
        scientificName: mapping.scientificName,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
        isHealthy: mapping.disease === 'healthy',
        diseases: mapping.disease !== 'healthy' ? [disease] : [],
        pests: mapping.pest !== 'none' ? [pest] : [],
        overallHealth: mapping.healthScore,
        recommendations: this.generateRecommendations(mapping.disease, mapping.pest),
        nextSteps: this.generateNextSteps(mapping.disease, mapping.pest),
        scanDate: new Date(),
        imageUrl: imageUri
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze plant image');
    }
  }

  private detectPlantClassFromImage(imageUri: string): keyof typeof plantVillageMapping {
    // In production, this would use actual image classification
    // For now, simulate based on filename or random selection
    const classes = Object.keys(plantVillageMapping) as Array<keyof typeof plantVillageMapping>;
    return classes[Math.floor(Math.random() * classes.length)];
  }

  private generateRecommendations(disease: string, pest: string): string[] {
    const recommendations = [];
    
    if (disease !== 'healthy') {
      recommendations.push('Apply appropriate fungicide or treatment');
      recommendations.push('Improve air circulation around plants');
      recommendations.push('Remove affected leaves');
    }
    
    if (pest !== 'none') {
      recommendations.push('Use organic pest control methods');
      recommendations.push('Monitor plants regularly for pest activity');
    }
    
    if (disease === 'healthy' && pest === 'none') {
      recommendations.push('Continue good plant care practices');
      recommendations.push('Monitor for early signs of issues');
    }
    
    return recommendations;
  }

  private generateNextSteps(disease: string, pest: string): string[] {
    const nextSteps = [];
    
    if (disease !== 'healthy') {
      nextSteps.push('Apply treatment within 24-48 hours');
      nextSteps.push('Monitor plant daily for 1 week');
      nextSteps.push('Take follow-up photos in 7 days');
    }
    
    if (pest !== 'none') {
      nextSteps.push('Inspect nearby plants for similar issues');
      nextSteps.push('Implement pest prevention measures');
    }
    
    nextSteps.push('Document findings for future reference');
    
    return nextSteps;
  }
}

export const plantModel = new PlantModel();

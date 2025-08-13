import { PlantDisease, PestInfo } from '../types/plantHealth';

export function getDiseaseInfo(diseaseId: string): PlantDisease {
  const diseaseDatabase: Record<string, PlantDisease> = {
    'early_blight': {
      id: 'early_blight',
      name: 'Early Blight',
      scientificName: 'Alternaria solani',
      commonNames: ['Early blight', 'Target spot'],
      description: 'A fungal disease affecting tomatoes and potatoes',
      symptoms: [
        'Dark spots on leaves',
        'Concentric rings',
        'Leaf yellowing',
        'Defoliation'
      ],
      causes: [
        'Fungal infection',
        'Wet conditions',
        'Poor air circulation'
      ],
      treatments: [
        {
          id: 'fungicide',
          name: 'Fungicide Treatment',
          description: 'Apply copper-based fungicide',
          method: 'chemical',
          application: 'Spray on affected areas',
          frequency: 'Every 7-10 days',
          duration: '2-3 weeks',
          precautions: ['Wear protective equipment', 'Avoid overuse'],
          effectiveness: 85
        }
      ],
      prevention: [
        {
          id: 'crop_rotation',
          name: 'Crop Rotation',
          description: 'Rotate crops annually',
          methods: ['Plant non-solanaceous crops'],
          timing: 'Before planting season',
          frequency: 'Every year'
        }
      ],
      severity: 'medium',
      images: []
    },
    'late_blight': {
      id: 'late_blight',
      name: 'Late Blight',
      scientificName: 'Phytophthora infestans',
      commonNames: ['Late blight', 'Potato blight'],
      description: 'A fungal disease affecting potatoes and tomatoes',
      symptoms: [
        'Dark spots on leaves',
        'White fungal growth',
        'Leaf yellowing',
        'Stem lesions'
      ],
      causes: [
        'Fungal infection',
        'Wet conditions',
        'Poor air circulation'
      ],
      treatments: [
        {
          id: 'fungicide',
          name: 'Fungicide Treatment',
          description: 'Apply copper-based fungicide',
          method: 'chemical',
          application: 'Spray on affected areas',
          frequency: 'Every 7-10 days',
          duration: '2-3 weeks',
          precautions: ['Wear protective equipment', 'Avoid overuse'],
          effectiveness: 85
        }
      ],
      prevention: [
        {
          id: 'crop_rotation',
          name: 'Crop Rotation',
          description: 'Rotate crops annually',
          methods: ['Plant non-solanaceous crops'],
          timing: 'Before planting season',
          frequency: 'Every year'
        }
      ],
      severity: 'high',
      images: []
    }
  };

  return diseaseDatabase[diseaseId] || diseaseDatabase['early_blight'];
}

export function getPestInfo(pestId: string): PestInfo {
  const pestDatabase: Record<string, PestInfo> = {
    'aphids': {
      id: 'aphids',
      name: 'Aphids',
      scientificName: 'Aphis gossypii',
      type: 'insect',
      description: 'Small sap-sucking insects that attack plants',
      damage: [
        'Yellowing leaves',
        'Stunted growth',
        'Honeydew secretion'
      ],
      symptoms: [
        'Yellowing leaves',
        'Stunted growth',
        'Honeydew secretion'
      ],
      prevention: [
        {
          id: 'natural_predators',
          name: 'Natural Predators',
          description: 'Introduce natural predators',
          methods: ['Introduce ladybugs', 'Use neem oil'],
          timing: 'Before infestation',
          frequency: 'As needed'
        }
      ],
      treatments: [
        {
          id: 'insecticide',
          name: 'Insecticide Treatment',
          description: 'Apply insecticide',
          method: 'chemical',
          application: 'Spray on affected areas',
          frequency: 'Every 7-10 days',
          duration: '2-3 weeks',
          precautions: ['Wear protective equipment', 'Avoid overuse'],
          effectiveness: 85
        }
      ],
      images: []
    }
  };

  return pestDatabase[pestId] || pestDatabase['aphids'];
}

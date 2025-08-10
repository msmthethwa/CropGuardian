import { PlantDisease, PestInfo, Treatment, Prevention } from '../types/plantHealth';

export const diseaseDatabase: Record<string, PlantDisease> = {
  'tomato_blight': {
    id: 'tomato_blight',
    name: 'Tomato Blight',
    scientificName: 'Phytophthora infestans',
    commonNames: ['Late Blight', 'Potato Blight', 'Tomato Late Blight'],
    description: 'A serious fungal disease affecting tomatoes and potatoes, causing dark lesions on leaves and stems.',
    symptoms: [
      'Dark brown/black lesions on leaves',
      'White fungal growth on leaf undersides',
      'Stem lesions with concentric rings',
      'Fruit rot starting at stem end',
      'Rapid plant decline in humid conditions'
    ],
    causes: [
      'Fungal pathogen Phytophthora infestans',
      'High humidity (>90%)',
      'Temperatures between 60-80°F',
      'Poor air circulation',
      'Infected plant debris'
    ],
    treatments: [
      {
        id: 'copper_fungicide',
        name: 'Copper-based Fungicide',
        description: 'Apply copper-based fungicide to prevent spread',
        method: 'chemical',
        application: 'Spray on affected plants every 7-10 days',
        frequency: 'Weekly during disease pressure',
        duration: 'Continue until 2 weeks after symptoms disappear',
        precautions: ['Wear protective equipment', 'Avoid spraying during bloom', 'Test on small area first'],
        effectiveness: 75
      },
      {
        id: 'organic_neem',
        name: 'Neem Oil Treatment',
        description: 'Organic neem oil application',
        method: 'organic',
        application: 'Mix 2% neem oil solution and spray',
        frequency: 'Every 5-7 days',
        duration: '2-3 weeks',
        precautions: ['Apply in evening', 'Avoid high temperatures'],
        effectiveness: 60
      }
    ],
    prevention: [
      {
        id: 'proper_spacing',
        name: 'Proper Plant Spacing',
        description: 'Ensure adequate spacing for air circulation',
        methods: ['Space plants 24-36 inches apart', 'Stake tall varieties', 'Prune lower leaves'],
        timing: 'At planting',
        frequency: 'Ongoing maintenance'
      },
      {
        id: 'crop_rotation',
        name: 'Crop Rotation',
        description: 'Rotate crops to prevent pathogen buildup',
        methods: ['Rotate tomatoes with non-solanaceous crops', 'Remove plant debris', 'Use clean seeds'],
        timing: 'Seasonal',
        frequency: 'Every growing season'
      }
    ],
    severity: 'high',
    images: []
  },
  'tomato_early_blight': {
    id: 'tomato_early_blight',
    name: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    commonNames: ['Target Spot', 'Alternaria Blight'],
    description: 'A common fungal disease causing target-like lesions on leaves, stems, and fruit.',
    symptoms: [
      'Dark brown spots with concentric rings on leaves',
      'Yellowing around leaf spots',
      'Stem lesions near soil line',
      'Fruit spots with dark sunken areas',
      'Defoliation starting from bottom leaves'
    ],
    causes: [
      'Fungus Alternaria solani',
      'Warm temperatures (75-85°F)',
      'High humidity',
      'Overhead watering',
      'Stressed plants'
    ],
    treatments: [
      {
        id: 'chlorothalonil',
        name: 'Chlorothalonil Fungicide',
        description: 'Broad-spectrum fungicide for early blight control',
        method: 'chemical',
        application: 'Spray every 7-10 days',
        frequency: 'Weekly during favorable conditions',
        duration: 'Throughout growing season',
        precautions: ['Follow label instructions', 'Avoid during pollination'],
        effectiveness: 80
      }
    ],
    prevention: [
      {
        id: 'mulching',
        name: 'Mulching',
        description: 'Prevent soil splash onto lower leaves',
        methods: ['Apply 2-3 inch organic mulch', 'Use plastic mulch', 'Maintain mulch throughout season'],
        timing: 'After transplanting',
        frequency: 'Seasonal'
      }
    ],
    severity: 'medium',
    images: []
  }
};

export const pestDatabase: Record<string, PestInfo> = {
  'aphids': {
    id: 'aphids',
    name: 'Aphids',
    scientificName: 'Aphidoidea',
    type: 'insect',
    description: 'Small, soft-bodied insects that feed on plant sap, causing stunted growth and virus transmission.',
    damage: [
      'Stunted plant growth',
      'Curled or yellowing leaves',
      'Sticky honeydew on leaves',
      'Virus transmission',
      'Reduced fruit quality'
    ],
    symptoms: [
      'Visible clusters of small insects on stems and leaves',
      'Sticky honeydew on plant surfaces',
      'Presence of ants farming aphids',
      'Yellowing or curling leaves',
      'Sooty mold on honeydew'
    ],
    prevention: [
      {
        id: 'beneficial_insects',
        name: 'Encourage Beneficial Insects',
        description: 'Attract natural predators of aphids',
        methods: ['Plant flowering herbs', 'Avoid broad-spectrum pesticides', 'Provide water sources'],
        timing: 'Season-long',
        frequency: 'Ongoing'
      }
    ],
    treatments: [
      {
        id: 'insecticidal_soap',
        name: 'Insecticidal Soap',
        description: 'Organic soap spray for aphid control',
        method: 'organic',
        application: 'Spray directly on aphids',
        frequency: 'Every 2-3 days until controlled',
        duration: '1-2 weeks',
        precautions: ['Test on small area first', 'Apply in evening'],
        effectiveness: 85
      }
    ],
    images: []
  }
};

export const getDiseaseInfo = (diseaseId: string): PlantDisease | null => {
  return diseaseDatabase[diseaseId] || null;
};

export const getPestInfo = (pestId: string): PestInfo | null => {
  return pestDatabase[pestId] || null;
};

export const searchDiseases = (query: string): PlantDisease[] => {
  const results: PlantDisease[] = [];
  const lowerQuery = query.toLowerCase();
  
  Object.values(diseaseDatabase).forEach(disease => {
    if (
      disease.name.toLowerCase().includes(lowerQuery) ||
      disease.scientificName.toLowerCase().includes(lowerQuery) ||
      disease.commonNames.some(name => name.toLowerCase().includes(lowerQuery)) ||
      disease.symptoms.some(symptom => symptom.toLowerCase().includes(lowerQuery))
    ) {
      results.push(disease);
    }
  });
  
  return results;
};

export const searchPests = (query: string): PestInfo[] => {
  const results: PestInfo[] = [];
  const lowerQuery = query.toLowerCase();
  
  Object.values(pestDatabase).forEach(pest => {
    if (
      pest.name.toLowerCase().includes(lowerQuery) ||
      pest.scientificName.toLowerCase().includes(lowerQuery) ||
      pest.damage.some(damage => damage.toLowerCase().includes(lowerQuery)) ||
      pest.symptoms.some(symptom => symptom.toLowerCase().includes(lowerQuery))
    ) {
      results.push(pest);
    }
  });
  
  return results;
};

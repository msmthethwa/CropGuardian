import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { PlantHealthResult, ModelPrediction } from '../types/plantHealth';
import { getDiseaseInfo, getPestInfo } from './diseaseData';

export class PlantDiseaseModel {
  private model: tf.GraphModel | null = null;
  private isReady = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing plant disease detection model...');
      
      // Load the TensorFlow.js model from assets
      const modelJson = require('../assets/models/plant-disease-model/model.json');
      const modelWeights = require('../assets/models/plant-disease-model/weights.bin');
      
      this.model = await tf.loadGraphModel(
        bundleResourceIO(modelJson, modelWeights)
      );
      
      this.isReady = true;
      console.log('Plant disease model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading plant disease model:', error);
      return false;
    }
  }

  async analyzeImage(imageUri: string): Promise<PlantHealthResult | null> {
    if (!this.isReady || !this.model) {
      console.error('Model not initialized');
      return null;
    }

    try {
      // Load and preprocess image
      const imageTensor = await this.loadImage(imageUri);
      const processedImage = this.preprocessImage(imageTensor);

      // Run inference
      const predictions = await this.model.predict(processedImage) as tf.Tensor;
      const results = await this.processPredictions(predictions);

      // Clean up tensors
      imageTensor.dispose();
      processedImage.dispose();
      predictions.dispose();

      return results;
    } catch (error) {
      console.error('Error analyzing image:', error);
      return null;
    }
  }

  private async loadImage(uri: string): Promise<tf.Tensor3D> {
    // This would use react-native-image-picker or similar
    // For now, return placeholder
    return tf.zeros([224, 224, 3]) as tf.Tensor3D;
  }

  private preprocessImage(image: tf.Tensor3D): tf.Tensor4D {
    // Resize to model input size (224x224)
    const resized = tf.image.resizeBilinear(image, [224, 224]);
    
    // Normalize pixel values to [0, 1]
    const normalized = resized.div(255.0);
    
    // Add batch dimension
    const batched = normalized.expandDims(0);
    
    return batched as tf.Tensor4D;
  }

  private async processPredictions(predictions: tf.Tensor): Promise<PlantHealthResult> {
    const predictionData = await predictions.data();
    
    // Parse prediction results
    const plantClass = this.getPlantClass(predictionData[0]);
    const diseaseClass = this.getDiseaseClass(predictionData[1]);
    const pestClass = this.getPestClass(predictionData[2]);
    const confidence = predictionData[3];

    // Get detailed information from database
    const diseaseInfo = diseaseClass ? getDiseaseInfo(diseaseClass) : null;
    const pestInfo = pestClass ? getPestInfo(pestClass) : null;

    return {
      plantName: plantClass,
      scientificName: this.getScientificName(plantClass),
      confidence: confidence * 100,
      isHealthy: !diseaseClass && !pestClass,
      diseases: diseaseInfo ? [diseaseInfo] : [],
      pests: pestInfo ? [pestInfo] : [],
      overallHealth: this.calculateOverallHealth(confidence, diseaseInfo, pestInfo),
      recommendations: this.generateRecommendations(diseaseInfo, pestInfo),
      nextSteps: this.generateNextSteps(diseaseInfo, pestInfo),
      scanDate: new Date(),
      imageUrl: ''
    };
  }

  private getPlantClass(prediction: number): string {
    const plantClasses = [
      'Tomato', 'Potato', 'Pepper', 'Cucumber', 'Lettuce',
      'Cabbage', 'Carrot', 'Onion', 'Garlic', 'Beans'
    ];
    return plantClasses[Math.floor(prediction * plantClasses.length)] || 'Unknown';
  }

  private getDiseaseClass(prediction: number): string {
    const diseaseClasses = [
      'tomato_blight', 'tomato_early_blight', 'tomato_leaf_mold',
      'tomato_septoria_leaf_spot', 'tomato_spider_mites',
      'tomato_target_spot', 'tomato_yellow_leaf_curl_virus',
      'potato_late_blight', 'potato_early_blight'
    ];
    const index = Math.floor(prediction * diseaseClasses.length);
    return diseaseClasses[index] || '';
  }

  private getPestClass(prediction: number): string {
    const pestClasses = [
      'aphids', 'whiteflies', 'thrips', 'spider_mites',
      'leaf_miners', 'caterpillars', 'beetles', 'fungus_gnats'
    ];
    const index = Math.floor(prediction * pestClasses.length);
    return pestClasses[index] || '';
  }

  private getScientificName(plantName: string): string {
    const scientificNames: Record<string, string> = {
      'Tomato': 'Solanum lycopersicum',
      'Potato': 'Solanum tuberosum',
      'Pepper': 'Capsicum annuum',
      'Cucumber': 'Cucumis sativus',
      'Lettuce': 'Lactuca sativa',
      'Cabbage': 'Brassica oleracea',
      'Carrot': 'Daucus carota',
      'Onion': 'Allium cepa',
      'Garlic': 'Allium sativum',
      'Beans': 'Phaseolus vulgaris'
    };
    return scientificNames[plantName] || 'Unknown';
  }

  private calculateOverallHealth(
    confidence: number,
    disease: any,
    pest: any
  ): number {
    let health = confidence * 100;
    
    if (disease) {
      const severityMultiplier: Record<string, number> = {
        'low': 0.9,
        'medium': 0.7,
        'high': 0.5,
        'critical': 0.3
      };
      const severity = disease.severity as keyof typeof severityMultiplier;
      health *= severityMultiplier[severity] || 0.8;
    }
    
    if (pest) {
      health *= 0.85; // Reduce health by 15% for pest presence
    }
    
    return Math.max(0, Math.min(100, health));
  }

  private generateRecommendations(
    disease: any,
    pest: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (disease) {
      recommendations.push(
        `Apply appropriate treatment for ${disease.name}`,
        'Improve air circulation around plants',
        'Avoid overhead watering',
        'Remove affected plant parts'
      );
    }
    
    if (pest) {
      recommendations.push(
        `Control ${pest.name} using recommended methods`,
        'Monitor plants regularly for pest activity',
        'Encourage beneficial insects',
        'Maintain plant health to resist pest damage'
      );
    }
    
    if (!disease && !pest) {
      recommendations.push(
        'Plant appears healthy - continue good care practices',
        'Monitor regularly for early signs of problems',
        'Maintain proper watering and nutrition'
      );
    }
    
    return recommendations;
  }

  private generateNextSteps(
    disease: any,
    pest: any
  ): string[] {
    const nextSteps: string[] = [];
    
    if (disease) {
      nextSteps.push(
        'Apply first treatment within 24-48 hours',
        'Monitor plant response over next 7 days',
        'Take follow-up photos to track progress',
        'Adjust treatment if no improvement seen'
      );
    }
    
    if (pest) {
      nextSteps.push(
        'Begin pest control measures immediately',
        'Check nearby plants for similar issues',
        'Reapply treatments as per schedule',
        'Evaluate effectiveness after 1 week'
      );
    }
    
    return nextSteps;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isReady = false;
  }
}

// Singleton instance
export const plantModel = new PlantDiseaseModel();

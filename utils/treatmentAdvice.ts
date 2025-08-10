import { PlantHealthResult, Treatment, Prevention } from '../types/plantHealth';

export class TreatmentAdvisor {
  static getTreatmentPlan(healthResult: PlantHealthResult): {
    immediateActions: string[];
    shortTermPlan: string[];
    longTermStrategy: string[];
    treatments: Treatment[];
    prevention: Prevention[];
  } {
    const immediateActions: string[] = [];
    const shortTermPlan: string[] = [];
    const longTermStrategy: string[] = [];
    const treatments: Treatment[] = [];
    const prevention: Prevention[] = [];

    // Immediate actions based on severity
    if (healthResult.overallHealth < 50) {
      immediateActions.push(
        'Isolate affected plants to prevent spread',
        'Remove severely damaged leaves or fruits',
        'Apply appropriate treatment immediately'
      );
    }

    // Disease-specific treatments
    healthResult.diseases.forEach(disease => {
      disease.treatments.forEach(treatment => {
        treatments.push(treatment);
      });
      
      disease.prevention.forEach(prev => {
        prevention.push(prev);
      });
    });

    // Pest-specific treatments
    healthResult.pests.forEach(pest => {
      pest.treatments.forEach(treatment => {
        treatments.push(treatment);
      });
      
      pest.prevention.forEach(prev => {
        prevention.push(prev);
      });
    });

    // Short-term plan (1-2 weeks)
    shortTermPlan.push(
      'Monitor plant daily for changes',
      'Apply treatments as scheduled',
      'Adjust watering and nutrition',
      'Check environmental conditions'
    );

    // Long-term strategy (seasonal)
    longTermStrategy.push(
      'Implement crop rotation',
      'Improve soil health',
      'Select disease-resistant varieties',
      'Establish integrated pest management',
      'Maintain proper plant spacing',
      'Regular monitoring and maintenance'
    );

    return {
      immediateActions,
      shortTermPlan,
      longTermStrategy,
      treatments,
      prevention
    };
  }

  static getSeverityLevel(healthScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (healthScore >= 80) return 'low';
    if (healthScore >= 60) return 'medium';
    if (healthScore >= 40) return 'high';
    return 'critical';
  }

  static getPriorityActions(healthResult: PlantHealthResult): string[] {
    const priorityActions: string[] = [];
    
    // Critical issues first
    if (healthResult.overallHealth < 30) {
      priorityActions.push(
        'URGENT: Immediate treatment required',
        'Isolate affected plants',
        'Contact local extension service if needed'
      );
    }

    // Disease priorities
    healthResult.diseases.forEach(disease => {
      if (disease.severity === 'critical') {
        priorityActions.push(`Critical: ${disease.name} requires immediate attention`);
      }
    });

    // Pest priorities
    healthResult.pests.forEach(pest => {
      priorityActions.push(`Address ${pest.name} infestation`);
    });

    return priorityActions;
  }

  static getTreatmentTimeline(healthResult: PlantHealthResult): {
    day1: string[];
    week1: string[];
    week2: string[];
    month1: string[];
  } {
    const timeline = {
      day1: [] as string[],
      week1: [] as string[],
      week2: [] as string[],
      month1: [] as string[]
    };

    // Day 1 actions
    timeline.day1.push(
      'Apply first treatment',
      'Remove affected plant parts',
      'Adjust watering schedule',
      'Improve air circulation'
    );

    // Week 1 actions
    timeline.week1.push(
      'Monitor plant response',
      'Reapply treatments as needed',
      'Check for new symptoms',
      'Adjust environmental conditions'
    );

    // Week 2 actions
    timeline.week2.push(
      'Evaluate treatment effectiveness',
      'Continue maintenance treatments',
      'Document progress',
      'Plan next steps'
    );

    // Month 1 actions
    timeline.month1.push(
      'Complete treatment cycle',
      'Implement prevention measures',
      'Plan for next growing season',
      'Update monitoring schedule'
    );

    return timeline;
  }
}

export const treatmentAdvisor = TreatmentAdvisor;

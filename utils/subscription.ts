import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiryDate?: Date;
}

export class SubscriptionManager {
  static async getUserSubscription(): Promise<UserSubscription> {
    if (!auth.currentUser) {
      return { tier: 'free', status: 'active' };
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.subscription) {
        return {
          tier: userData.subscription.tier || 'free',
          status: userData.subscription.status || 'active',
          expiryDate: userData.subscription.expiryDate?.toDate(),
        };
      }
    } catch (error) {
      console.error('Error getting user subscription:', error);
    }

    return { tier: 'free', status: 'active' };
  }

  static async hasPremiumAccess(): Promise<boolean> {
    const subscription = await this.getUserSubscription();
    
    if (subscription.tier === 'premium' && subscription.status === 'active') {
      if (subscription.expiryDate && subscription.expiryDate < new Date()) {
        return false;
      }
      return true;
    }
    
    return false;
  }

  static async checkSubscriptionRestriction(
    feature: string,
    onRestricted?: () => void
  ): Promise<boolean> {
    const hasAccess = await this.hasPremiumAccess();
    
    if (!hasAccess && onRestricted) {
      onRestricted();
    }
    
    return hasAccess;
  }

  static formatExpiryDate(date?: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static getDaysUntilExpiry(expiryDate?: Date): number {
    if (!expiryDate) return 0;
    const diffTime = expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

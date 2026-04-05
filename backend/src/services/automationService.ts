import Subscription from '../models/Subscription.js';
import HealthPlan from '../models/HealthPlan.js';
import User from '../models/User.js';
import { sendPushNotification } from './notificationService.js';
import logger from '../utils/logger.js';

export const checkUpcomingRenewals = async () => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const subscriptions = await Subscription.find({
      status: 'active',
      endDate: { 
        $lte: thirtyDaysFromNow,
        $gt: new Date()
      }
    })
    .populate('beneficiaryId')
    .populate('plan');

    for (const sub of subscriptions) {
      const beneficiary: any = sub.beneficiaryId;
      const plan: any = sub.plan;
      
      // Only notify if beneficiary is a User (Client) and has tokens
      if (beneficiary && beneficiary.pushTokens && beneficiary.pushTokens.length > 0) {
        await sendPushNotification(
          beneficiary.pushTokens,
          'Renovação de Plano',
          `O seu plano ${plan?.name || ''} expira em menos de 30 dias. Contacte o seu corretor para renovar.`,
          { type: 'renewal', subscriptionId: sub._id.toString() }
        );
        logger.info(`Renewal alert sent to ${beneficiary.email} for sub ${sub._id}`);
      }
    }
  } catch (error) {
    logger.error('Error checking renewals:', error);
  }
};

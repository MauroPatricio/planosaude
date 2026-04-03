import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import User from '../models/User.js';

const expo = new Expo();

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`User ${userId} has no push tokens.`);
      return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of user.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    // NOTE: In a production app, you'd also want to handle receipts to remove invalid tokens
    return tickets;
  } catch (error) {
    console.error('Error in sendPushNotification service:', error);
  }
};

import logger from './logger.js';

/**
 * Mock Email Service for Planosaude CRM
 * In a real-world scenario, this would use nodemailer, SendGrid, or AWS SES.
 */
export const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    // We log the email to the console to simulate sending
    logger.info(`📧 SENDING EMAIL TO: ${to}`);
    logger.info(`📝 SUBJECT: ${subject}`);
    logger.info(`📄 BODY: ${body.substring(0, 50)}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: 'mock-id-' + Date.now() };
  } catch (error: any) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendApprovalNotification = async (clientEmail: string, clientName: string, status: string, type: string) => {
  const subject = `Resumo da sua solicitação: ${type.toUpperCase()}`;
  const statusMsg = status === 'approved' ? 'Aprovada ✅' : 'Rejeitada ❌';
  
  const body = `
    Olá ${clientName},
    
    Informamos que a sua solicitação de "${type}" foi processada pela nossa equipa.
    Status: ${statusMsg}
    
    Pode consultar os detalhes no seu Portal do Cliente.
    
    Melhores cumprimentos,
    Equipa Planosaude
  `;
  
  return sendEmail(clientEmail, subject, body);
};

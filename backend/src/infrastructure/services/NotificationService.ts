export class NotificationService {
  static sendSignatureNotification(
    channel: 'EMAIL' | 'WHATSAPP' | 'AMBOS' | 'LINK',
    recipientEmail: string,
    recipientWhatsapp: string | null,
    contractTitle: string,
    token: string,
  ): void {
    const signatureLink = `http://localhost:5173/assinar/${token}`;

    console.log('\n==================================================');
    console.log(`[NOTIFICAÇÃO MOCK] Iniciando disparo de assinatura...`);
    console.log(`Contrato: "${contractTitle}"`);
    console.log(`Canais de Envio Solicitados: ${channel}`);
    
    if (channel === 'EMAIL' || channel === 'AMBOS') {
      console.log(`- Enviando e-mail para: ${recipientEmail}`);
      console.log(`  Texto do e-mail: Olá! Por favor, acesse o link para assinar o contrato: ${signatureLink}`);
    }

    if ((channel === 'WHATSAPP' || channel === 'AMBOS') && recipientWhatsapp) {
      console.log(`- Enviando WhatsApp para: ${recipientWhatsapp}`);
      console.log(`  Texto da mensagem: Olá! Segue link para assinatura do seu contrato: ${signatureLink}`);
    }

    console.log('==================================================\n');
  }
}

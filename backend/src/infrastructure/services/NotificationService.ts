import nodemailer from 'nodemailer';

export class NotificationService {
  static async sendSignatureNotification(
    channel: 'EMAIL' | 'WHATSAPP' | 'AMBOS' | 'LINK',
    recipientEmail: string,
    recipientWhatsapp: string | null,
    contractTitle: string,
    token: string,
  ): Promise<void> {
    const signatureLink = `http://localhost:5173/assinar/${token}`;

    console.log('\n==================================================');
    console.log(`[NOTIFICAÇÃO] Iniciando disparo de assinatura...`);
    console.log(`Contrato: "${contractTitle}"`);
    console.log(`Canais de Envio Solicitados: ${channel}`);
    
    if (channel === 'EMAIL' || channel === 'AMBOS') {
      try {
        console.log(`- Gerando credenciais de teste do Ethereal...`);
        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
          },
        });

        const info = await transporter.sendMail({
          from: '"Supabaze Sign" <no-reply@supabaze.com>',
          to: recipientEmail,
          subject: `Assinatura de Contrato Solicitada: ${contractTitle}`,
          text: `Olá! Por favor, acesse o link para assinar o contrato: ${signatureLink}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #00A676;">Supabaze Sign</h2>
              <p>Olá,</p>
              <p>Você foi convidado para assinar o contrato eletronicamente: <strong>${contractTitle}</strong>.</p>
              <p>Por favor, clique no botão abaixo para revisar e assinar o documento:</p>
              <div style="margin: 30px 0;">
                <a href="${signatureLink}" style="background-color: #00A676; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Revisar e Assinar</a>
              </div>
              <p style="font-size: 12px; color: #777;">Se o botão não funcionar, acesse: <a href="${signatureLink}">${signatureLink}</a></p>
            </div>
          `,
        });

        console.log(`- E-mail enviado com sucesso para: ${recipientEmail}`);
        console.log(`> [URL DE TESTE] Visualize o e-mail real aqui: ${nodemailer.getTestMessageUrl(info)}`);
      } catch (error) {
        console.error(`- Erro ao enviar e-mail via Ethereal:`, error);
      }
    }

    if ((channel === 'WHATSAPP' || channel === 'AMBOS') && recipientWhatsapp) {
      console.log(`- [MOCK] Enviando WhatsApp para: ${recipientWhatsapp}`);
      console.log(`  Texto da mensagem: Olá! Segue link para assinatura do seu contrato: ${signatureLink}`);
    }

    console.log('==================================================\n');
  }
}

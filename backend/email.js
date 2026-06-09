import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Por defecto usamos gmail, se puede configurar otro SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

export const sendRecoveryEmail = async (to, newPassword) => {
  const mailOptions = {
    from: `"Casa Tuti" <${process.env.EMAIL_USER || 'no-reply@casatuti.com'}>`,
    to,
    subject: 'Recuperación de Contraseña - Casa Tuti',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #455f3e;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para recuperar tu contraseña en la plataforma de Casa Tuti.</p>
        <p>Tu nueva contraseña temporal es: <strong>${newPassword}</strong></p>
        <p>Por favor, usa esta contraseña para iniciar sesión. Te recomendamos cambiarla por una propia más adelante.</p>
        <br>
        <p>Saludos,<br>El equipo de Casa Tuti</p>
      </div>
    `
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Credenciales de correo no configuradas (.env EMAIL_USER y EMAIL_PASS).');
      console.warn(`Simulando envío a ${to}. Contraseña temporal: ${newPassword}`);
      return true; // Simulamos éxito en desarrollo
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Correo de recuperación enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo de recuperación.');
  }
};

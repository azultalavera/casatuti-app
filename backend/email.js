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

export const getPronoun = (genero) => {
  switch (genero?.toUpperCase()) {
    case 'M': return 'o';
    case 'F': return 'a';
    case 'X': return 'e';
    default: return 'a'; // Default histórico
  }
};

export const sendWelcomeEmail = async (to, name, tempPassword, rulesHtml, genero = 'F') => {
  const p = getPronoun(genero);
  const mailOptions = {
    from: `"Casa Tuti" <${process.env.EMAIL_USER || 'no-reply@casatuti.com'}>`,
    to,
    subject: `¡Bienvenid${p} a Casa Tuti! - Tus accesos y normas de convivencia`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #455f3e; text-align: center;">¡Bienvenid${p} a Casa Tuti, ${name}!</h2>
        <p>Estamos muy felices de que te unas a nuestro taller.</p>
        
        <h3 style="color: #a84231;">Tus credenciales de acceso</h3>
        <p>Tu cuenta ha sido creada exitosamente. Para ingresar a la plataforma, utiliza los siguientes datos:</p>
        <ul>
          <li><strong>Email:</strong> ${to}</li>
          <li><strong>Contraseña provisoria:</strong> <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</span></li>
        </ul>
        <p style="color: #d97706; font-weight: bold;">⚠️ Importante: Te recomendamos cambiar esta contraseña por una propia en tu primer inicio de sesión.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

        <h3 style="color: #455f3e;">Normas de Convivencia</h3>
        <p>Para asegurar la mejor experiencia para tod${p}s, te pedimos que leas nuestras normas de convivencia:</p>
        <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; font-size: 14px;">
          ${rulesHtml}
        </div>
        
        <br>
        <p style="text-align: center;">¡Nos vemos en clase!<br><strong>El equipo de Casa Tuti</strong></p>
      </div>
    `
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Credenciales de correo no configuradas. Simulando email de bienvenida.');
      return true;
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo de bienvenida enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo de bienvenida:', error);
    // No lanzamos error para que la creación del usuario no falle si el correo falla
    return false;
  }
};

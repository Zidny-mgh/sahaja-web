import nodemailer from 'nodemailer';

export interface BookingDetails {
  serviceName: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  totalAmount: number;
}

export const sendAdminNotification = async (
  bookingDetails: BookingDetails,
  patientName: string,
  patientPhone: string,
  isReschedule: boolean = false
): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (!adminEmail) {
      console.warn('[EmailNotification] ADMIN_EMAIL is not set in environment variables. Notification skipped.');
      return;
    }

    if (!gmailUser || !gmailPass) {
      console.warn('[EmailNotification] GMAIL_USER or GMAIL_PASS is not configured. Notification skipped.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const priceFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(bookingDetails.totalAmount);

    const emailSubject = isReschedule
      ? 'Notifikasi Penjadwalan Ulang (Reschedule) - Totok Punggung Sahaja'
      : 'Notifikasi Kunjungan Baru - Totok Punggung Sahaja';

    const emailBody = isReschedule
      ? `PEMBERITAHUAN RESCHEDULE: Pasien ${patientName} (${patientPhone}) mengubah jadwal menjadi ${formattedDate} (Slot ${bookingDetails.scheduledTime}).`
      : `Terdapat pesanan terapi baru dari ${patientName} - ${patientPhone}. Layanan: ${bookingDetails.serviceName}, Tanggal & Waktu: ${formattedDate} (Slot ${bookingDetails.scheduledTime}), Total: ${priceFormatted}`;

    const mailOptions = {
      from: `"Totok Punggung Sahaja" <${gmailUser}>`,
      to: adminEmail,
      subject: emailSubject,
      text: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailNotification] Notification sent successfully to admin:', info.messageId);
  } catch (error) {
    console.error('[EmailNotification] Failed to send email to admin:', error);
  }
};

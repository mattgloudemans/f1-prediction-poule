import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// HTML escape function to prevent XSS in email templates
const escapeHtml = (text: string): string => {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendMagicLink = async (email: string, token: string, nickname: string) => {
  const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to F1 Prediction Poule - Login Link',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E10600;">F1 Prediction Poule 2026</h2>
        <p>Hello ${escapeHtml(nickname)}!</p>
        <p>Click the button below to access your account:</p>
        <a href="${magicLink}"
           style="display: inline-block; background-color: #E10600; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 5px;
                  margin: 20px 0;">
          Access My Account
        </a>
        <p>Or copy this link: <a href="${magicLink}">${magicLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Magic link email sent to:', email);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendPredictionConfirmation = async (
  email: string,
  nickname: string,
  raceName: string,
  predictions: string[]
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Prediction Confirmed - ${raceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E10600;">Prediction Confirmed!</h2>
        <p>Hello ${escapeHtml(nickname)}!</p>
        <p>Your prediction for <strong>${escapeHtml(raceName)}</strong> has been saved:</p>
        <ol style="line-height: 2;">
          ${predictions.map((driver) => `<li>${escapeHtml(driver)}</li>`).join('')}
        </ol>
        <p style="margin-top: 20px;">
          You can update your prediction until 1 minute before the race starts.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Good luck! 🏎️
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Prediction confirmation email sent to:', email);
  } catch (error) {
    console.error('Error sending prediction confirmation:', error);
  }
};

export interface RaceResultForEmail {
  position: number;
  driverName: string;
  points: number;
}

export interface UserPredictionResult {
  predictedPosition: number;
  driverName: string;
  actualPosition: number | null;
  pointsEarned: number;
  hasBonus: boolean;
}

export const sendProvisionalResults = async (
  email: string,
  nickname: string,
  raceName: string,
  raceResults: RaceResultForEmail[],
  userPrediction: UserPredictionResult[],
  totalPoints: number
) => {
  const top10Results = raceResults.slice(0, 10);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Race Results - ${raceName} (Provisional)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E10600;">Provisional Race Results</h2>
        <p>Hello ${escapeHtml(nickname)}!</p>
        <p>The <strong>${escapeHtml(raceName)}</strong> has finished! Here are the provisional results:</p>

        <h3 style="color: #333; margin-top: 20px;">Race Results (Top 10)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #E10600; color: white;">
            <th style="padding: 8px; text-align: left;">Pos</th>
            <th style="padding: 8px; text-align: left;">Driver</th>
            <th style="padding: 8px; text-align: right;">Points</th>
          </tr>
          ${top10Results.map((r, i) => `
            <tr style="background-color: ${i % 2 === 0 ? '#f9f9f9' : '#fff'};">
              <td style="padding: 8px;">${r.position}</td>
              <td style="padding: 8px;">${escapeHtml(r.driverName)}</td>
              <td style="padding: 8px; text-align: right;">${r.points}</td>
            </tr>
          `).join('')}
        </table>

        <h3 style="color: #333;">Your Prediction Results</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #333; color: white;">
            <th style="padding: 8px; text-align: left;">Predicted</th>
            <th style="padding: 8px; text-align: left;">Driver</th>
            <th style="padding: 8px; text-align: center;">Actual</th>
            <th style="padding: 8px; text-align: right;">Points</th>
          </tr>
          ${userPrediction.map((p, i) => `
            <tr style="background-color: ${p.hasBonus ? '#d4edda' : (i % 2 === 0 ? '#f9f9f9' : '#fff')};">
              <td style="padding: 8px;">P${p.predictedPosition}</td>
              <td style="padding: 8px;">${escapeHtml(p.driverName)}</td>
              <td style="padding: 8px; text-align: center;">${p.actualPosition ? `P${p.actualPosition}` : 'DNF/DNS'}</td>
              <td style="padding: 8px; text-align: right;">${p.pointsEarned}${p.hasBonus ? ' (+50%)' : ''}</td>
            </tr>
          `).join('')}
        </table>

        <div style="background-color: #E10600; color: white; padding: 15px; border-radius: 5px; text-align: center;">
          <strong>Your Total Points: ${totalPoints}</strong>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Note: These are provisional results. Final points will be calculated 24 hours after the race
          to account for any disqualifications or penalties.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Provisional results email sent to:', email);
  } catch (error) {
    console.error('Error sending provisional results email:', error);
  }
};

export const sendFinalResults = async (
  email: string,
  nickname: string,
  raceName: string,
  totalPoints: number,
  hasChanges: boolean,
  previousPoints?: number
) => {
  const changesSection = hasChanges && previousPoints !== undefined
    ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <strong>Results Updated!</strong><br>
        Due to post-race penalties/disqualifications, your points have changed:<br>
        Previous: ${previousPoints} points → Final: ${totalPoints} points
      </div>
    `
    : '';

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Final Results - ${raceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E10600;">Final Race Results Confirmed</h2>
        <p>Hello ${escapeHtml(nickname)}!</p>
        <p>The final results for <strong>${escapeHtml(raceName)}</strong> have been confirmed.</p>

        ${changesSection}

        <div style="background-color: #E10600; color: white; padding: 15px; border-radius: 5px; text-align: center;">
          <strong>Your Final Points: ${totalPoints}</strong>
        </div>

        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/leaderboard"
             style="display: inline-block; background-color: #333; color: white;
                    padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            View Leaderboard
          </a>
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          See you at the next race! 🏎️
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Final results email sent to:', email);
  } catch (error) {
    console.error('Error sending final results email:', error);
  }
};

export const sendRaceReminder = async (
  email: string,
  nickname: string,
  raceName: string,
  raceDate: Date
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Reminder: ${raceName} - Submit Your Prediction!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E10600;">Race Day Reminder!</h2>
        <p>Hello ${escapeHtml(nickname)}!</p>
        <p><strong>${escapeHtml(raceName)}</strong> is coming up on ${raceDate.toLocaleDateString()}!</p>
        <p>Don't forget to submit your prediction before the race starts.</p>
        <a href="${process.env.FRONTEND_URL}"
           style="display: inline-block; background-color: #E10600; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 5px;
                  margin: 20px 0;">
          Submit Prediction
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Good luck! 🏎️
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Race reminder email sent to:', email);
  } catch (error) {
    console.error('Error sending race reminder:', error);
  }
};

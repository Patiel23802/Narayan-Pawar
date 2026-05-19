/**
 * Sends OTP SMS via a configured provider (MSG91, Fast2SMS, or Twilio).
 * Set SMS_PROVIDER and the matching credentials in backend .env / Docker.
 */

function provider() {
  return String(process.env.SMS_PROVIDER || '').trim().toLowerCase();
}

export function isSmsConfigured() {
  const p = provider();
  if (p === 'msg91') {
    return Boolean(process.env.MSG91_AUTH_KEY?.trim() && process.env.MSG91_TEMPLATE_ID?.trim());
  }
  if (p === 'fast2sms') {
    return Boolean(process.env.FAST2SMS_API_KEY?.trim());
  }
  if (p === 'twilio') {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_PHONE_NUMBER?.trim()
    );
  }
  return false;
}

function toIndianE164(mobile10) {
  const digits = String(mobile10 || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new Error('Invalid mobile number');
  }
  return `91${digits}`;
}

async function sendViaMsg91(mobile10, otp) {
  const authkey = process.env.MSG91_AUTH_KEY.trim();
  const templateId = process.env.MSG91_TEMPLATE_ID.trim();
  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      authkey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: toIndianE164(mobile10),
      otp: String(otp),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.type === 'error') {
    const msg = data.message || data.msg || `MSG91 HTTP ${res.status}`;
    throw new Error(msg);
  }
}

async function sendViaFast2sms(mobile10, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY.trim();
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: String(otp),
      numbers: String(mobile10).replace(/\D/g, '').slice(-10),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.return === false) {
    const msg = data.message || `Fast2SMS HTTP ${res.status}`;
    throw new Error(msg);
  }
}

async function sendViaTwilio(mobile10, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID.trim();
  const token = process.env.TWILIO_AUTH_TOKEN.trim();
  const from = process.env.TWILIO_PHONE_NUMBER.trim();
  const appName = process.env.SMS_SENDER_NAME || 'Civic Pulse';
  const body = `${appName}: Your verification code is ${otp}. Valid for 10 minutes.`;

  const params = new URLSearchParams({
    To: `+91${String(mobile10).replace(/\D/g, '').slice(-10)}`,
    From: from,
    Body: body,
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || `Twilio HTTP ${res.status}`;
    throw new Error(msg);
  }
}

/** @param {string} mobile10 - 10-digit Indian mobile */
export async function sendOtpSms(mobile10, otp) {
  const p = provider();
  if (p === 'msg91') return sendViaMsg91(mobile10, otp);
  if (p === 'fast2sms') return sendViaFast2sms(mobile10, otp);
  if (p === 'twilio') return sendViaTwilio(mobile10, otp);
  throw new Error(`Unknown SMS_PROVIDER: ${p || '(not set)'}`);
}

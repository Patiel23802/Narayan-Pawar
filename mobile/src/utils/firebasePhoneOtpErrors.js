/**
 * Map Firebase Phone Auth / Identity Toolkit errors to actionable copy.
 */

export function formatFirebasePhoneOtpSendError(raw) {
  const msg = String(raw || '').trim();
  if (!msg) return 'Failed to send verification code. Please try again.';

  const lower = msg.toLowerCase();
  if (lower.includes('billing_not_enabled') || lower.includes('billing not enabled')) {
    return (
      'SMS verification is not active: Firebase billing is not enabled. ' +
      'Enable the Blaze plan in Firebase Console → Project settings → Upgrade, then retry.'
    );
  }

  if (lower.includes('quota-exceeded') || lower.includes('quota exceeded')) {
    return 'SMS limit reached. Please try again later or contact support.';
  }

  return msg;
}

const crypto = require("crypto");
const { otpRecords } = require("../data/authStore");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}


  function saveOtp(phone, otp, role) {
  otpRecords.set(phone, {
    otp,
    role,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    used: false,
  });
}


function verifyOtp(phone, enteredOtp) {
  const record = otpRecords.get(phone);

  if (!record) return { success: false, message: "OTP not found" };
  if (record.used) return { success: false, message: "OTP already used" };
  if (Date.now() > record.expiresAt) {
    return { success: false, message: "OTP expired" };
  }

  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    return { success: false, message: "Too many attempts" };
  }

  if (record.otp !== enteredOtp) {
    return { success: false, message: "Invalid OTP" };
  }

  record.used = true;

return {
  success: true,
  role: record.role,
};
}

module.exports = {
  generateOtp,
  saveOtp,
  verifyOtp,
};

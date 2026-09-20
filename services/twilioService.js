require("dotenv").config();

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMSOTP(phone, otp) {
  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;

  const message = await client.messages.create({
    from: process.env.TWILIO_SMS_FROM,
    to: formattedPhone,
    body: `Your DirectLink AI OTP is: ${otp}. This code expires in 5 minutes.`,
  });

  return message.sid;
}

async function sendWhatsAppOTP(phone, otp) {
  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;

  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${formattedPhone}`,
    body: `Your DirectLink AI OTP is: ${otp}. This code expires in 5 minutes.`,
  });

  return message.sid;
}

module.exports = {
  sendSMSOTP,
  sendWhatsAppOTP,
};
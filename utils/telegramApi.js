const axios = require("axios");
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text: text,
  });
}

// Kick a user from a chat
async function kickChatMember(chatId, userId) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
    chat_id: chatId,
    user_id: userId,
  });
}

async function deleteChat(chatId) {
  await sendMessage(chatId, "🛑 Le chat va être fermé manuellement (suppression automatique limitée dans Telegram).");
}

module.exports = { sendMessage, deleteChat, kickChatMember };
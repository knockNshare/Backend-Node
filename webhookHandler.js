const express = require('express');
const { isLoanCompleted } = require('./utils/loanManager');
const { sendMessage, deleteChat, kickChatMember } = require('./utils/telegramApi'); 
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log("📩 Webhook received:", req.body);
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from.id;

    console.log("💬 Received message:", text);

    if (isLoanCompleted(text)) {
      await sendMessage(chatId, "✅ Prêt terminé. Ce chat sera archivé.");
      await deleteChat(chatId);
      try {
        await kickChatMember(chatId, userId);
      } catch (err) {
        if (
          err.response &&
          err.response.data &&
          err.response.data.description &&
          err.response.data.description.includes("user_not_participant")
        ) {
          console.log("User already not in the group, skipping kick.");
        } else {
          throw err;
        }
      }
    }
    res.sendStatus(200);
  } catch (e) {
    // Always respond to Telegram, even on error
    res.sendStatus(200);
    console.error(e);
  }
});

module.exports = router;

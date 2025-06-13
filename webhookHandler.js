const express = require('express');
const { isLoanCompleted, isReminderCommand, parseReminder } = require('./utils/loanManager');
const { sendMessage, deleteChat, kickChatMember } = require('./utils/telegramApi');

module.exports = function(con) {
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

      // 1. Fin de prêt
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
        return res.sendStatus(200);
      }

      // 2. Enregistrement automatique du chat_id + /reminder à J-2
      if (text.toLowerCase().includes("début du prêt") && text.includes("#id=")) {
        const interestId = text.split("#id=")[1];
        if (!interestId) return res.sendStatus(200);

        // 2.1 Stocker chat_id
        con.query(
          `UPDATE interests SET chat_id = ? WHERE id = ?`,
          [chatId, interestId],
          err => {
            if (err) console.error("❌ Erreur enregistrement chat_id :", err.message);
            else console.log(`✅ chat_id ${chatId} enregistré pour interest ${interestId}`);
          }
        );

        // 2.2 Lire end_date et title, puis envoyer /reminder
        con.query(
          `SELECT i.end_date, p.title
           FROM interests i
           JOIN propositions p ON i.proposition_id = p.id
           WHERE i.id = ?`,
          [interestId],
          async (err, rows) => {
            if (err || rows.length === 0) {
              console.warn("⚠️ Aucune donnée pour reminder", interestId);
              return;
            }
            const { end_date, title } = rows[0];
            const endDate = new Date(end_date);
            const reminderDate = new Date(endDate.getTime() - 2 * 24*60*60*1000);
            const day = String(reminderDate.getDate()).padStart(2,'0');
            const month = String(reminderDate.getMonth()+1).padStart(2,'0');
            const year = reminderDate.getFullYear();
            const cmd = `/reminder ${day}-${month}-${year} "Rappel : L’objet « ${title} » doit être rendu dans 2 jours."`;
            try {
              await sendMessage(chatId, cmd);
              console.log("✅ Reminder command envoyé :", cmd);
            } catch(e) {
              console.error("❌ Erreur envoi reminder :", e.message);
            }
          }
        );

        return res.sendStatus(200);
      }

      // 3. Traitement manuel /reminder
      if (isReminderCommand(text)) {
        const parsed = parseReminder(text);
        if (!parsed) {
          await sendMessage(chatId, `Format invalide. Utilisez : /reminder JJ-MM-AAAA "Message"`);
          return res.sendStatus(200);
        }
        const { date, message: reminderMsg } = parsed;
        const delay = date - new Date();
        if (delay <= 0) {
          await sendMessage(chatId, "⏱️ La date de fin du prêt est passée !");
        } else {
          setTimeout(() => sendMessage(chatId, `🔔 Rappel : ${reminderMsg}`), delay);
          await sendMessage(chatId, `✅ Rappel programmé pour le ${date.toLocaleString()}`);
        }
        return res.sendStatus(200);
      }

      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      return res.sendStatus(200);
    }
  });

  return router;
};

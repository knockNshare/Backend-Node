// services/telegramService.js

const BOT_USERNAME = 'KnockNShareBot';  

/**
 * Génère un lien Telegram pour permettre à l’utilisateur de créer un groupe
 * avec le bot, en lien avec un prêt spécifique.
 *
 * @param {string} loanTitle - Le titre du prêt (ex: "Prêt de perceuse").
 * @returns {string} - Le lien cliquable vers Telegram
 */
function generateGroupLink(loanTitle = "KnockNshare") {
    const encodedTitle = encodeURIComponent(loanTitle.replace(/\s+/g, '_').toLowerCase());
    const timestamp = Date.now(); // pour générer un ID unique
    return `https://t.me/${BOT_USERNAME}?startgroup=${encodedTitle}_${timestamp}`;
}

/**
 * Construit un message de type : "Clique ici pour créer le groupe"
 *
 * @param {string} loanTitle
 * @returns {object} { message, link }
 */
function buildTelegramGroupMessage(loanTitle) {
    const link = generateGroupLink(loanTitle);
    const message = `🔗 Pour discuter du prêt « ${loanTitle} », [clique ici pour créer un groupe Telegram](${link}).`;
    return { message, link };
}

module.exports = {
    generateGroupLink,
    buildTelegramGroupMessage
};
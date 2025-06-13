function isLoanCompleted(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("terminé") || lowered.startsWith("/end") || lowered.includes("fin du prêt");
}

function isReminderCommand(text) {
  return text.toLowerCase().startsWith("/reminder ");
}

function parseReminder(text) {
  // Exemple : /reminder 25-06-2025 "Message"
  const match = text.match(/^\/reminder\s+(\d{2})-(\d{2})-(\d{4})\s+"(.+)"$/);
  if (!match) return null;

  const [_, day, month, year, message] = match;
  const date = new Date(`${year}-${month}-${day}T08:00:00`); // conversion explicite en ISO

  return { date, message };
}


module.exports = {
  isLoanCompleted,
  isReminderCommand,
  parseReminder
};

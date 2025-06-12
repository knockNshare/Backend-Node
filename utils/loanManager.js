function isLoanCompleted(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("terminé") || lowered.startsWith("/end") || lowered.includes("fin du prêt");
}

module.exports = { isLoanCompleted };

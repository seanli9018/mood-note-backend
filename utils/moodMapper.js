exports.moodLevelToName = (avgMoodLevel) => {
  if (avgMoodLevel <= 20) return 'frustrated';
  if (avgMoodLevel > 20 && avgMoodLevel <= 30) return 'stressed';
  if (avgMoodLevel > 30 && avgMoodLevel <= 40) return 'bad';
  if (avgMoodLevel > 40 && avgMoodLevel <= 50) return 'dissatisfied';
  if (avgMoodLevel > 50 && avgMoodLevel <= 60) return 'neutral';
  if (avgMoodLevel > 60 && avgMoodLevel <= 70) return 'calm';
  if (avgMoodLevel > 70 && avgMoodLevel <= 80) return 'satisfied';
  if (avgMoodLevel > 80 && avgMoodLevel <= 90) return 'very-satisfied';
  if (avgMoodLevel > 90) return 'excited';
  return 'unknown'; // Default case
};

exports.moodNameToLevel = (moodName) => {
  switch (moodName) {
    case 'excited':
      return 100;
    case 'very-satisfied':
      return 90;
    case 'satisfied':
      return 80;
    case 'calm':
      return 70;
    case 'neutral':
      return 60;
    case 'dissatisfied':
      return 50;
    case 'bad':
      return 40;
    case 'stressed':
      return 30;
    case 'frustrated':
      return 20;
  }
};

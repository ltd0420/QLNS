const POSITIVE_WORDS = [
  'tốt',
  'tuyệt',
  'hài lòng',
  'đẹp',
  'nhanh',
  'chuyên nghiệp',
  'nhiệt tình',
  'hỗ trợ',
  'thân thiện',
  'hiệu quả',
  'xuất sắc',
  'đoàn kết',
];

const NEGATIVE_WORDS = [
  'xấu',
  'tệ',
  'chậm',
  'bực',
  'không hài lòng',
  'giận',
  'khiếu nại',
  'phàn nàn',
  'lâu',
  'tồi',
  'khó chịu',
  'stress',
];

function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function analyzeSentiment(text, rating = null) {
  const tokens = tokenize(text);
  let score = 0;
  const matchedKeywords = new Set();

  tokens.forEach((token) => {
    if (POSITIVE_WORDS.includes(token)) {
      score += 1;
      matchedKeywords.add(token);
    } else if (NEGATIVE_WORDS.includes(token)) {
      score -= 1;
      matchedKeywords.add(token);
    }
  });

  if (typeof rating === 'number') {
    score += (rating - 3) * 0.5;
  }

  const normalizedScore = Math.max(-1, Math.min(1, score / 5));
  let sentiment = 'Trung lập';
  if (normalizedScore >= 0.2) {
    sentiment = 'Tích cực';
  } else if (normalizedScore <= -0.2) {
    sentiment = 'Tiêu cực';
  }

  return {
    sentiment,
    sentiment_score: Number((normalizedScore + 1) / 2).toFixed(2),
    keywords: Array.from(matchedKeywords),
  };
}

module.exports = {
  analyzeSentiment,
};


export const sampleWords = [
  {
    japanese: 'こんにちは',
    romaji: 'konnichiwa',
    english: 'hello',
    parts: { type: 'greeting' }
  },
  {
    japanese: 'さようなら',
    romaji: 'sayounara',
    english: 'goodbye',
    parts: { type: 'greeting' }
  }
];

export const sampleGroups = [
  {
    name: 'Basic Greetings',
    words: [sampleWords[0], sampleWords[1]]
  }
]; 
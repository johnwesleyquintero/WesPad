export const calculateWordCount = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export const calculateReadingTime = (wordCount: number): number => {
  return Math.ceil(wordCount / 225);
};

export const getSelectionStats = (text: string) => {
  const wordCount = calculateWordCount(text);
  return {
    wordCount,
    charCount: text.length,
    selectedText: text,
  };
};

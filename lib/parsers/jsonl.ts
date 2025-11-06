export const parseJsonl = (text: string) => {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error('Error parsing JSONL line:', error);
      throw new Error(`Invalid JSONL line: ${line.substring(0, 50)}...`);
    }
  });
};


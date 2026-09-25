/*
 * Lexicon-based sentiment analysis engine with negation handling,
 * intensifier/modifier detection, and multi-word phrase matching.
 * Runs entirely in the browser — no external API calls.
 */

export interface KeywordContribution {
  word: string;
  score: number;
  type: 'positive' | 'negative' | 'negated' | 'intensified';
}

export interface SentimentResult {
  score: number;        // -1.0 to 1.0
  label: 'positive' | 'negative' | 'neutral';
  magnitude: number;   // 0 to 1.0 — absolute strength
  confidence: number;  // 0 to 1.0
  keywords: KeywordContribution[];
  wordCount: number;
  positiveCount: number;
  negativeCount: number;
  comparative: number; // score normalized by word count
}

// Positive and negative word lexicons with weights
const POSITIVE_LEXICON: Record<string, number> = {
  excellent: 0.9, amazing: 0.85, great: 0.7, good: 0.55, wonderful: 0.85,
  fantastic: 0.85, outstanding: 0.9, perfect: 0.9, love: 0.8, loved: 0.8,
  like: 0.4, liked: 0.4, enjoy: 0.6, enjoyed: 0.6, enjoyable: 0.65,
  helpful: 0.6, clear: 0.45, engaging: 0.7, interesting: 0.55,
  brilliant: 0.85, awesome: 0.8, superb: 0.85, best: 0.8, better: 0.5,
  happy: 0.6, glad: 0.5, pleased: 0.55, satisfied: 0.6, impressed: 0.7,
  recommend: 0.5, valuable: 0.65, inspiring: 0.75, motivating: 0.7,
  supportive: 0.6, knowledgeable: 0.65, thorough: 0.5, organized: 0.5,
  effective: 0.55, efficient: 0.5, productive: 0.5, positive: 0.5,
  success: 0.6, successful: 0.65, rewarding: 0.65, fun: 0.5, excited: 0.6,
  grateful: 0.65, appreciate: 0.55, appreciated: 0.6, pass: 0.4,
  easy: 0.4, comfortable: 0.45, confident: 0.5, improve: 0.4,
  improved: 0.5, improvement: 0.5, benefit: 0.5, beneficial: 0.55,
  well: 0.4, nice: 0.45, cool: 0.4, smart: 0.5, clever: 0.5,
  insightful: 0.65, thought: 0.2, thoughtful: 0.55, fair: 0.45,
  responsive: 0.5, attentive: 0.5, patient: 0.45, friendly: 0.5,
  professional: 0.55, quality: 0.5, recommendable: 0.6, enriching: 0.65,
  fascinating: 0.65, delightful: 0.7, exceptional: 0.85, remarkable: 0.7,
  praise: 0.6, 'praise worthy': 0.7, masterful: 0.8, dedicated: 0.6,
  passionate: 0.6, encouraging: 0.6, accessible: 0.5, approachable: 0.5,
};

const NEGATIVE_LEXICON: Record<string, number> = {
  terrible: -0.85, awful: -0.85, horrible: -0.9, bad: -0.6, poor: -0.6,
  worst: -0.85, worse: -0.6, hate: -0.8, hated: -0.8, dislike: -0.6,
  boring: -0.6, bored: -0.5, confusing: -0.6, confused: -0.55,
  difficult: -0.45, hard: -0.35, unclear: -0.5, unhelpful: -0.65,
  useless: -0.75, worthless: -0.75, waste: -0.6, wasted: -0.6,
  disappointed: -0.7, disappointing: -0.7, frustration: -0.6,
  frustrated: -0.65, frustrating: -0.65, annoying: -0.6, annoyed: -0.55,
  unfair: -0.6, lazy: -0.55, unorganized: -0.55, disorganized: -0.55,
  ineffective: -0.6, inefficient: -0.5, negative: -0.5, fail: -0.6,
  failed: -0.65, failure: -0.65, struggling: -0.5,
  struggle: -0.45, lost: -0.4, lose: -0.4, losing: -0.45, behind: -0.35,
  overwhelming: -0.55, stressed: -0.5, stress: -0.45, anxious: -0.5,
  anxiety: -0.5, unhappy: -0.6, sad: -0.5, angry: -0.6, mad: -0.5,
  rude: -0.6, disrespectful: -0.65, ignore: -0.5,
  ignored: -0.55, neglect: -0.55, neglectful: -0.6, indifferent: -0.4,
  mediocre: -0.5, subpar: -0.55, lacking: -0.5, lack: -0.4,
  incomplete: -0.45, missing: -0.4, broken: -0.5, wrong: -0.45,
  mistake: -0.4, mistakes: -0.4, error: -0.35, errors: -0.35,
  slow: -0.4, late: -0.35, delay: -0.4, delayed: -0.45, unprepared: -0.55,
  unprofessional: -0.6, careless: -0.5, sloppy: -0.5, vague: -0.45,
  harsh: -0.5, strict: -0.3, unreasonable: -0.6, demanding: -0.4,
  heavy: -0.3, too: -0.15, much: -0.2, never: -0.2, nothing: -0.3,
  pointless: -0.6, meaningless: -0.55, irrelevant: -0.5, outdated: -0.5,
  obsolete: -0.5, confusingly: -0.55, unclearly: -0.5, poorly: -0.55,
  badly: -0.5, weak: -0.4, weakly: -0.4, flawed: -0.55, flaw: -0.45,
  problem: -0.4, problems: -0.4, issue: -0.35, issues: -0.35, complaint: -0.5,
};

// Negation words that flip the sentiment of the following word
const NEGATORS = new Set([
  'not', 'no', 'never', "don't", "doesn't", "didn't", "isn't", "wasn't",
  "aren't", "weren't", "won't", "can't", "cannot", "couldn't", "shouldn't",
  "wouldn't", "hadn't", "hasn't", "haven't", "without", "hardly", "barely",
  "rarely", "scarcely", "neither", "nor", "none",
]);

// Intensifiers that amplify the following word's sentiment
const INTENSIFIERS: Record<string, number> = {
  very: 1.5, really: 1.4, extremely: 1.8, incredibly: 1.7, absolutely: 1.6,
  completely: 1.5, totally: 1.5, so: 1.3, too: 1.2, quite: 1.2, highly: 1.5,
  deeply: 1.5, truly: 1.4, remarkably: 1.6, exceptionally: 1.7, particularly: 1.3,
  especially: 1.3, genuinely: 1.4, utterly: 1.6, thoroughly: 1.5, decidedly: 1.4,
};

// Diminishers that reduce the following word's sentiment
const DIMINISHERS: Record<string, number> = {
  slightly: 0.5, somewhat: 0.6, kind: 0.7, kinda: 0.7, sort: 0.7,
  barely: 0.3, hardly: 0.3, little: 0.4, less: 0.6, relatively: 0.7,
  moderately: 0.7, fairly: 0.8, rather: 0.8, pretty: 0.85,
};

// Multi-word phrases with pre-assigned scores
const PHRASES: Record<string, number> = {
  'not good': -0.6, 'not great': -0.65, 'not bad': 0.3, 'not helpful': -0.65,
  'not clear': -0.5, 'not worth': -0.6, 'no good': -0.6, 'no help': -0.55,
  'very good': 0.8, 'very helpful': 0.8, 'very clear': 0.75, 'very bad': -0.85,
  'really good': 0.8, 'really helpful': 0.8, 'too fast': -0.4, 'too slow': -0.5,
  'too hard': -0.5, 'too much': -0.4, 'too difficult': -0.55, 'too easy': -0.2,
  'highly recommend': 0.8, 'well organized': 0.65, 'well structured': 0.6,
  'hard to understand': -0.6, 'hard to follow': -0.55, 'difficult to understand': -0.6,
  'easy to understand': 0.6, 'easy to follow': 0.55, 'easy to use': 0.5,
  'waste of time': -0.75, 'waste of money': -0.75, 'waste of': -0.6,
  'worth every': 0.8, 'worth it': 0.6, 'worth the': 0.55,
  'looking forward': 0.5, 'can not wait': 0.6, 'cannot wait': 0.6,
  'did not help': -0.6, 'did not like': -0.55, 'did not enjoy': -0.55,
  'does not help': -0.6, 'does not like': -0.5, 'do not like': -0.5,
  'is not clear': -0.5, 'was not helpful': -0.65, 'was not clear': -0.55,
  'a lot of': 0.1, 'lots of': 0.1, 'plenty of': 0.1,
  'good job': 0.65, 'great job': 0.75, 'nice job': 0.55, 'good work': 0.6,
  'great work': 0.7, 'well done': 0.7, 'well prepared': 0.6,
  'not well': -0.5, 'not enough': -0.4, 'not enough time': -0.5,
};


function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function matchPhrases(text: string, tokens: string[]): { score: number; matched: Set<number> } {
  const lowerText = text.toLowerCase();
  let score = 0;
  const matched = new Set<number>();

  for (const phrase of Object.keys(PHRASES)) {
    let searchStart = 0;
    while (true) {
      const idx = lowerText.indexOf(phrase, searchStart);
      if (idx === -1) break;

      // Check word boundary before
      const beforeChar = idx > 0 ? lowerText[idx - 1] : ' ';
      const afterIdx = idx + phrase.length;
      const afterChar = afterIdx < lowerText.length ? lowerText[afterIdx] : ' ';
      if (beforeChar === ' ' && (afterChar === ' ' || afterChar === undefined || !/\w/.test(afterChar))) {
        score += PHRASES[phrase];
        // Mark the token indices as matched
        const phraseTokens = phrase.split(' ');
        const phraseStart = lowerText.lastIndexOf(' ', idx) + 1;
        const textUpToPhrase = lowerText.substring(0, phraseStart);
        const tokenStartIdx = textUpToPhrase.trim() ? textUpToPhrase.trim().split(/\s+/).length : 0;
        for (let i = 0; i < phraseTokens.length && tokenStartIdx + i < tokens.length; i++) {
          matched.add(tokenStartIdx + i);
        }
      }
      searchStart = idx + phrase.length;
    }
  }

  return { score, matched };
}

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  const wordCount = tokens.length;

  if (wordCount === 0) {
    return {
      score: 0, label: 'neutral', magnitude: 0, confidence: 0,
      keywords: [], wordCount: 0, positiveCount: 0, negativeCount: 0, comparative: 0,
    };
  }

  const keywords: KeywordContribution[] = [];
  let totalScore = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let sentimentWordCount = 0;

  // First, match multi-word phrases
  const { score: phraseScore, matched: phraseMatched } = matchPhrases(text, tokens);
  if (phraseScore !== 0) {
    totalScore += phraseScore;
    sentimentWordCount += Math.max(1, phraseMatched.size);
    // Add phrase as a keyword contribution
    const phraseType = phraseScore > 0 ? 'positive' : 'negative';
    keywords.push({ word: '(phrase)', score: phraseScore, type: phraseType });
  }

  // Then process individual tokens, skipping phrase-matched ones
  for (let i = 0; i < tokens.length; i++) {
    if (phraseMatched.has(i)) continue;

    const token = tokens[i];
    let wordScore = 0;

    if (POSITIVE_LEXICON[token] !== undefined) {
      wordScore = POSITIVE_LEXICON[token];
    } else if (NEGATIVE_LEXICON[token] !== undefined) {
      wordScore = NEGATIVE_LEXICON[token];
    }

    if (wordScore === 0) continue;

    // Check for negation in the previous 1-3 tokens
    let isNegated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j])) {
        isNegated = true;
        break;
      }
    }

    // Check for intensifier/diminisher in the previous 1-2 tokens
    let modifier = 1;
    let modifierType: 'intensified' | null = null;
    for (let j = Math.max(0, i - 2); j < i; j++) {
      if (INTENSIFIERS[tokens[j]]) {
        modifier = INTENSIFIERS[tokens[j]];
        modifierType = 'intensified';
        break;
      }
      if (DIMINISHERS[tokens[j]]) {
        modifier = DIMINISHERS[tokens[j]];
        modifierType = 'intensified';
        break;
      }
    }

    if (isNegated) {
      wordScore = -wordScore * 0.75;
      keywords.push({ word: token, score: wordScore, type: 'negated' });
    } else if (modifierType) {
      wordScore = wordScore * modifier;
      keywords.push({ word: token, score: wordScore, type: modifierType });
    } else if (wordScore > 0) {
      keywords.push({ word: token, score: wordScore, type: 'positive' });
    } else {
      keywords.push({ word: token, score: wordScore, type: 'negative' });
    }

    wordScore = Math.max(-1, Math.min(1, wordScore));
    totalScore += wordScore;
    sentimentWordCount++;

    if (wordScore > 0) positiveCount++;
    else if (wordScore < 0) negativeCount++;
  }

  // Normalize score to -1..1 range
  const normalizedScore = sentimentWordCount > 0
    ? Math.max(-1, Math.min(1, totalScore / Math.sqrt(sentimentWordCount)))
    : 0;

  const magnitude = Math.abs(normalizedScore);
  const comparative = wordCount > 0 ? totalScore / wordCount : 0;

  // Confidence based on proportion of sentiment-bearing words and agreement
  const sentimentDensity = sentimentWordCount / wordCount;
  const agreement = sentimentWordCount > 0
    ? 1 - (Math.min(positiveCount, negativeCount) / Math.max(positiveCount, negativeCount, 1))
    : 0;
  const confidence = Math.min(1, sentimentDensity * 1.5 * (0.5 + agreement * 0.5));

  let label: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.15) label = 'positive';
  else if (normalizedScore < -0.15) label = 'negative';
  else label = 'neutral';

  return {
    score: normalizedScore,
    label,
    magnitude,
    confidence,
    keywords,
    wordCount,
    positiveCount,
    negativeCount,
    comparative,
  };
}

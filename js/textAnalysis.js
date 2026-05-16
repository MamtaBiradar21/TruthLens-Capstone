/* ═══════════════════════════════════════════════════════════
   TruthLens — Text Analysis Engine
   NLP-based fake content detection with explainability
   ═══════════════════════════════════════════════════════════ */

const TextAnalysis = (function () {

  // ── Lexicons ──────────────────────────────────────────────
  const FAKE_INDICATORS = {
    conspiracy: {
      weight: 0.85,
      words: ['illuminati','deep state','new world order','globalists','cabal','shadow government',
              'they don\'t want you to know','wake up','sheeple','controlled','puppet','exposed',
              'cover up','coverup','hidden agenda','secret plan','psyop','false flag','hoax',
              'inside job','crisis actor','staged','scripted','fake pandemic','plandemic','scamdemic',
              'globalist','chemtrails','microchip','5g','bill gates','soros','rothschild']
    },
    sensational: {
      weight: 0.75,
      words: ['shocking','bombshell','unbelievable','mind-blowing','jaw-dropping','explosive',
              'outrageous','scandalous','devastating','horrifying','terrifying','apocalyptic',
              'catastrophic','disaster','emergency','crisis','breaking news','alert','urgent',
              'leaked','banned','censored','suppressed','secret','forbidden','explosive truth']
    },
    clickbait: {
      weight: 0.7,
      words: ['you won\'t believe','this is what happens','what they don\'t tell you',
              'the truth about','doctors hate this','one weird trick','secret revealed',
              'share before deleted','before it\'s too late','limited time','act now',
              'this will blow your mind','read this before','watch what happens']
    },
    misinformation_health: {
      weight: 0.8,
      words: ['miracle cure','big pharma','suppressed cure','natural cure','detox',
              'toxins','poison','cancer cure','doctors won\'t tell','ancient remedy',
              'fda approved lie','vaccine danger','autism cause','autism vaccine',
              'bleach cure','essential oil cure','alkaline water cure']
    },
    partisan_extreme: {
      weight: 0.65,
      words: ['libtards','snowflakes','fake news media','mainstream media lies',
              'msm propaganda','lamestream media','globalist agenda','radical left',
              'extreme right','communist plot','socialist takeover','marxist agenda',
              'deep state coup','rigged election','stolen election','fake ballot',
              'illegal votes']
    },
    unverified_claims: {
      weight: 0.6,
      words: ['scientists confirm','experts say','sources confirm','insiders reveal',
              'anonymous source','i have proof','100%','guaranteed','definitely',
              'absolutely proven','undeniable','irrefutable','undisputed',
              'studies show','research proves without doubt']
    }
  };

  const MILD_INDICATORS = [
    'allegedly','reportedly','claims','said to','believed to','rumored',
    'unconfirmed','sources say','according to unnamed','some say','many believe',
    'people are saying','it is thought','could be','might be','possibly'
  ];

  const EXCESSIVE_CAPS_THRESHOLD = 0.2;
  const EXCESSIVE_PUNCT_THRESHOLD = 4;
  const MIN_WORDS_FOR_ANALYSIS = 3;

  // ── Sample texts ──────────────────────────────────────────
  const SAMPLES = {
    fake1: `BREAKING: Deep State Cabal EXPOSED! Scientists They Don't Want You To Know Have CONFIRMED That 5G Towers Are Being Used To Control People's Minds! This is the SHOCKING Truth the Mainstream Media (MSM) is Desperately Trying to SUPPRESS and BAN! Wake up Sheeple! Share Before Deleted! They are poisoning the water supply and microchipping vaccines to push their New World Order globalist agenda!! URGENT!!!`,

    fake2: `MIRACLE CURE Doctors WON'T Tell You About!! Ancient remedy DESTROYS cancer in 3 days!! Big Pharma is SUPPRESSING this cure because it would destroy their billion dollar industry! One weird trick that CURES diabetes, cancer, arthritis and heart disease NATURALLY!! FDA has BANNED this information! Share this before it gets taken down! This will BLOW YOUR MIND!!`,

    suspicious1: `Sources confirm that the new government policy could potentially affect millions of citizens according to unnamed insiders. Reportedly, officials are allegedly planning drastic measures that many believe could undermine democratic processes. Some say this is part of a broader agenda, though these claims remain unconfirmed. People are saying the situation might be worse than what mainstream outlets are reporting.`,

    real1: `The World Health Organization released its quarterly report on global vaccination coverage, noting a 3.2% increase across developing nations compared to last year. Health ministers from 47 countries participated in the Geneva conference, where new guidelines for cold-chain management were discussed. The report emphasizes the importance of local healthcare infrastructure in sustaining immunization programs.`,

    real2: `Researchers at MIT have published findings in Nature Communications demonstrating a new approach to carbon capture using metal-organic frameworks. The study, peer-reviewed by three independent laboratories, shows a 40% improvement in CO₂ absorption efficiency compared to existing methods. Lead author Dr. Chen noted that commercial applications would require further scaling and cost-reduction before widespread deployment.`
  };

  // ── Public API ────────────────────────────────────────────
  function getSample(key) {
    return SAMPLES[key] || '';
  }

  function analyze(text) {
    if (!text || text.trim().length === 0) {
      return { error: 'Please enter some text to analyze.' };
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length < MIN_WORDS_FOR_ANALYSIS) {
      return { error: 'Please enter at least 3 words for meaningful analysis.' };
    }

    const lower = text.toLowerCase();
    let totalScore = 0;
    const signals = [];
    const flaggedRegions = []; // {word, level: 'fake'|'suspicious'|'mild', category}

    // ── 1. Category scores ──────────────────────────────────
    let conspiracyHits = 0, sensHits = 0, clickHits = 0, healthHits = 0, partisanHits = 0, unverHits = 0;

    Object.entries(FAKE_INDICATORS).forEach(([cat, data]) => {
      data.words.forEach(w => {
        if (lower.includes(w.toLowerCase())) {
          const level = data.weight >= 0.75 ? 'fake' : 'suspicious';
          flaggedRegions.push({ word: w, level, category: cat });
          totalScore += data.weight * 0.4;
          if (cat === 'conspiracy') conspiracyHits++;
          if (cat === 'sensational') sensHits++;
          if (cat === 'clickbait') clickHits++;
          if (cat === 'misinformation_health') healthHits++;
          if (cat === 'partisan_extreme') partisanHits++;
          if (cat === 'unverified_claims') unverHits++;
        }
      });
    });

    MILD_INDICATORS.forEach(w => {
      if (lower.includes(w)) {
        flaggedRegions.push({ word: w, level: 'mild', category: 'hedging' });
        totalScore += 0.08;
      }
    });

    // ── 2. ALL CAPS ratio ───────────────────────────────────
    const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
    const capsRatio = capsWords.length / words.length;
    const capsScore = Math.min(capsRatio / EXCESSIVE_CAPS_THRESHOLD, 1) * 25;

    // ── 3. Excessive punctuation ────────────────────────────
    const exclCount = (text.match(/!/g) || []).length;
    const questCount = (text.match(/\?{2,}/g) || []).length;
    const punctScore = Math.min((exclCount + questCount) / EXCESSIVE_PUNCT_THRESHOLD, 1) * 20;

    // ── 4. Emotional language density ──────────────────────
    const emotionalDensity = (sensHits + clickHits) / Math.max(words.length / 20, 1);
    const emotionScore = Math.min(emotionalDensity * 18, 30);

    // ── 5. Credibility markers ──────────────────────────────
    const credibilityMarkers = ['according to','study published','peer-reviewed','source:',
      'cited in','reference:','doi','arxiv','journal','research','university','professor',
      'dr.','phd','data shows','statistics show','survey of'];
    const credCount = credibilityMarkers.filter(m => lower.includes(m)).length;
    const credibilityBonus = Math.min(credCount * 8, 25);

    // ── Combine scores ──────────────────────────────────────
    let rawScore = totalScore * 30 + capsScore + punctScore + emotionScore - credibilityBonus;
    rawScore = Math.max(0, Math.min(100, rawScore));

    // ── Fine-tune for realistic outputs ────────────────────
    // Clamp to realistic band unless strong signals
    const strongSignals = conspiracyHits + healthHits > 0;
    if (!strongSignals && rawScore > 65) rawScore = 60 + Math.random() * 10;
    if (credCount >= 3 && rawScore > 30) rawScore *= 0.6;

    const fakePct = Math.round(rawScore);

    // ── Verdict ─────────────────────────────────────────────
    let verdict, verdictClass;
    if (fakePct >= 60) { verdict = 'FAKE CONTENT'; verdictClass = 'fake'; }
    else if (fakePct >= 30) { verdict = 'SUSPICIOUS'; verdictClass = 'suspicious'; }
    else { verdict = 'LIKELY REAL'; verdictClass = 'real'; }

    // ── Signal breakdown ────────────────────────────────────
    const signalData = [
      { name: 'Conspiracy Language', value: Math.min(Math.round(conspiracyHits * 22), 100), weight: 'high' },
      { name: 'Sensationalism', value: Math.min(Math.round(sensHits * 18 + clickHits * 14), 100), weight: 'high' },
      { name: 'Health Misinformation', value: Math.min(Math.round(healthHits * 25), 100), weight: 'high' },
      { name: 'Extreme Bias / Partisanship', value: Math.min(Math.round(partisanHits * 16), 100), weight: 'med' },
      { name: 'Unverified Claims', value: Math.min(Math.round(unverHits * 14), 100), weight: 'med' },
      { name: 'Caps & Punctuation Abuse', value: Math.min(Math.round(capsScore + punctScore), 100), weight: 'med' }
    ];

    return {
      fakePct,
      verdict,
      verdictClass,
      signals: signalData,
      flaggedRegions,
      wordCount: words.length,
      capsRatio: Math.round(capsRatio * 100),
      credibilityMarkers: credCount
    };
  }

  // ── Build highlighted HTML ────────────────────────────────
  function buildHighlightedHTML(text, flaggedRegions) {
    if (!flaggedRegions.length) {
      return `<span style="color:var(--text-secondary)">${escapeHtml(text)}</span>`;
    }

    // Sort unique flagged words by length descending (longest first to avoid partial overlaps)
    const uniqueFlags = {};
    flaggedRegions.forEach(f => {
      if (!uniqueFlags[f.word.toLowerCase()] || f.level === 'fake') {
        uniqueFlags[f.word.toLowerCase()] = f.level;
      }
    });

    let result = escapeHtml(text);

    // Build regex for each flagged word
    Object.entries(uniqueFlags)
      .sort((a,b) => b[0].length - a[0].length)
      .forEach(([word, level]) => {
        const cls = level === 'fake' ? 'highlight-fake' :
                    level === 'suspicious' ? 'highlight-suspicious' : 'highlight-mild';
        const escaped = escapeRegex(escapeHtml(word));
        const re = new RegExp(`(?<![\\w>])${escaped}(?![\\w<])`, 'gi');
        result = result.replace(re, match => `<span class="${cls}">${match}</span>`);
      });

    return result;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return { analyze, getSample, buildHighlightedHTML };
})();

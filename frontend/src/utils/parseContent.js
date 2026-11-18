/**
 * Normalizes AI-generated text into a structured object for high-fidelity rendering.
 */
export const parseContent = (generatedText, contentType) => {
  if (!generatedText || typeof generatedText !== 'string') {
    return {
      format: 'prose',
      title: null,
      headline: null,
      subject: null,
      body: '',
      bullets: [],
      hashtags: [],
      cta: null,
      article: null,
      metaTitle: null,
      metaDescription: null,
      urlSlug: null,
      faq: [],
    };
  }

  const text = generatedText.trim();
  const res = {
    format: 'prose',
    title: null,
    headline: null,
    subject: null,
    body: '',
    bullets: [],
    hashtags: [],
    cta: null,
    article: null,
    metaTitle: null,
    metaDescription: null,
    urlSlug: null,
    faq: [],
  };

  if (!text) return res;

  // Format 1 — JSON string (SEO Blog Post)
  try {
    const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
      const parsed = JSON.parse(cleanJson);
      res.format = 'json';
      res.article = parsed.article || parsed.content || null;
      res.metaTitle = parsed.metaTitle || null;
      res.metaDescription = parsed.metaDescription || null;
      res.urlSlug = parsed.urlSlug || null;
      res.faq = parsed.faq || [];
      res.body = res.article || ''; // Fallback
      
      return res;
    }
  } catch (e) {
    // Not JSON, continue to other formats
  }

  const lines = text.split('\n');
  const knownLabels = ['headline:', 'primary text:', 'cta:', 'subject:', 'description:', 'url:'];
  const foundLabels = lines.some(line => {
    if (typeof line !== 'string') return false;
    return knownLabels.some(label => line.toLowerCase().startsWith(label));
  });

  // Format 2 — Labelled text (Ads, Email)
  if (foundLabels) {
    res.format = 'labelled';
    const bodyLines = [];
    
    lines.forEach(line => {
      if (typeof line !== 'string') return;
      const lower = line.toLowerCase().trim();
      let matched = false;
      
      const extractValue = (l) => {
        const parts = l.split(':');
        return parts.length > 1 ? parts.slice(1).join(':').trim() : '';
      };
      
      if (lower.startsWith('headline:')) {
        res.headline = extractValue(line);
        matched = true;
      } else if (lower.startsWith('primary text:')) {
        bodyLines.push(extractValue(line));
        matched = true;
      } else if (lower.startsWith('cta:')) {
        res.cta = extractValue(line);
        matched = true;
      } else if (lower.startsWith('subject:')) {
        res.subject = extractValue(line);
        matched = true;
      } else if (lower.startsWith('description:')) {
        bodyLines.push(extractValue(line));
        matched = true;
      } else if (lower.startsWith('url:')) {
        res.urlSlug = extractValue(line);
        matched = true;
      }
      
      if (!matched && line.trim()) {
        bodyLines.push(line.trim());
      }
    });
    
    res.body = bodyLines.join('\n');
    return res;
  }

  // Format 3 — Free-form prose (everything else)
  res.format = 'prose';
  const bodyLines = [];
  
  // Detect hashtags
  const hashtagMatch = text.match(/#[\w\d]+/g);
  if (hashtagMatch) res.hashtags = [...new Set(hashtagMatch)];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect Title (1st line, <12 words, no period)
    if (idx === 0) {
      const words = trimmed.split(/\s+/);
      if (words.length < 12 && !trimmed.endsWith('.')) {
        res.title = trimmed;
        return;
      }
    }

    // Detect Bullets
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      res.bullets.push(trimmed.replace(/^[-•]\s*/, ''));
      return;
    }

    bodyLines.push(trimmed);
  });

  res.body = bodyLines.join('\n');
  
  if (!res.body && res.title) {
    res.body = res.title;
    res.title = null;
  } else if (!res.body) {
    res.body = text;
  }
  
  return res;
};

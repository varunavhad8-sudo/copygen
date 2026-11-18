import React from 'react';

const FormattedOutput = ({ content, contentType, isApproved }) => {
  const parsed = React.useMemo(() => {
    if (!content) return null;
    if (typeof content === 'object') return content;
    try {
      // Clean potential markdown code blocks
      const cleanJson = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      return null;
    }
  }, [content]);

  // If it's not a structured object, render as raw text
  if (!parsed || (typeof parsed === 'string')) {
    return (
      <div className="w-full transition-all duration-300">
        <p className="text-[18px] text-[#d1d1e0]/95 leading-[1.8] whitespace-pre-wrap font-sans">
          {content || '(No content)'}
        </p>
      </div>
    );
  }

  const isSeoBlog = (contentType?.toLowerCase() || '').includes('seo') || parsed.article;

  if (isSeoBlog) {
    return (
      <div className="space-y-10">
        {/* Meta Data */}
        <div className="bg-[#12121a] border border-[#2a2f42] rounded-3xl p-10 space-y-8">
          <h4 className="text-[12px] font-black text-[#c9a84c] uppercase tracking-[0.4em] mb-8 border-b border-white/5 pb-6">SEO Meta Data</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {parsed.urlSlug && (
              <div className="space-y-3">
                <span className="text-[10px] text-[#d1d1e0]/40 uppercase font-black tracking-widest">URL Slug</span>
                <div className="bg-[#0a0a0f] p-5 rounded-2xl border border-[#1e1e2e] text-sm text-purple-400 font-mono">{parsed.urlSlug}</div>
              </div>
            )}
            {parsed.metaTitle && (
              <div className="space-y-3">
                <span className="text-[10px] text-[#d1d1e0]/40 uppercase font-black tracking-widest">Meta Title</span>
                <div className="bg-[#0a0a0f] p-5 rounded-2xl border border-[#1e1e2e] text-sm text-white font-bold">{parsed.metaTitle}</div>
              </div>
            )}
          </div>
          {parsed.metaDescription && (
            <div className="space-y-3">
              <span className="text-[10px] text-[#d1d1e0]/40 uppercase font-black tracking-widest">Meta Description</span>
              <div className="bg-[#0a0a0f] p-5 rounded-2xl border border-[#1e1e2e] text-sm text-[#d1d1e0]/80 leading-relaxed">{parsed.metaDescription}</div>
            </div>
          )}
        </div>

        {/* Article */}
        <div className="w-full transition-all duration-300">
          <h4 className="text-[12px] font-black text-[#c9a84c] uppercase tracking-[0.4em] mb-10 border-b border-white/5 pb-6">Main Content</h4>
          <div className="prose prose-invert max-w-none">
            {(() => {
              const text = parsed.article || parsed.content || content || '';
              const isHtml = /<[a-z][\s\S]*>/i.test(text);
              
              if (isHtml) {
                return (
                  <div 
                    className="formatted-content text-[18px] text-[#d1d1e0]/95 leading-[1.8] font-sans"
                    dangerouslySetInnerHTML={{ __html: text }} 
                  />
                );
              }
              
              return (
                <div className="text-[18px] text-[#d1d1e0]/95 leading-[1.8] whitespace-pre-wrap font-sans">
                  {text}
                </div>
              );
            })()}
          </div>
          
          <style jsx>{`
            .formatted-content h1 { color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; line-height: 1.2; }
            .formatted-content h2 { color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.5rem; }
            .formatted-content h3 { color: #c9a84c; font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
            .formatted-content p { margin-bottom: 1.5rem; }
            .formatted-content ul, .formatted-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
            .formatted-content li { margin-bottom: 0.5rem; }
            .formatted-content strong { color: #ffffff; font-weight: 700; }
            .formatted-content a { color: #c9a84c; text-decoration: underline; }
          `}</style>
        </div>

        {/* FAQ */}
        {parsed.faq && parsed.faq.length > 0 && (
          <div className="space-y-8 pt-10">
            <h4 className="text-[12px] font-black text-[#c9a84c] uppercase tracking-[0.4em] pl-2 border-b border-white/5 pb-6">Frequently Asked Questions</h4>
            <div className="grid gap-6">
              {parsed.faq.map((q, i) => (
                <div key={i} className="bg-[#12121a] border border-[#2a2f42] rounded-3xl p-8 hover:border-[#c9a84c]/20 transition-all duration-300">
                  <p className="text-lg font-black text-white mb-4 flex gap-4">
                    <span className="text-[#c9a84c]">Q:</span> {q.question}
                  </p>
                  <p className="text-base text-[#d1d1e0]/70 leading-relaxed flex gap-4">
                    <span className="text-[#d1d1e0]/30 font-black">A:</span> {q.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic object display
  return (
    <div className="w-full transition-all duration-300">
      <pre className="text-[14px] text-[#d1d1e0]/80 leading-relaxed font-mono whitespace-pre-wrap bg-[#12121a] p-8 rounded-3xl border border-[#2a2f42]">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
};

export default FormattedOutput;

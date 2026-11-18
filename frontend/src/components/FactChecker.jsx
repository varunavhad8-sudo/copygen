import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Loader2, AlertTriangle, CheckCircle, 
  XCircle, Info, RefreshCcw, ExternalLink, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { factCheckAPI } from '../utils/api';

/**
 * FactChecker Component
 * 
 * Scans content for factual claims, verifies them via Brave Search,
 * and provides a confidence-scored report with inline corrections.
 * 
 * Props:
 * @param {string} content - The text to verify.
 * @param {string} outputId - Optional ID of the existing Output document to update.
 */
const FactChecker = ({ content, onContentUpdate, outputId, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialData || null);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await factCheckAPI.check({
        content: content,
        outputId
      });

      setResult(data);
    } catch (err) {
      console.error('[FactChecker] Error:', err);
      setError(err.message || 'Failed to verify facts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = (originalParagraph, replacement) => {
    if (!replacement || !result) return;
    
    // 1. Update Content
    const newContent = content.replace(originalParagraph, replacement);
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }
    
    // 2. Update Claims Status
    // Identify claims that were part of this paragraph
    const updatedClaims = result.claims.map(c => {
      if ((originalParagraph || '').includes(c.paragraph || '') || originalParagraph === c.paragraph) {
        return { ...c, status: 'verified', paragraph: replacement };
      }
      return c;
    });

    // 3. Recalculate Summary
    const newSummary = updatedClaims.reduce((acc, curr) => {
      acc.total++;
      if (curr.status === 'verified') acc.verified++;
      else if (curr.status === 'uncertain') acc.uncertain++;
      else if (curr.status === 'unverified') acc.unverified++;
      return acc;
    }, { total: 0, verified: 0, uncertain: 0, unverified: 0 });

    // 4. Update State
    setResult({
      ...result,
      claims: updatedClaims,
      summary: newSummary
    });
  };

  // Split content into paragraphs for highlighting
  // We match paragraphs against the 'paragraph' field in claims
  const paragraphs = useMemo(() => {
    if (!content) return [];
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    if (isHtml) {
      // Split by block level tags but keep the tags
      return content.split(/(?=<h[1-6]|<p|<div|<ul|<ol|<li)/i).filter(p => p.trim() !== '');
    }
    return content.split(/\n\s*\n/).filter(p => p.trim() !== '');
  }, [content]);

  const getParagraphStatus = (pText) => {
    if (!result) return 'none';
    // Clean text for comparison
    const cleanP = pText.replace(/<[^>]*>/g, '').trim();
    const pClaims = result.claims.filter(c => {
      const cleanClaimP = (c.paragraph || '').replace(/<[^>]*>/g, '').trim();
      return cleanP.includes(cleanClaimP) || cleanClaimP.includes(cleanP) || (pText || '').includes(c.paragraph || '');
    });
    if (pClaims.length === 0) return 'none';
    
    if (pClaims.some(c => c.status === 'unverified')) return 'unverified';
    if (pClaims.some(c => c.status === 'uncertain')) return 'uncertain';
    return 'verified';
  };

  const getParagraphClaims = (pText) => {
    if (!result) return [];
    const cleanP = pText.replace(/<[^>]*>/g, '').trim();
    return result.claims.filter(c => {
      const cleanClaimP = (c.paragraph || '').replace(/<[^>]*>/g, '').trim();
      return cleanP.includes(cleanClaimP) || cleanClaimP.includes(cleanP) || (pText || '').includes(c.paragraph || '');
    });
  };

  if (!content) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#c9a84c]/20 p-2 rounded-lg">
              <ShieldCheck className="text-[#c9a84c]" size={20} />
            </div>
            <h4 className="text-2xl font-black text-white tracking-tight uppercase">AI Accuracy Audit</h4>
          </div>
          <p className="text-slate-500 text-sm font-medium italic">Scanning for verifiable assertions, product claims, and factual accuracy.</p>
        </div>

        {!result && !loading && (
          <button
            onClick={handleCheck}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#a68a3d] text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(201,168,76,0.3)] active:scale-95"
          >
            <ShieldCheck size={18} />
            Analyze Content Accuracy
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-4 bg-[#0d0d14] rounded-2xl border border-[#1e1e2e]"
          >
            <Loader2 size={32} className="text-[#c9a84c] animate-spin" />
            <p className="text-sm font-bold text-[#d1d1e0]/60 uppercase tracking-widest animate-pulse">Scanning factual claims...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3"
          >
            <AlertTriangle size={18} />
            {error}
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0d0d14] border border-[#22c55e]/20 p-8 rounded-[32px] flex items-center justify-between group hover:border-[#22c55e]/40 transition-all duration-500">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#22c55e]/60 mb-2">Verified Claims</p>
                  <p className="text-4xl font-black text-[#22c55e]">{result.summary.verified}</p>
                </div>
                <div className="bg-[#22c55e]/10 p-4 rounded-2xl group-hover:bg-[#22c55e]/20 transition-colors">
                  <CheckCircle className="text-[#22c55e]" size={32} />
                </div>
              </div>
              <div className="bg-[#0d0d14] border border-[#eab308]/20 p-8 rounded-[32px] flex items-center justify-between group hover:border-[#eab308]/40 transition-all duration-500">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]/60 mb-2">Uncertain Statements</p>
                  <p className="text-4xl font-black text-[#eab308]">{result.summary.uncertain}</p>
                </div>
                <div className="bg-[#eab308]/10 p-4 rounded-2xl group-hover:bg-[#eab308]/20 transition-colors">
                  <AlertTriangle className="text-[#eab308]" size={32} />
                </div>
              </div>
              <div className="bg-[#0d0d14] border border-[#ef4444]/20 p-8 rounded-[32px] flex items-center justify-between group hover:border-[#ef4444]/40 transition-all duration-500">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ef4444]/60 mb-2">Unverified Issues</p>
                  <p className="text-4xl font-black text-[#ef4444]">{result.summary.unverified}</p>
                </div>
                <div className="bg-[#ef4444]/10 p-4 rounded-2xl group-hover:bg-[#ef4444]/20 transition-colors">
                  <XCircle className="text-[#ef4444]" size={32} />
                </div>
              </div>
            </div>

            {/* Content Display */}
            <div className="space-y-6">
              {paragraphs.map((p, idx) => {
                const status = getParagraphStatus(p);
                const claims = getParagraphClaims(p);
                
                const bgClass = 
                  status === 'verified' ? 'bg-[#dcfce7] text-gray-900 shadow-sm' :
                  status === 'uncertain' ? 'bg-[#fef9c3] text-gray-900 shadow-sm' :
                  status === 'unverified' ? 'bg-[#fee2e2] text-gray-900 shadow-sm' :
                  'text-[#d1d1e0]/80';

                const isHtml = /<[a-z][\s\S]*>/i.test(p);

                return (
                  <div key={idx} className="group relative">
                    <div className={`p-4 rounded-xl transition-all duration-300 ${bgClass} ${status !== 'none' ? 'cursor-help hover:scale-[1.01]' : ''}`}>
                      {isHtml ? (
                        <div 
                          className="text-[16px] leading-relaxed fact-check-html"
                          dangerouslySetInnerHTML={{ __html: p }}
                        />
                      ) : (
                        <p className="text-[16px] leading-relaxed">{p}</p>
                      )}
                      
                      {/* Tooltip on Hover */}
                      {status !== 'none' && (
                        <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#c9a84c] mb-3 border-b border-[#1e1e2e] pb-2">Claims in this section</p>
                          <div className="space-y-3">
                            {claims.map((c, ci) => (
                              <div key={ci} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {c.status === 'verified' && <CheckCircle size={10} className="text-[#22c55e]" />}
                                  {c.status === 'uncertain' && <AlertTriangle size={10} className="text-[#eab308]" />}
                                  {c.status === 'unverified' && <XCircle size={10} className="text-[#ef4444]" />}
                                  <span className={`text-[10px] font-bold uppercase ${c.status === 'verified' ? 'text-[#22c55e]' : c.status === 'uncertain' ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                                    {c.status}
                                  </span>
                                </div>
                                <p className="text-[12px] text-white/90 leading-tight">"{c.claim}"</p>
                                {c.source && (
                                  <div className="flex items-center gap-1 text-[10px] text-[#c9a84c] mt-1">
                                    <Info size={10} />
                                    <span>Source verified via web</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Replacement Card for Unverified Paragraphs */}
                    {status === 'unverified' && claims.some(c => c.replacement) && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-3 ml-4 border-l-2 border-[#ef4444] pl-4 py-3 bg-[#ef4444]/5 rounded-r-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <RefreshCcw size={14} className="text-[#ef4444]" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#ef4444]">Suggested Correction</span>
                          </div>
                          <p className="text-sm text-white/80 line-clamp-2">
                            {claims.find(c => c.replacement)?.replacement}
                          </p>
                          {claims.find(c => c.source)?.source && (
                            <a 
                              href={claims.find(c => c.source).source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#c9a84c] mt-2 hover:underline"
                            >
                              View Source <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleReplace(p, claims.find(c => c.replacement).replacement)}
                          className="shrink-0 px-4 py-2 bg-[#ef4444] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#d93a3a] transition-colors flex items-center gap-2"
                        >
                          Use This Instead
                          <ChevronRight size={14} />
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Re-check action */}
            <div className="flex justify-center pt-8">
              <button
                onClick={handleCheck}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#1e1e2e] text-[#d1d1e0]/40 text-xs font-bold uppercase tracking-widest hover:text-[#ffffff] hover:bg-[#1e1e2e] transition-all"
              >
                <RefreshCcw size={14} />
                Re-scan Updated Content
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FactChecker;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ShieldAlert } from 'lucide-react';
import { outputsAPI } from '../utils/api';

const OutputDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(false);

  const fetchOutput = useCallback(async () => {
    try {
      setLoading(true);
      const data = await outputsAPI.getById(id);
      setOutput(data.output || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOutput();
  }, [fetchOutput]);

  const handleCopy = () => {
    if (!output) return;
    const text = output.generatedText || output.content || output.text || '';
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative w-14 h-14">
          <div className="w-full h-full border-4 border-purple-500/10 border-t-[#c9a84c] rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-[#c9a84c]/10 border-t-purple-500 rounded-full animate-spin [animation-direction:reverse]"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c9a84c] animate-pulse">Initializing Copy Workspace...</p>
      </div>
    );
  }

  if (error || !output) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldAlert size={36} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">Workspace Not Found</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm leading-relaxed">The output document does not exist, or you do not have permission to view it.</p>
        </div>
        <button 
          onClick={() => navigate('/app/outputs')}
          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-purple-600/20 flex items-center gap-2.5 transition-all"
        >
          <ArrowLeft size={16} /> 
          <span>Back to Library</span>
        </button>
      </div>
    );
  }

  const rawText = output.generatedText || output.content || output.text || '';

  return (
    <div className="min-h-screen bg-[#0f1117] px-6 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Workspace Toolbar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4 text-left">
            <button 
              onClick={() => navigate('/app/outputs')}
              className="p-3 bg-[#171a26]/40 border border-white/10 hover:border-[#c9a84c]/30 text-slate-400 hover:text-white rounded-2xl transition-all shadow-md group"
              title="Return to library"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-white uppercase tracking-wider mt-1.5 leading-none">
                {output.contentType || 'Generated Document'}
              </h1>
            </div>
          </div>
        </div>

        {/* Text Container */}
        <div className="bg-[#12141c] border border-white/10 rounded-[24px] p-8 lg:p-12 shadow-xl">
          <div className="whitespace-pre-wrap text-[16px] leading-[1.8] text-slate-200 tracking-wide selection:bg-purple-600/30 selection:text-white">
            {rawText}
          </div>
        </div>

      </div>

      {/* Fixed Mini Floating Copy Action (Bottom Right) */}
      <button 
        onClick={handleCopy}
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center p-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-300 transform active:scale-90 border select-none ${
          copying 
          ? 'bg-green-500 border-green-400 text-black scale-105' 
          : 'bg-[#c9a84c] border-[#ebd082] text-black hover:bg-[#e2c161] hover:scale-105'
        }`}
        title="Quick Copy Entire Output"
      >
        {copying ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
      </button>

    </div>
  );
};

export default OutputDetail;

import { useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, MessageSquare, Globe, Send, CheckCircle } from 'lucide-react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="bg-ivory text-ink font-sans selection:bg-gold selection:text-ivory">
      <Helmet>
        <title>Contact Sales &amp; Support | Copygen — Partner with Us</title>
        <meta name="description" content="Get in touch with the Copygen team. Whether you're looking for an enterprise demo, agency partnership, or support, we're here to help you scale." />
        <meta property="og:title" content="Contact Copygen | Partner with Us" />
        <meta property="og:description" content="Reach out for enterprise demos, agency partnerships, or priority support." />
        <meta property="og:url" content="https://copygen.in/contact" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Copygen" />
        <meta name="twitter:description" content="Partner with Copygen. Enterprise demos, custom integrations, and priority support." />
      </Helmet>
      <LandingNavbar />

      <main className="pt-40 pb-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          
          {/* LEFT: INFO */}
          <div className="animate-on-scroll">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-8"
            >
              Get in Touch
            </motion.div>
            
            <h1 className="font-serif text-5xl md:text-7xl text-ink leading-tight mb-8">
               Let's talk <br /><span className="italic">growth.</span>
            </h1>
            
            <p className="text-lg text-ink-muted leading-relaxed mb-12 max-w-md">
              Have questions about enterprise pricing, API access, or custom integrations? Our team of agency veterans is ready to help you optimize your workflow.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-gold shadow-sm">
                   <Mail size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink">General Enquiries</h4>
                   <p className="text-ink-muted text-sm">hello@copygen.in</p>
                 </div>
              </div>
              <div className="flex gap-6 items-start">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-gold shadow-sm">
                   <MessageSquare size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink">Priority Support</h4>
                   <p className="text-ink-muted text-sm">support@copygen.in</p>
                 </div>
              </div>
              <div className="flex gap-6 items-start">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-gold shadow-sm">
                   <Globe size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-ink">Partner with us</h4>
                   <p className="text-ink-muted text-sm">partners@copygen.in</p>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="animate-on-scroll">
            <div className="premium-card p-10 lg:p-14 rounded-3xl bg-white shadow-2xl relative overflow-hidden">
               {submitted ? (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center justify-center text-center py-20"
                 >
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
                      <CheckCircle size={40} />
                    </div>
                    <h2 className="font-serif text-3xl mb-4">Message Received</h2>
                    <p className="text-ink-muted text-sm max-w-xs">One of our specialists will reach out to you within the next 4 business hours.</p>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="mt-10 text-gold font-bold text-xs uppercase tracking-widest hover:underline"
                    >
                      Send another message
                    </button>
                 </motion.div>
               ) : (
                 <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest px-1">Full Name</label>
                        <input required type="text" placeholder="John Doe" className="w-full bg-ivory/50 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest px-1">Work Email</label>
                        <input required type="email" placeholder="john@agency.com" className="w-full bg-ivory/50 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest px-1">Agency Size</label>
                      <select className="w-full bg-ivory/50 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-all appearance-none cursor-pointer">
                        <option>1-10 employees</option>
                        <option>11-50 employees</option>
                        <option>51-200 employees</option>
                        <option>200+ employees</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest px-1">How can we help?</label>
                      <textarea required rows={4} placeholder="Tell us about your agency's goals..." className="w-full bg-ivory/50 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-all" />
                    </div>
                    
                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full py-5 bg-ink text-ivory rounded-xl font-bold text-sm hover:bg-gold transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : (
                        <>Send Message <Send size={16} /></>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-ink-muted text-center italic">
                      Locked and secured with enterprise-grade encryption.
                    </p>
                 </form>
               )}
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;




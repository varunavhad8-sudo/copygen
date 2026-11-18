import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

// Custom LinkedIn SVG (lucide-react v1.8.0 does not include brand icons)
const LinkedinIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', path: '/services' },
      { name: 'Pricing', path: '/#pricing' },
      { name: 'Templates', path: '/templates' },
      { name: 'How It Works', path: '/#how-it-works' },
    ],
    company: [
      { name: 'About', path: '/about' },
      { name: 'Blog', path: '/blog' },
      { name: 'Careers', path: '/careers' },
      { name: 'Contact', path: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Refund Policy', path: '/refund-policy' },
    ],
  };

  const handleNav = (path) => {
    if (path.startsWith('/#')) {
      const id = path.substring(2);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        // After navigation, scroll to element if possible or handle via hash
        window.location.hash = id;
      }
    } else {
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className="bg-ivory text-ink border-t border-border pt-20 pb-10 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand Column */}
          <div className="space-y-6">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <span className="font-serif text-3xl tracking-tight">
                <span className="text-[#0E0E0C]">Copy</span><span className="text-gold">Gen</span>.in
              </span>
            </div>
            <p className="text-ink/70 text-sm leading-relaxed max-w-xs">
              AI copywriting for agencies that don't settle for generic. Scale your creative output with brand-intelligent precision.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://twitter.com/copygen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink/60 hover:text-gold hover:border-gold transition-all duration-300"
                aria-label="Follow us on Twitter"
              >
                <X size={18} />
              </a>
              <a 
                href="https://linkedin.com/company/copygen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink/60 hover:text-gold hover:border-gold transition-all duration-300"
                aria-label="Follow us on LinkedIn"
              >
                <LinkedinIcon size={18} />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-serif text-xl mb-6 text-ink">Product</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => handleNav(link.path)}
                    className="text-sm text-ink/70 hover:text-gold transition-colors duration-300 text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-serif text-xl mb-6 text-ink">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => handleNav(link.path)}
                    className="text-sm text-ink/70 hover:text-gold transition-colors duration-300 text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-serif text-xl mb-6 text-ink">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={() => handleNav(link.path)}
                    className="text-sm text-ink/70 hover:text-gold transition-colors duration-300 text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-ink/60">
          <div>
            © {currentYear} CopyGen.in. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            Made in India <span className="text-base">🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

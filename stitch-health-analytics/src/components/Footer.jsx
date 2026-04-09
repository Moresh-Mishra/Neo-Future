import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-12 mt-auto bg-[#f8faf3] dark:bg-stone-900">
      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-8xl mx-auto px-8">
        {/* Copyright */}
        <p className="font-['Manrope'] text-xs uppercase tracking-widest text-[#596158]">
          © 2024 Verdant Solace. The Living Sanctuary.
        </p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8 font-['Manrope'] text-xs uppercase tracking-widest">
          <a
            href="#privacy"
            className="text-[#596158] hover:text-[#436745] opacity-80 hover:opacity-100 transition-all"
          >
            Privacy
          </a>
          <a
            href="#terms"
            className="text-[#596158] hover:text-[#436745] opacity-80 hover:opacity-100 transition-all"
          >
            Terms
          </a>
          <a
            href="#support"
            className="text-[#596158] hover:text-[#436745] opacity-80 hover:opacity-100 transition-all"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

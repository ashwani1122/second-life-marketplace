import React from 'react';

// Using standard <a> and <button> tags instead of external Link and Button components

const HeroSection = () => {
  
  // Placeholder image URL for the app visual
  const heroImageUrl = "/hero.png";

  return (
    // 1. FIX: Main Background adjusted for dual-mode. Default is light (bg-white).
    <section className="bg-white dark:bg-[#080D1F] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-indigo-500/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Inner layout: Two-column grid on desktop, stacking gracefully on mobile */}
            <div className="grid md:grid-cols-12 items-center gap-16 md:gap-12">
                
                {/* === LEFT COLUMN: TEXT CONTENT (Spans 7 columns) === */}
                <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left">
                    
                    {/* Tagline/Pre-Header (Adjusted colors for light/dark) */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm md:text-base font-semibold mb-6 border border-indigo-200 dark:border-indigo-700/50 w-fit mx-auto md:mx-0">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        The Next Generation of Local Commerce
                    </div>

                    {/* 2. FIX: Main Headline text color added for light mode (text-slate-900) */}
                    <h1 className="max-w-4xl text-5xl sm:text-6xl  font-extrabold leading-tight tracking-tighter text-slate-900 dark:text-white">
                        <span className='w-fit bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-blue-300 dark:to-indigo-400 bg-clip-text text-transparent'> 
                            Great Finds. Better Value.
                        </span>
                        <br />
                        The Smart Way to ReMarket.
                    </h1>
                    
                    {/* 3. FIX: Sub-text color adjusted for light mode (text-slate-600) */}
                    <p className="mt-6 mx-auto md:mx-0 max-w-xl text-lg sm:text-md font-light tracking-wide text-slate-600 dark:text-slate-300">
                        Nexo connects you with verified local users to buy and sell premium pre-loved items securely. No spam, just exceptional deals and guaranteed protection.
                    </p>
                    
                    {/* CTA Buttons (Secondary button colors adjusted for light mode) */}
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-10">
                        
                        {/* Primary Button (Remains good, as indigo works well on both white/dark) */}
                        <a href="/browse" className="w-full sm:w-auto">
                            <button 
                                className="w-full sm:w-auto h-12 px-8 text-lg font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                Start Exploring
                            </button>
                        </a>
                        
                        {/* 4. FIX: Secondary Button text/border adjusted for light mode */}
                        <a href="/sell" className="w-full sm:w-auto">
                            <button 
                                className="w-full sm:w-auto h-12 px-8 text-lg font-semibold rounded-full bg-transparent border-2 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-white hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors duration-300"
                            >
                                List Item Now
                            </button>
                        </a>
                    </div>
                </div>
                
                {/* === RIGHT COLUMN: IMAGE (Spans 5 columns) === */}
                <div className="md:col-span-5 flex justify-center mt-12 md:mt-0"> 
                    <div className="relative">
                        <img 
                        src={heroImageUrl} 
                            alt="Nexo App Hero Visual" 
                            className="w-[500px] h-auto object-contain rounded-3xl shadow-xl shadow-indigo-500/30 dark:shadow-[0_20px_60px_-10px_rgba(30,58,138,0.7)]" 
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/500x500/1F2937/F9FAFB?text=Nexo+App+Mockup' }}
                        />
                        
                        {/* 5. FIX: Floating cards adjusted for light mode */}
                        <div className="absolute top-10 -left-20 bg-white/70 dark:bg-white/10 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white shadow-lg hidden lg:flex items-center text-sm transform rotate-[-6deg]">
                            🔥 New deal near you!
                        </div>
                        <div className="absolute bottom-10 -right-20 bg-emerald-500 p-3 rounded-xl text-white shadow-lg hidden lg:flex items-center text-sm transform rotate-[8deg]">
                            Verified Seller
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default HeroSection;
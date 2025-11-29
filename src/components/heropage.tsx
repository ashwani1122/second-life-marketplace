import React from 'react';
// Assuming Link and Button components are imported
import { Link } from 'react-router-dom'; 
import { Button } from '@/components/ui/button'; 

const HeroSection = ({ imageUrl = "src/assets/updatedimage.png" }) => {
  return (
    // Outer container: Added full width and standard vertical padding for the section
    <div className="w-full bg-white dark:bg-gray-900">
        <div className="container mx-auto py-16 md:py-24 px-4 sm:px-6 lg:px-8">
            
            {/* Grid layout: Stacks on mobile, two columns on medium screens and up */}
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                
                {/* === LEFT COLUMN: TEXT CONTENT === */}
                {/* Centering text on mobile (items-center) and aligning left on desktop (md:items-start) */}
                <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left">
                    
                    {/* Tagline: Optimized for space, clarity, and responsiveness */}
                    <h1 className="max-w-xl py-2 text-5xl font-extrabold tracking-tighter md:text-6xl lg:text-7xl leading-tight">
                        {/* First Line: Main impact word(s) */}
                        <span className='w-full bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent mb-2 inline-block'> 
                            Great Finds. Better Value.
                        </span>
                        
                        {/* Second Line: Sub-tagline, given clean separation */}
                        <span className="text-slate-900 dark:text-white block mt-1">
                            The Smart Way to ReMarket.
                        </span>
                    </h1>
                    
                    {/* Paragraph: Centered on mobile, aligned left on desktop, constrained width */}
                    <p className="mx-auto md:mx-0 text-lg font-medium tracking-tight md:text-xl max-w-lg mt-4 mb-8 text-slate-600 dark:text-slate-400">
                        Nexo connects you with verified locals to buy and sell pre-loved items securely. No spam, just great deals.
                    </p>
                    
                    {/* === CALL TO ACTION (CTA) BUTTONS === */}
                    {/* Buttons: Stacks on tiny screens, inline on small screens, aligned left on desktop */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start w-full md:w-auto">
                        <Link to="/browse" className="w-full sm:w-auto">
                            <Button 
                                size="lg" 
                                className="w-full sm:w-auto h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                Start Exploring
                            </Button>
                        </Link>
                        <Link to="/sell" className="w-full sm:w-auto">
                            <Button 
                                size="lg" 
                                variant="outline" 
                                className="w-full sm:w-auto h-12 px-8 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                List Item
                            </Button>
                        </Link>
                    </div>
                    
                </div>
                
                {/* === RIGHT COLUMN: IMAGE === */}
                {/* Centered the image on all screen sizes */}
                <div className="flex justify-center order-first md:order-none">
                    <img 
                        src={imageUrl} 
                        alt="Nexo App Hero Visual" 
                        className="w-full max-w-md md:max-w-lg h-auto rounded-xl shadow-2xl shadow-indigo-500/30 transition-shadow duration-300" 
                    />
                </div>
                
            </div>
        </div>
    </div>
  );
};

export default HeroSection;
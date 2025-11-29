// Assuming this is within a React component
import React from 'react';
// Assuming Link and Button components are imported from react-router-dom and your UI library (e.g., Shadcn UI)
import { Link } from 'react-router-dom'; 
import { Button } from '@/components/ui/button'; 
import { motion } from "framer-motion";
const HeroSection = () => {
  return (
    // Outer container: Constrains width, adds vertical padding, and centers the content.
    <div className="container flex justify-between items-center ">
    
      {/* Inner layout: 
        - Default to flex-col (stacks on mobile)
        - On medium screens (md), switch to a two-column grid layout with spacing (gap-12)
        - items-center ensures vertical alignment for the whole section
      */}
      <div className="grid md:grid-cols-2 items-center">
        
        {/* === LEFT COLUMN: TEXT CONTENT === */}
        <div className="flex flex-col justify-center  font-sans md:text-left w-full gap-10 0">
            <h1 className="max-w-2xl  text-5xl   font-bold  md:text-6xl xl:text-7xl">
            <span className='w-fit bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text pr-1.5 text-center text-transparent md:mb-4'> Great Finds. Better Value.</span>
            
                <span className="text-white bg-clip-text text-transparent">
                    The Smart Way to ReMarket.
                </span>
        </h1>
         
          
          <p className="mx-auto text-center text-lg font-medium tracking-tight md:text-xl">
            Nexo connects you with verified locals to buy and sell pre-loved items securely. No spam, just great deals.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4  md:flex-row rounded-xl">
            <Link to="/browse">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-11 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
              >
                Start Exploring
              </Button>
            </Link>
            <Link to="/sell" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-11 px-8 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                List Item
              </Button>
            </Link>
          </div>
          {/* === END CTA BUTTONS === */}
          
        </div>
        
        {/* === RIGHT COLUMN: IMAGE === */}
            
        <div className="flex flex-col justify-center items-center  mb-5">  
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-semibold mb-6 border border-indigo-100 dark:border-indigo-800 w-fit h-fit"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Now live in your city
            </motion.div>
            
            <img 
            width={500}
                src="src/assets/updatedimage.png" 
                alt="Nexo App Hero Visual" 
                className="rounded-3xl" 
            />
        </div>
        
      </div>
    </div>
  );
};

export default HeroSection;
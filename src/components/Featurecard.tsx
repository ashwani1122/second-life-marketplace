import { MessageSquare, ShieldCheck, Search, ShoppingBag, TrendingUp, Zap } from "lucide-react";
// Assuming SecurityIcon is intended to be ShieldCheck

const FeatureCard = ({ icon: Icon, title, description, className = "", isLarge = false }: {
    icon: React.ElementType,
    title: string,
    description: string,
    className?: string,
    isLarge?: boolean
}) => (
    <div 
        className={`p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${className}`}
        style={isLarge ? { minHeight: '400px' } : {}} // Ensure large card is visually dominant
    >
        <div className={`flex ${isLarge ? 'flex-col items-start' : 'items-center'} h-full`}>
            {/* Icon/Visual */}
            <div className={`
                ${isLarge ? 'p-5 mb-4' : 'w-10 h-10 p-2 shrink-0'} 
                bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white
            `}>
                <Icon size={isLarge ? 32 : 20} className="stroke-2" />
            </div>
            
            <div className={`${isLarge ? 'mt-4' : 'flex-grow ml-4'}`}>
                <h3 className={`font-bold ${isLarge ? 'text-3xl' : 'text-lg'} mb-1`}>{title}</h3>
                <p className={`text-opacity-80 ${isLarge ? 'text-xl mt-2' : 'text-sm'}`}>
                    {description}
                </p>
            </div>
        </div>
    </div>
);


export const FeatureGrid = () => {
    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                        A Platform Built for People
                    </h2>
                    <p className="mt-4 text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                        Experience the simplest, safest way to buy and sell premium products instantly.
                    </p>
                </div>

                {/* Grid Layout (2x2 structure on large screens, stacked on mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto">
                    
                    {/* 1. Seamless Trading (Large Box - Spans 2 columns and 2 rows) */}
                    <div className="md:col-span-2 md:row-span-3">
                        <FeatureCard
                            icon={ShoppingBag}
                            title="Seamless Trading Experience"
                            description="From browsing to shipping, enjoy a unified, intuitive flow. Our escrow system holds funds until both parties are satisfied, ensuring trust and security in every transaction."
                            className="bg-indigo-600 text-white shadow-xl hover:shadow-2xl hover:shadow-indigo-500/50"
                            isLarge
                        />
                    </div>

                    {/* 2. Instant Chat (Wide Box Top Right) */}
                    <div className="md:col-span-2">
                        <FeatureCard
                            icon={MessageSquare}
                            title="Real-Time Negotiation"
                            description="Use our instant chat feature to quickly negotiate prices, exchange details, and finalize terms directly with the buyer or seller."
                            className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/50"
                        />
                    </div>
                    
                    {/* 3. Buyer Protection (Bottom Left of the 4 small cards) */}
                   <div className="md:col-span-2">
                        <FeatureCard
                            icon={Zap}
                            title="Fast & Verified Users"
                            description="All users go through a verification process. Connect with trusted members for safer, faster transactions and community-driven ratings."
                            className="bg-violet-50 dark:bg-violet-950/40 text-gray-900 dark:text-white border border-violet-300 dark:border-violet-700 shadow-md hover:border-violet-500"
                        />
                    </div>
                     <div className="md:col-span-2">
                        <FeatureCard
                            icon={Search}
                            title="Smart Search"
                            description="Find exactly what you need with powerful filters, saved searches, and tailored recommendations based on your trading history."
                            className="bg-amber-50 dark:bg-amber-950/40 text-gray-900 dark:text-white border border-amber-300 dark:border-amber-700 shadow-md hover:border-amber-500"
                        />
                    </div>
                    {/* 4. Smart Search (Bottom Center of the 4 small cards) */}
                   

                    {/* 5. Verified User Network (New Feature Card) */}
                    
                </div>
            </div>
        </section>
    );
};
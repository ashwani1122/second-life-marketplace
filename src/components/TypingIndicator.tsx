import { motion } from "framer-motion";

export const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        <div className="text-xs text-slate-500 dark:text-slate-400">
            Seller is typing
        </div>
        <div className="flex items-center space-x-[2px] pt-1">
            <motion.div
                className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
                className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
                className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
        </div>
    </div>
);

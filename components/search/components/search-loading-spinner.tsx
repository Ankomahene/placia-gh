'use client';

import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';

export function SearchLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative mb-6">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
        />

        {/* Inner search icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Search className="w-6 h-6 text-primary" />
        </motion.div>
      </div>

      {/* Animated text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Searching for Places
        </h3>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground"
        >
          Discovering amazing locations in Ghana...
        </motion.p>
      </motion.div>

      {/* Animated map pins */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
            className="text-primary/60"
          >
            <MapPin className="w-4 h-4" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

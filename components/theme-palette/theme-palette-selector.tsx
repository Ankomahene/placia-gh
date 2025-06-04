'use client';

import React, { useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemePalette } from './theme-palette-context';
import { ColorPalette } from './types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function ThemePaletteSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentPalette, setCurrentPalette, availablePalettes } =
    useThemePalette();

  const handlePaletteSelect = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-muted/80 transition-colors"
            aria-label="Theme palette selector"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Choose Color Theme</p>
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Palette selector panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.2 }}
              className="absolute bottom-full right-0 mb-2 z-50 w-80 max-w-[90vw]"
            >
              <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Choose Theme</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1 h-auto hover:bg-muted/80"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {availablePalettes.map((palette) => (
                    <motion.div
                      key={palette.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${
                          currentPalette.id === palette.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                      onClick={() => handlePaletteSelect(palette)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex gap-1">
                          {palette.preview.map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">
                            {palette.name}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {palette.description}
                          </p>
                        </div>

                        {currentPalette.id === palette.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Your theme preference is automatically saved
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

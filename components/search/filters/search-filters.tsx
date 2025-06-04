'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilters as SearchFiltersType } from '../types';
import { mockCategories } from '../mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

const popularFeatures = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Wheelchair Access',
  'Live Music',
  'Outdoor Seating',
  'Delivery',
  'Takeaway',
  'Credit Cards',
  'Reservations',
  'Pet Friendly',
  'Free WiFi',
  'Valet Parking',
  'Business Center',
  'Fitness Center',
  'Pool',
];

export function SearchFilters({
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] =
    useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.rating ||
    (filters.features && filters.features.length > 0);

  // Check scroll position for features
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  // Check scroll position for categories
  const checkCategoriesScrollPosition = () => {
    const container = categoriesScrollRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollCategoriesLeft(scrollLeft > 0);
      setCanScrollCategoriesRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  // Setup scroll listeners
  useEffect(() => {
    const container = scrollContainerRef.current;
    const categoriesContainer = categoriesScrollRef.current;

    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);

      const resizeObserver = new ResizeObserver(() => {
        checkScrollPosition();
      });
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        resizeObserver.disconnect();
      };
    }
  }, [showFilters]);

  useEffect(() => {
    const categoriesContainer = categoriesScrollRef.current;

    if (categoriesContainer) {
      checkCategoriesScrollPosition();
      categoriesContainer.addEventListener(
        'scroll',
        checkCategoriesScrollPosition
      );

      const resizeObserver = new ResizeObserver(() => {
        checkCategoriesScrollPosition();
      });
      resizeObserver.observe(categoriesContainer);

      return () => {
        categoriesContainer.removeEventListener(
          'scroll',
          checkCategoriesScrollPosition
        );
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll functions for features
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  // Scroll functions for categories
  const scrollCategoriesLeft = () => {
    const container = categoriesScrollRef.current;
    if (container) {
      container.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollCategoriesRight = () => {
    const container = categoriesScrollRef.current;
    if (container) {
      container.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const updatedCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];

    onFiltersChange({
      ...filters,
      categories: updatedCategories,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: filters.rating === rating ? undefined : rating,
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = filters.features || [];
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];

    onFiltersChange({
      ...filters,
      features: updatedFeatures,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      subcategories: [],
      features: [],
    });
  };

  return (
    <div className="flex items-start gap-3 flex-wrap">
      {/* Filter Toggle Button */}
      <Button
        variant={hasActiveFilters ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 flex-shrink-0 px-2 sm:px-3"
      >
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
            {filters.categories.length +
              (filters.features?.length || 0) +
              (filters.rating ? 1 : 0)}
          </Badge>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Quick Category Filters with Horizontal Scroll */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Scroll Left Button for Categories */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollCategoriesLeft}
            disabled={!canScrollCategoriesLeft}
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100 disabled:opacity-20"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>

        {/* Horizontally Scrollable Categories Container */}
        <div
          ref={categoriesScrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="flex gap-2 pb-1">
            {mockCategories.map((category) => (
              <Button
                key={category.id}
                variant={
                  filters.categories.includes(category.id)
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handleCategoryToggle(category.id)}
                className="h-8 px-3 flex-shrink-0 whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Scroll Right Button for Categories */}
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollCategoriesRight}
            disabled={!canScrollCategoriesRight}
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100 disabled:opacity-20"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Rating Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={filters.rating ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2 sm:px-3 flex-shrink-0"
          >
            <Star className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">
              {filters.rating ? `${filters.rating}+ Stars` : 'Rating'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="start">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Minimum Rating</h4>
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <label
                key={rating}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.rating === rating}
                  onCheckedChange={() => handleRatingChange(rating)}
                />
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{rating}+</span>
                </div>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 px-3 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}

      {/* Extended Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full mt-3 pt-3 border-t border-border"
          >
            <div className="space-y-4">
              {/* Features with Custom Horizontal Scroll */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Features & Amenities</h4>
                  <div className="flex items-center gap-1">
                    {/* Scroll Left Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={scrollLeft}
                      disabled={!canScrollLeft}
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100 disabled:opacity-20"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    {/* Scroll Right Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={scrollRight}
                      disabled={!canScrollRight}
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100 disabled:opacity-20"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Horizontally Scrollable Container */}
                <div
                  ref={scrollContainerRef}
                  className="relative overflow-x-auto scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <style jsx>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>

                  <div className="flex gap-2 pb-1">
                    {popularFeatures.map((feature) => (
                      <Button
                        key={feature}
                        variant={
                          filters.features?.includes(feature)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleFeatureToggle(feature)}
                        className="h-7 px-2 text-xs flex-shrink-0 whitespace-nowrap"
                      >
                        {feature}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

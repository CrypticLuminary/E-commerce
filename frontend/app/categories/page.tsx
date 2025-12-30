'use client';

/**
 * Categories Page - Browse All Categories
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Shirt, Smartphone, Laptop, Headphones, Watch,
  Home, Sofa, Utensils, Book, Gamepad2, Dumbbell, Bike, Car,
  Baby, Heart, Sparkles, Gift, Music, Camera, Tv, Flower2,
  Dog, Plane, Coffee, Gem, Brush, Wrench, Zap, Package,
  ChevronRight, Grid3X3, List
} from 'lucide-react';
import { PRODUCT_ENDPOINTS } from '@/lib/api-config';
import { Category } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

// Icon mapping for Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'shopping-bag': ShoppingBag,
  'shirt': Shirt,
  'smartphone': Smartphone,
  'laptop': Laptop,
  'headphones': Headphones,
  'watch': Watch,
  'home': Home,
  'sofa': Sofa,
  'utensils': Utensils,
  'book': Book,
  'gamepad-2': Gamepad2,
  'dumbbell': Dumbbell,
  'bike': Bike,
  'car': Car,
  'baby': Baby,
  'heart': Heart,
  'sparkles': Sparkles,
  'gift': Gift,
  'music': Music,
  'camera': Camera,
  'tv': Tv,
  'flower-2': Flower2,
  'dog': Dog,
  'plane': Plane,
  'coffee': Coffee,
  'gem': Gem,
  'brush': Brush,
  'wrench': Wrench,
  'zap': Zap,
  'package': Package,
};

// Get icon component for a category
const getCategoryIcon = (category: Category) => {
  const iconName = category.display_icon || category.custom_icon || category.icon;
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Package; // Default icon
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(PRODUCT_ENDPOINTS.CATEGORIES);
        if (res.ok) {
          const data = await res.json();
          // Filter to only parent categories (no parent)
          const parentCategories = (Array.isArray(data) ? data : data.results || [])
            .filter((cat: Category) => !cat.parent);
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Render category card
  const renderCategoryCard = (category: Category, isSubcategory = false) => {
    const IconComponent = getCategoryIcon(category);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={cn("animate-fade-in-up", isSubcategory && "ml-4")}>
        <Card 
          className={cn(
            "group relative overflow-hidden transition-all duration-300",
            "hover:shadow-lg hover:border-neutral-300",
            isSubcategory ? "border-l-4 border-l-neutral-300" : ""
          )}
        >
          <div className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
              "bg-neutral-100 group-hover:bg-neutral-900 group-hover:scale-110",
              isSubcategory && "w-10 h-10 rounded-xl"
            )}>
              <IconComponent className={cn(
                "text-neutral-600 group-hover:text-white transition-colors",
                isSubcategory ? "h-5 w-5" : "h-6 w-6"
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Link 
                href={`/products?category=${category.slug}`}
                className="block"
              >
                <h3 className={cn(
                  "font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors truncate",
                  isSubcategory ? "text-sm" : "text-base"
                )}>
                  {category.name}
                </h3>
                {category.description && !isSubcategory && (
                  <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">
                    {category.description}
                  </p>
                )}
              </Link>
              <div className="flex items-center gap-3 mt-1">
                {category.product_count !== undefined && (
                  <span className="text-xs text-neutral-400">
                    {category.product_count} products
                  </span>
                )}
                {hasSubcategories && (
                  <span className="text-xs text-neutral-400">
                    • {category.subcategories!.length} subcategories
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasSubcategories && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(category.id);
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <ChevronRight className={cn(
                    "h-5 w-5 text-neutral-400 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} />
                </button>
              )}
              <Link
                href={`/products?category=${category.slug}`}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-900 hover:text-white transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Image preview strip */}
          {category.image && !isSubcategory && (
            <div className="absolute top-0 right-0 w-24 h-full opacity-20 group-hover:opacity-30 transition-opacity">
              <img 
                src={category.image.startsWith('http') ? category.image : `http://localhost:8000${category.image}`}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white" />
            </div>
          )}
        </Card>

        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <div className="mt-2 space-y-2 pl-6 border-l-2 border-neutral-200">
            {category.subcategories!.map(sub => renderCategoryCard(sub, true))}
          </div>
        )}
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category);
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;

        return (
          <Link 
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group animate-fade-in-up"
          >
            <Card className="p-6 text-center h-full hover:shadow-lg hover:border-neutral-300 hover:-translate-y-1 transition-all duration-300">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:scale-110 transition-all duration-300">
                <IconComponent className="h-8 w-8 text-neutral-600 group-hover:text-white transition-colors" />
              </div>
              
              {/* Name */}
              <h3 className="font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                {category.name}
              </h3>
              
              {/* Stats */}
              <div className="mt-2 space-y-1">
                {category.product_count !== undefined && (
                  <p className="text-xs text-neutral-400">
                    {category.product_count} products
                  </p>
                )}
                {hasSubcategories && (
                  <p className="text-xs text-neutral-500 font-medium">
                    {category.subcategories!.length} subcategories
                  </p>
                )}
              </div>

              {/* Subcategory preview */}
              {hasSubcategories && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex flex-wrap justify-center gap-1">
                    {category.subcategories!.slice(0, 3).map(sub => (
                      <span 
                        key={sub.id}
                        className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {category.subcategories!.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-200 rounded-full text-neutral-600">
                        +{category.subcategories!.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">All Categories</h1>
              <p className="mt-1 text-neutral-500">
                Browse {categories.length} categories to find what you need
              </p>
            </div>
            
            {/* View toggle */}
            <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'grid' 
                    ? "bg-white shadow text-neutral-900" 
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'list' 
                    ? "bg-white shadow text-neutral-900" 
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-5 w-24 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </Card>
            ))}
          </div>
        ) : categories.length > 0 ? (
          viewMode === 'grid' ? (
            renderGridView()
          ) : (
            <div className="space-y-3 max-w-4xl">
              {categories.map(category => renderCategoryCard(category))}
            </div>
          )
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900">No categories yet</h3>
            <p className="text-neutral-500 mt-1">Categories will appear here once added.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

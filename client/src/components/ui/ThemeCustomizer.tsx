'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Eye, 
  Type, 
  Zap,
  Check,
  RotateCcw,
  Contrast
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Predefined color schemes
const colorSchemes = [
  { 
    name: 'Default Purple', 
    primary: 'hsl(262.1, 83.3%, 57.8%)',
    accent: 'hsl(262.1, 83.3%, 57.8%)',
    preview: 'bg-gradient-to-r from-purple-600 to-blue-600'
  },
  { 
    name: 'Ocean Blue', 
    primary: 'hsl(200, 98%, 39%)',
    accent: 'hsl(200, 98%, 39%)',
    preview: 'bg-gradient-to-r from-blue-600 to-cyan-600'
  },
  { 
    name: 'Forest Green', 
    primary: 'hsl(142, 71%, 45%)',
    accent: 'hsl(142, 71%, 45%)',
    preview: 'bg-gradient-to-r from-green-600 to-emerald-600'
  },
  { 
    name: 'Sunset Orange', 
    primary: 'hsl(24.6, 95%, 53.1%)',
    accent: 'hsl(24.6, 95%, 53.1%)',
    preview: 'bg-gradient-to-r from-orange-600 to-red-600'
  },
  { 
    name: 'Rose Pink', 
    primary: 'hsl(346.8, 77.2%, 49.8%)',
    accent: 'hsl(346.8, 77.2%, 49.8%)',
    preview: 'bg-gradient-to-r from-pink-600 to-rose-600'
  }
];

export default function ThemeCustomizer({ isOpen, onClose }: ThemeCustomizerProps) {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState('base');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('banter-font-size') || 'base';
      const savedReducedMotion = localStorage.getItem('banter-reduced-motion') === 'true';
      const savedHighContrast = localStorage.getItem('banter-high-contrast') === 'true';
      const savedColorScheme = parseInt(localStorage.getItem('banter-color-scheme') || '0');
      
      setFontSize(savedFontSize);
      setReducedMotion(savedReducedMotion);
      setHighContrast(savedHighContrast);
      setSelectedColorScheme(savedColorScheme);
      
      // Apply settings
      applyFontSize(savedFontSize);
      applyReducedMotion(savedReducedMotion);
      applyHighContrast(savedHighContrast);
      applyColorScheme(savedColorScheme);
    }
  }, []);

  const applyFontSize = (size: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
      if (size !== 'base') {
        document.documentElement.classList.add(`text-${size}`);
      }
      localStorage.setItem('banter-font-size', size);
    }
  };

  const applyReducedMotion = (enabled: boolean) => {
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.add('motion-reduce');
      } else {
        document.documentElement.classList.remove('motion-reduce');
      }
      localStorage.setItem('banter-reduced-motion', enabled.toString());
    }
  };

  const applyHighContrast = (enabled: boolean) => {
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      localStorage.setItem('banter-high-contrast', enabled.toString());
    }
  };

  const applyColorScheme = (index: number) => {
    if (typeof document !== 'undefined') {
      const scheme = colorSchemes[index];
      if (scheme) {
        document.documentElement.style.setProperty('--primary', scheme.primary);
        document.documentElement.style.setProperty('--accent', scheme.accent);
        localStorage.setItem('banter-color-scheme', index.toString());
      }
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    applyFontSize(size);
  };

  const handleReducedMotionChange = (enabled: boolean) => {
    setReducedMotion(enabled);
    applyReducedMotion(enabled);
  };

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrast(enabled);
    applyHighContrast(enabled);
  };

  const handleColorSchemeChange = (index: number) => {
    setSelectedColorScheme(index);
    applyColorScheme(index);
  };

  const resetToDefaults = () => {
    handleFontSizeChange('base');
    handleReducedMotionChange(false);
    handleHighContrastChange(false);
    handleColorSchemeChange(0);
    setTheme('system');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-labelledby="theme-title">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 id="theme-title" className="text-xl font-semibold text-foreground flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Theme & Accessibility
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close customizer"
          >
            <span className="sr-only">Close</span>
            ×
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Mode */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              Theme Mode
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "p-3 border rounded-lg text-center transition-all hover:border-primary",
                    theme === value ? "border-primary bg-primary/5" : "border-border"
                  )}
                  aria-pressed={theme === value}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                  {theme === value && <Check className="w-3 h-3 mx-auto mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Schemes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Color Scheme</h3>
            <div className="grid grid-cols-1 gap-3">
              {colorSchemes.map((scheme, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSchemeChange(index)}
                  className={cn(
                    "flex items-center p-3 border rounded-lg transition-all hover:border-primary",
                    selectedColorScheme === index ? "border-primary bg-primary/5" : "border-border"
                  )}
                  aria-pressed={selectedColorScheme === index}
                >
                  <div className={cn("w-8 h-8 rounded-full mr-3", scheme.preview)} />
                  <span className="text-sm font-medium flex-1 text-left">{scheme.name}</span>
                  {selectedColorScheme === index && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Type className="w-4 h-4 mr-2" />
              Font Size
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'sm', label: 'Small' },
                { value: 'base', label: 'Normal' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'Extra Large' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFontSizeChange(value)}
                  className={cn(
                    "p-2 border rounded text-center transition-all hover:border-primary",
                    fontSize === value ? "border-primary bg-primary/5" : "border-border"
                  )}
                  aria-pressed={fontSize === value}
                >
                  <span className={cn("text-xs font-medium", `text-${value}`)}>Aa</span>
                  <div className="text-[10px] mt-1">{label}</div>
                  {fontSize === value && <Check className="w-3 h-3 mx-auto mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Accessibility
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Contrast className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">High Contrast</div>
                    <div className="text-xs text-muted-foreground">Improves text readability</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => handleHighContrastChange(e.target.checked)}
                  className="sr-only"
                  aria-describedby="high-contrast-desc"
                />
                <div className="relative">
                  <div className={cn(
                    "w-10 h-6 rounded-full shadow-inner transition-colors",
                    highContrast ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "absolute w-4 h-4 bg-white rounded-full shadow top-1 transition-transform",
                    highContrast ? "left-5" : "left-1"
                  )} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Reduce Motion</div>
                    <div className="text-xs text-muted-foreground">Minimizes animations</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => handleReducedMotionChange(e.target.checked)}
                  className="sr-only"
                  aria-describedby="reduced-motion-desc"
                />
                <div className="relative">
                  <div className={cn(
                    "w-10 h-6 rounded-full shadow-inner transition-colors",
                    reducedMotion ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "absolute w-4 h-4 bg-white rounded-full shadow top-1 transition-transform",
                    reducedMotion ? "left-5" : "left-1"
                  )} />
                </div>
              </label>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="w-full flex items-center justify-center"
              aria-label="Reset all customizations to default"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

/**
 * Performance utilities for production optimization
 * Note: Web Vitals are already handled by components/WebVitals.jsx using Next.js built-in hooks
 * Note: debounce and throttle moved to utils/debounce.js
 */

import dynamic from 'next/dynamic';

/**
 * Lazy load component with Next.js dynamic import
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Loading options
 * @example
 * const HeavyComponent = lazyLoadComponent(() => import('./HeavyComponent'));
 */
export function lazyLoadComponent(importFn, options = {}) {
  const {
    loading = () => null,
    ssr = true,
  } = options;

  return dynamic(importFn, {
    loading,
    ssr,
  });
}

/**
 * Preload critical resources (fonts, scripts, etc.)
 * @param {string} href - Resource URL
 * @param {string} as - Resource type (script, font, style, etc.)
 * @example
 * preloadResource('/fonts/custom-font.woff2', 'font');
 */
export function preloadResource(href, as = 'script') {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (as === 'font') {
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  }
}

/**
 * Measure component render time (development only)
 * @param {string} componentName - Name of the component
 * @returns {Function} Cleanup function
 * @example
 * const stopMeasure = measureComponentRender('MyComponent');
 * // ... component renders
 * stopMeasure();
 */
export function measureComponentRender(componentName) {
  if (typeof window !== 'undefined' && window.performance && process.env.NODE_ENV === 'development') {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    const measureName = `${componentName}-render`;

    performance.mark(startMark);

    return () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      console.log(`[Performance] ${componentName} rendered in ${Math.round(measure.duration)}ms`);
      
      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    };
  }
  
  return () => {};
}

/**
 * Check if browser supports WebP format
 * Useful for conditional image loading
 */
export function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Check if browser supports AVIF format
 * Useful for conditional image loading
 */
export async function supportsAVIF() {
  if (typeof window === 'undefined') return false;
  
  const avif = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  
  try {
    const img = new Image();
    img.src = avif;
    await img.decode();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get optimal image format based on browser support
 * @returns {Promise<'avif'|'webp'|'jpeg'>}
 */
export async function getOptimalImageFormat() {
  if (await supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Monitor long tasks for performance debugging (development only)
 * Logs tasks that take longer than 50ms
 */
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  if (process.env.NODE_ENV !== 'development') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('[Long Task]', {
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
        });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}

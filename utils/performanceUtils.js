/**
 * Performance monitoring utilities for Vercel deployment
 */

/**
 * Report Web Vitals to analytics
 * @param {Object} metric - Web Vitals metric object
 */
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Vercel Analytics otomatik olarak toplar
    // İsterseniz custom analytics'e de gönderebilirsiniz
    const { name, value, id, label } = metric;
    
    // Console'da görmek için (development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}:`, {
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        label,
        id,
      });
    }

    // Custom analytics endpoint'e gönder (optional)
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric),
    // });
  }
}

/**
 * Lazy load component with intersection observer
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Loading options
 */
export function lazyLoadComponent(importFn, options = {}) {
  const {
    fallback = null,
    ssr = true,
    loading = () => fallback,
  } = options;

  const LazyComponent = dynamic(importFn, {
    loading,
    ssr,
  });

  return LazyComponent;
}

/**
 * Preload critical resources
 * @param {string} href - Resource URL
 * @param {string} as - Resource type
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
 * Measure component render time
 * @param {string} componentName - Name of the component
 */
export function measureComponentRender(componentName) {
  if (typeof window !== 'undefined' && window.performance) {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    const measureName = `${componentName}-render`;

    performance.mark(startMark);

    return () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const measure = performance.getEntriesByName(measureName)[0];
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${Math.round(measure.duration)}ms`);
      }
      
      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    };
  }
  
  return () => {};
}

/**
 * Optimize Firebase query for better performance
 * @param {Object} query - Firebase query object
 * @param {number} limit - Max items to fetch
 */
export function optimizeFirebaseQuery(query, limit = 50) {
  // Limit sonuçları to reduce data transfer
  return query.limit(limit);
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if browser supports WebP
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
 * Check if browser supports AVIF
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
 */
export async function getOptimalImageFormat() {
  if (await supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Monitor long tasks (for performance debugging)
 */
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Long Task]', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });
        }
        // Optionally send to analytics
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}

// Import dynamic from next for lazy loading
import dynamic from 'next/dynamic';

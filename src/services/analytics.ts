/**
 * Verse Analytics (Plausible-based) tracking service for IRISME.
 * 
 * Provides automated pageview tracking, custom Web3 payment & rewards conversion events,
 * and real-time status diagnostics.
 */

declare global {
  interface Window {
    plausible?: {
      (eventName: string, options?: { props?: Record<string, any>; callback?: () => void }): void;
      q?: any[];
    };
    __VERSE_ANALYTICS_DOMAIN__?: string;
  }
}

class AnalyticsService {
  private initialized = false;
  private currentDomain: string = '';
  private trackedEvents: Array<{ name: string; props?: Record<string, any>; timestamp: number }> = [];

  constructor() {
    this.ensureStub();
  }

  /**
   * Ensure window.plausible queue stub exists so calls never fail
   */
  private ensureStub(): void {
    if (typeof window === 'undefined') return;
    window.plausible = window.plausible || function() {
      (window.plausible!.q = window.plausible!.q || []).push(arguments);
    };
  }

  /**
   * Resolve active analytics domain safely
   */
  public getDomain(): string {
    if (this.currentDomain) return this.currentDomain;

    const envDomain = import.meta.env.VITE_ANALYTICS_DOMAIN;
    if (envDomain && !envDomain.includes('%') && envDomain !== 'YOUR-DOMAIN.com') {
      this.currentDomain = envDomain;
    } else if (typeof window !== 'undefined' && window.location.hostname) {
      this.currentDomain = window.location.hostname;
    } else {
      this.currentDomain = 'irisme.app';
    }

    if (typeof window !== 'undefined') {
      window.__VERSE_ANALYTICS_DOMAIN__ = this.currentDomain;
    }

    return this.currentDomain;
  }

  /**
   * Initialize or verify script insertion with valid domain attribute
   */
  public initialize(): void {
    if (typeof window === 'undefined' || this.initialized) return;

    this.ensureStub();
    const domain = this.getDomain();

    // Check if script element already exists
    let script = document.getElementById('verse-analytics-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.querySelector('script[src*="analytics.vgdh.io/js/script.js"]');
    }

    if (script) {
      // Ensure data-domain is valid
      const existingDomain = script.getAttribute('data-domain');
      if (!existingDomain || existingDomain.includes('%') || existingDomain === 'YOUR-DOMAIN.com') {
        script.setAttribute('data-domain', domain);
      }
    } else {
      // Create and inject script dynamically
      script = document.createElement('script');
      script.id = 'verse-analytics-script';
      script.defer = true;
      script.setAttribute('data-domain', domain);
      script.src = 'https://analytics.vgdh.io/js/script.js';
      document.head.appendChild(script);
    }

    this.initialized = true;
  }

  /**
   * Track SPA route pageviews
   */
  public trackPageView(path?: string): void {
    if (typeof window === 'undefined') return;
    this.ensureStub();
    const url = path ? `${window.location.origin}${path}` : window.location.href;

    try {
      if (window.plausible) {
        window.plausible('pageview', {
          props: { path: path || window.location.pathname, domain: this.getDomain() },
        });
      }
      this.trackedEvents.push({
        name: 'pageview',
        props: { url, path: path || window.location.pathname },
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[Analytics] Pageview tracking notice:', err);
    }
  }

  /**
   * Track custom user interaction or Web3 conversion event
   */
  public trackEvent(eventName: string, props?: Record<string, any>): void {
    if (typeof window === 'undefined') return;
    this.ensureStub();

    try {
      if (window.plausible) {
        window.plausible(eventName, { props });
      }
      this.trackedEvents.push({
        name: eventName,
        props,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn(`[Analytics] Event ${eventName} notice:`, err);
    }
  }

  /**
   * Check if analytics is loaded, active, and functioning
   */
  public checkAnalyticsStatus(): {
    isFunctioning: boolean;
    domain: string;
    scriptFound: boolean;
    scriptSrc: string | null;
    scriptDomainAttr: string | null;
    eventsTrackedCount: number;
    recentEvents: Array<{ name: string; timestamp: number }>;
  } {
    if (typeof window === 'undefined') {
      return {
        isFunctioning: false,
        domain: this.getDomain(),
        scriptFound: false,
        scriptSrc: null,
        scriptDomainAttr: null,
        eventsTrackedCount: 0,
        recentEvents: [],
      };
    }

    const script =
      (document.getElementById('verse-analytics-script') as HTMLScriptElement | null) ||
      document.querySelector('script[src*="analytics.vgdh.io"]');

    const scriptFound = Boolean(script);
    const scriptSrc = script ? script.src : null;
    const scriptDomainAttr = script ? script.getAttribute('data-domain') : null;
    const domainValid = Boolean(
      scriptDomainAttr && !scriptDomainAttr.includes('%') && scriptDomainAttr !== 'YOUR-DOMAIN.com'
    );

    return {
      isFunctioning: scriptFound && domainValid && typeof window.plausible === 'function',
      domain: this.getDomain(),
      scriptFound,
      scriptSrc,
      scriptDomainAttr,
      eventsTrackedCount: this.trackedEvents.length,
      recentEvents: this.trackedEvents.slice(-5).map((e) => ({ name: e.name, timestamp: e.timestamp })),
    };
  }
}

export const analytics = new AnalyticsService();

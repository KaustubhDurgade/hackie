'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Lightweight PostHog analytics.
 * Set NEXT_PUBLIC_POSTHOG_KEY in .env.local to enable.
 * If the key is absent, this component is a no-op.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog?: any;
  }
}

const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

function loadPostHog() {
  if (!POSTHOG_KEY || typeof window === 'undefined' || window.posthog) return;

  // Dynamically load PostHog snippet (avoids adding to bundle when key is absent)
  // @ts-expect-error posthog snippet bootstrapping
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog?.init(POSTHOG_KEY, {
    api_host:           POSTHOG_HOST,
    capture_pageview:   false, // we handle pageviews manually
    capture_pageleave:  true,
    autocapture:        false, // avoid capturing sensitive form inputs
    persistence:        'localStorage',
    respect_dnt:        true,
  });
}

export function Analytics() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    loadPostHog();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!POSTHOG_KEY || !window.posthog) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : '');
    window.posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

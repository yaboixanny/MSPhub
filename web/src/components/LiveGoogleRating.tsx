"use client";

import { useEffect, useState } from "react";
import { GoogleMapsAttribution, Stars } from "@/components/Rating";

// A browser key restricted to this site's domains (HTTP referrers) and to the Maps
// JavaScript API + Places API (New). Never the pipeline's server key.
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

type Live =
  | { status: "loading" }
  | { status: "ok"; rating: number; count: number; url: string }
  | { status: "none"; url: string }
  | { status: "unavailable" };

let placesLibrary: Promise<google.maps.PlacesLibrary> | null = null;

/** Loads the Maps JavaScript API once and returns its Places library. */
function loadPlaces(key: string) {
  placesLibrary ??= new Promise((resolve, reject) => {
    const callback = "__mspHubMapsReady";
    (window as unknown as Record<string, () => void>)[callback] = () => {
      google.maps.importLibrary("places").then((library) => resolve(library as google.maps.PlacesLibrary), reject);
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
  return placesLibrary;
}

/**
 * The provider's current Google rating, fetched in the visitor's browser when the
 * profile opens. Google's terms don't allow storing ratings, so they're never saved
 * or baked into the page; only the place ID is stored.
 */
export function LiveGoogleRating({ placeId }: { placeId: string }) {
  const fallbackUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const [live, setLive] = useState<Live>(KEY ? { status: "loading" } : { status: "unavailable" });

  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    loadPlaces(KEY)
      .then(async ({ Place }) => {
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["rating", "userRatingCount", "googleMapsURI"] });
        if (cancelled) return;
        const url = place.googleMapsURI ?? fallbackUrl;
        setLive(place.rating
          ? { status: "ok", rating: place.rating, count: place.userRatingCount ?? 0, url }
          : { status: "none", url });
      })
      .catch(() => {
        if (!cancelled) setLive({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [placeId, fallbackUrl]);

  const link = (url: string, text: string) => (
    <a href={url} target="_blank" rel="noopener nofollow" className="text-sm text-brand-600 hover:underline">
      {text}
    </a>
  );

  if (live.status === "loading") {
    return <span className="inline-block h-5 w-56 animate-pulse rounded bg-slate-100" aria-label="Loading Google rating" />;
  }
  if (live.status === "ok") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-slate-900">{live.rating.toFixed(1)}</span>
        <Stars rating={live.rating} size={18} />
        <span className="text-slate-500">
          {live.count.toLocaleString()} review{live.count === 1 ? "" : "s"}
        </span>
        <GoogleMapsAttribution />
        {link(live.url, "Read reviews")}
      </span>
    );
  }
  if (live.status === "none") {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-500">
        No reviews on <GoogleMapsAttribution /> yet {link(live.url, "View listing")}
      </span>
    );
  }
  return link(fallbackUrl, "Read reviews on Google Maps");
}

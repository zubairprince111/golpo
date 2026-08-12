import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { AppStateProvider } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F5F2] px-4 font-sans">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-6xl font-bold text-[#16223B]">404</h1>
        <h2 className="mt-3 text-lg font-semibold text-[#1D1D1F]">Place Not Found</h2>
        <p className="mt-2 text-xs text-[#71717A] leading-relaxed">
          The coordinates or memory you are seeking does not exist on this map.
        </p>
        <div className="mt-6">
          <Link
            to="/map"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-gray-800 transition-all"
          >
            Return to Map
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F5F2] px-4 font-sans">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-xl font-bold text-[#16223B]">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs text-[#71717A]">
          We encountered an issue loading this view. You can reload the application or return to the map.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-gray-800 transition-all cursor-pointer"
          >
            Try Again
          </button>
          <Link
            to="/map"
            className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2 text-xs font-medium text-[#1D1D1F] shadow-xs hover:bg-gray-50 transition-all"
          >
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}

const JSON_LD_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Golpo",
  "alternateName": "Golpo Bangladesh",
  "applicationCategory": "LifestyleApplication",
  "genre": "Geographic Storytelling & Memory Archive",
  "description": "An anonymous geographic storytelling and memory archive anchored across the landscape of Bangladesh.",
  "inLanguage": ["en", "bn"],
  "spatialCoverage": {
    "@type": "Place",
    "name": "Bangladesh",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 23.685,
      "longitude": 90.3563
    }
  }
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { title: "Golpo — A Map of Memories" },
      {
        name: "description",
        content:
          "Golpo is a living geographic memory archive of Bangladesh. Discover and anchor anonymous human stories, thoughts, and reflections to the exact places where they happened.",
      },
      {
        name: "keywords",
        content:
          "Golpo, Bangladesh memory map, Dhaka stories, geographic storytelling, anonymous journal Bangladesh, memories of place, Dhaka, Sylhet, Chattogram, Cox's Bazar",
      },
      { name: "author", content: "Golpo Archive" },
      { name: "theme-color", content: "#F6F5F2" },
      { property: "og:title", content: "Golpo — A Map of Memories" },
      {
        property: "og:description",
        content:
          "Discover and anchor anonymous memories across Bangladesh on Golpo — where moments stay attached to the places that created them.",
      },
      { property: "og:site_name", content: "Golpo" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "bn_BD" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Golpo — A Map of Memories" },
      {
        name: "twitter:description",
        content:
          "Discover and anchor anonymous memories across Bangladesh on Golpo.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,400;0,500;1,6..72,400&family=Geist:wght@300;400;500&family=Noto+Serif+Bengali:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "sitemap", href: "/sitemap.xml", type: "application/xml" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(JSON_LD_DATA),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AppStateProvider>
    </QueryClientProvider>
  );
}

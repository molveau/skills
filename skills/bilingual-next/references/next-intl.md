# next-intl sketches

Checked on 2026-11-13 against `next-intl` 4.13.0 and Next.js 16 (App Router, `proxy.ts`). Names and file conventions change between majors: read the docs of the installed versions (https://next-intl.dev/docs) before copying. The sketches use `fr` as the default locale, as a Québec business should.

## Routing

`i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // '/' is French, '/en/...' is English
  pathnames: {
    '/': '/',
    '/pricing': { fr: '/tarifs', en: '/pricing' },
    '/blog/[slug]': { fr: '/blogue/[slug]', en: '/blog/[slug]' },
    '/contact': '/contact',
  },
});
```

`i18n/navigation.ts`

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

List every route, even when both languages share the path: with `pathnames` set, an unlisted route becomes a type error at each call site, which is how a missing route shows up.

## Request config

`i18n/request.ts`

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

In the `[locale]` layout, set `<html lang={locale}>` (use `fr-CA` and `en-CA` when the market is Canada), call `setRequestLocale(locale)` and add `generateStaticParams` returning `routing.locales`.

## Proxy

`proxy.ts` (Next.js 16; `middleware.ts` on Next.js 15 and earlier)

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

// Skip the API, Next internals and files with an extension.
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
```

The middleware also sends `Link` headers with `hreflang` alternates; they do not replace the `<head>` alternates in the next section.

## Metadata alternates

`lib/metadata.ts`

```ts
import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';

type Href = Parameters<typeof getPathname>[0]['href'];
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

const absolute = (href: Href, locale: 'fr' | 'en') => {
  const path = getPathname({ href, locale });
  return `${BASE}${path === '/' ? '' : path}`;
};

export function pageMetadata({ locale, href, title, description }: {
  locale: string; href: Href; title: string; description: string;
}): Metadata {
  const fr = absolute(href, 'fr');
  const en = absolute(href, 'en');
  return {
    title,
    description,
    alternates: {
      canonical: locale === 'fr' ? fr : en,
      languages: { fr, en, 'x-default': fr }, // x-default is the default-locale URL
    },
    openGraph: { locale: locale === 'fr' ? 'fr_CA' : 'en_CA', url: locale === 'fr' ? fr : en },
  };
}
```

Call it from `generateMetadata` on every page. Each page is its own canonical; never point the English page's canonical at the French one.

## Sitemap

`app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';

type Href = Parameters<typeof getPathname>[0]['href'];
const BASE = 'https://example.com';
const routes: Href[] = ['/', '/pricing', '/contact']; // add dynamic routes from your content

export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (href: Href, l: 'fr' | 'en') => {
    const p = getPathname({ href, locale: l });
    return `${BASE}${p === '/' ? '' : p}`;
  };
  return routes.flatMap((href) => {
    const fr = abs(href, 'fr');
    const en = abs(href, 'en');
    const alternates = { languages: { fr, en, 'x-default': fr } };
    return [fr, en].map((url) => ({ url, alternates }));
  });
}
```

Each language gets its own entry, and both carry the full alternates, itself included.

## Language switcher

`components/language-switcher.tsx`

```tsx
'use client';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname(); // the internal route key, e.g. '/blog/[slug]'
  const params = useParams();
  const router = useRouter();
  const next = locale === 'fr' ? 'en' : 'fr';
  // next-intl types `params` against the pathname literal; here both come from the current
  // route, so they always match and the cast only silences the generic type.
  const href = { pathname, params } as React.ComponentProps<typeof Link>['href'];

  return (
    <Link
      href={href}
      locale={next}
      hrefLang={next}
      lang={next}
      onClick={(event) => {
        // Keep the query string. It is read on click, so no Suspense boundary is needed.
        event.preventDefault();
        const query = Object.fromEntries(new URLSearchParams(window.location.search));
        router.replace({ pathname, params, query } as Parameters<typeof router.replace>[0], { locale: next });
      }}
    >
      {next === 'en' ? 'English' : 'Français'}
    </Link>
  );
}
```

`usePathname` returns the route key, so the link lands on the localized path of the same page. The `Link` from `createNavigation` is a real `<a href>` in the other language, so a crawler can follow it and a visitor can open it in a new tab; `locale` picks the target path, and `hrefLang` and `lang` label it. The click handler adds the current query string from `window.location.search` (repeated keys keep only the last value). Reading it on click avoids `useSearchParams`, which on a prerendered route pushes the component up to the nearest `Suspense` boundary into client rendering; if you prefer that hook, wrap the switcher in `<Suspense>`.

## Content twins

`content/content.test.ts` (Vitest or `node --test`)

```ts
import { readdirSync } from 'node:fs';
import { expect, test } from 'vitest';

const dir = 'content/guides';
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const slugs = new Set(files.map((f) => f.replace(/\.(fr|en)\.md$/, '')));

test.each([...slugs])('%s exists in French and English', (slug) => {
  expect(files).toContain(`${slug}.fr.md`);
  expect(files).toContain(`${slug}.en.md`);
});
```

Extend it to compare the frontmatter keys (title, description, date) of both files.

## Messages parity as a test

```ts
import { execFileSync } from 'node:child_process';
import { test } from 'vitest';

test('fr and en messages have the same shape', () => {
  // exits 1 with the list of paths on a difference, which fails the test
  execFileSync('node', ['scripts/check-i18n-parity.mjs', 'messages/fr.json', 'messages/en.json'], { stdio: 'pipe' });
});
```

Copy `check-i18n-parity.mjs` from this skill into the project's `scripts/` folder.

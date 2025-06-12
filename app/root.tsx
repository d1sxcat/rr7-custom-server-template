import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import type { Route } from './+types/root.ts'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import css from '~/tailwind.css?url'
import { getEnv } from '~/lib/env.server.ts'
import { pipeHeaders } from '~/lib/headers.server.ts'
import { honeypot } from '~/lib/honeypot.server.ts'
import { useNonce } from '~/lib/nonce-provider.ts'

export const links: Route.LinksFunction = () => {
  return [
    {
      rel: 'icon',
      href: '/favicon.ico',
      sizes: '48x48',
    },
    { rel: 'stylesheet', href: css },
  ].filter(Boolean)
}

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Route' },
    { name: 'description', content: 'Nothing to see here' },
  ]
}

export async function loader() {
  const honeyProps = await honeypot.getInputProps()

  return data({
    ENV: getEnv(),
    honeyProps,
  })
}

export const headers: Route.HeadersFunction = pipeHeaders

function Document({
  children,
  nonce,
  env = {},
}: {
  children: React.ReactNode
  nonce: string
  env?: Record<string, string | undefined>
}) {
  const allowIndexing = ENV.ALLOW_INDEXING !== 'false'
  return (
    <html lang="en" className={`h-full overflow-x-hidden`}>
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : (
          <meta name="robots" content="noindex, nofollow" />
        )}
        <Links />
      </head>
      <body className="h-full bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader | null>()
  const nonce = useNonce()
  return (
    <Document nonce={nonce} env={data?.ENV}>
      {children}
    </Document>
  )
}

function App() {
  return <Outlet />
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>()
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  )
}

export default AppWithProviders

export const ErrorBoundary = GeneralErrorBoundary

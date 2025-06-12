import { styleText } from 'node:util'
import { helmet } from '@nichtsam/helmet/node-http'
import { createRequestHandler } from '@react-router/express'
import { ip as ipAddress } from 'address'
import closeWithGrace from 'close-with-grace'
import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import getPort, { portNumbers } from 'get-port'
import morgan from 'morgan'
import { type ServerBuild } from 'react-router'

declare module 'react-router' {
  interface AppLoadContext {
    serverBuild: Promise<{ build: ServerBuild; error: unknown }>
    valueFromExpress: string
  }
}

const MODE = process.env.NODE_ENV ?? 'development'
const IS_PROD = MODE === 'production'
const IS_DEV = MODE === 'development'
const ALLOW_INDEXING = process.env.ALLOW_INDEXING !== 'false'

const viteDevServer = IS_PROD
  ? undefined
  : await import('vite').then(vite =>
      vite.createServer({
        server: {
          middlewareMode: true,
        },
        appType: 'custom',
      })
    )

const app = express()

app.get('*slashes', (req, res, next) => {
  if (req.path.endsWith('/') && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
    res.redirect(302, safepath + query)
  } else {
    next()
  }
})

app.use(compression())

app.disable('x-powered-by')

app.use((_, res, next) => {
  helmet(res, { general: { referrerPolicy: false } })
  next()
})

if (viteDevServer) {
  app.use(viteDevServer.middlewares)
} else {
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' })
  )
  app.use(express.static('build/client', { maxAge: '1h' }))
}

morgan.token('url', req => {
  try {
    return decodeURIComponent(req.url ?? '')
  } catch {
    return req.url ?? ''
  }
})
app.use(morgan('tiny'))

const maxMultiple = !IS_PROD ? 10_000 : 1
const rateLimitDefault = {
  windowMs: 60 * 1000,
  limit: 1000 * maxMultiple,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
}

const strongRateLimit = rateLimit({
  ...rateLimitDefault,
  windowMs: 60 * 1000,
  limit: 100 * maxMultiple,
})

const generalRateLimit = rateLimit(rateLimitDefault)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return strongRateLimit(req, res, next)
  }
  return generalRateLimit(req, res, next)
})

async function getBuild() {
  try {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule('virtual:react-router/server-build')
      : // @ts-expect-error - the file might not exist yet but it will
        await import('../build/server/index.js')

    return { build: build as unknown as ServerBuild, error: null }
  } catch (error) {
    console.error('Error creating build:', error)
    return { error: error, build: null as unknown as ServerBuild }
  }
}

if (!ALLOW_INDEXING) {
  app.use((_, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow')
    next()
  })
}

app.all(
  '*rr',
  createRequestHandler({
    getLoadContext: () => ({
      serverBuild: getBuild(),
      valueFromExpress: 'Hello from Express!',
    }),
    mode: MODE,
    build: async () => {
      const { error, build } = await getBuild()
      if (error) {
        throw error
      }
      return build
    },
  })
)

const desiredPort = Number(process.env.PORT || 3000)
const portToUse = await getPort({
  port: portNumbers(desiredPort, desiredPort + 100),
})
const portAvailable = desiredPort === portToUse
if (!portAvailable && !IS_DEV) {
  console.log(`⚠️ Port ${desiredPort} is not available.`)
  process.exit(1)
}

const server = app.listen(portToUse, () => {
  if (!portAvailable) {
    console.warn(
      styleText(
        'yellow',
        `⚠️  Port ${desiredPort} is not available, using ${portToUse} instead.`
      )
    )
  }
  console.log(`👌 Nice! Let's go`)
  const localUrl = `http://localhost:${portToUse}`
  let lanUrl: string | null = null
  const localIp = ipAddress() ?? 'Unknown'
  if (/^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(localIp)) {
    lanUrl = `http://${localIp}:${portToUse}`
  }

  console.log(
    `
${styleText('bold', 'Local:')}            ${styleText('green', localUrl)}
${
  lanUrl
    ? `${styleText('bold', 'Network:')}  ${styleText('green', lanUrl)}`
    : ''
}
${styleText('bold', 'Press Ctrl+C to stop')}
		`.trim()
  )
})

closeWithGrace(async ({ err }) => {
  await new Promise((resolve, reject) => {
    server.close(e => (e ? reject(e) : resolve('ok')))
  })
  if (err) {
    console.error(styleText('red', String(err)))
    console.error(styleText('red', String(err.stack)))
  }
})

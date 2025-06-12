import crypto from 'node:crypto'
import { PassThrough } from 'node:stream'
import { styleText } from 'node:util'
import { contentSecurity } from '@nichtsam/helmet/content'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import {
	ServerRouter,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	type HandleDocumentRequestFunction,
} from 'react-router'
import { getEnv, init } from '~/lib/env.server.ts'
import { NonceProvider } from '~/lib/nonce-provider.ts'

export const streamTimeout = 5000

init()
global.ENV = getEnv()

const MODE = process.env.NODE_ENV ?? 'development'

type DocRequestArgs = Parameters<HandleDocumentRequestFunction>

export default async function handleRequest(...args: DocRequestArgs) {
	const [request, responseStatusCode, responseHeaders, reactRouterContext] =
		args
	
	const callbackName = isbot(request.headers.get('user-agent'))
		? 'onAllReady'
		: 'onShellReady'

	const nonce = crypto.randomBytes(16).toString('hex')
	return new Promise(async (resolve, reject) => {
		let didError = false
		const { pipe, abort } = renderToPipeableStream(
			<NonceProvider value={nonce}>
				<ServerRouter
					nonce={nonce}
					context={reactRouterContext}
					url={request.url}
				/>
			</NonceProvider>,
			{
				[callbackName]: () => {
					const body = new PassThrough()
					responseHeaders.set('Content-Type', 'text/html')

					contentSecurity(responseHeaders, {
						crossOriginEmbedderPolicy: false,
						contentSecurityPolicy: {
							// NOTE: Remove reportOnly when you're ready to enforce this CSP
							reportOnly: true,
							directives: {
								fetch: {
									'connect-src': [
										MODE === 'development' ? 'ws:' : undefined,
										"'self'",
									],
									'font-src': ["'self'"],
									'frame-src': ["'self'"],
									'img-src': ["'self'", 'data:'],
									'script-src': [
										"'strict-dynamic'",
										"'self'",
										`'nonce-${nonce}'`,
									],
									'script-src-attr': [`'nonce-${nonce}'`],
								},
							},
						},
					})

					resolve(
						new Response(createReadableStreamFromReadable(body), {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						}),
					)
					pipe(body)
				},
				onShellError: (err: unknown) => {
					reject(err)
				},
				onError: () => {
					didError = true
				},
				nonce,
			},
		)

		setTimeout(abort, streamTimeout + 5000)
	})
}

export function handleError(
	error: unknown,
	{ request }: LoaderFunctionArgs | ActionFunctionArgs,
): void {
	if (request.signal.aborted) {
		return
	}

	if (error instanceof Error) {
		console.error(styleText('red', String(error.stack)))
	} else {
		console.error(error)
	}
}
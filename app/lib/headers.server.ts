import { type CacheControlValue, parse, format } from '@tusbar/cache-control'
import { type HeadersArgs } from 'react-router'

export function pipeHeaders({
	parentHeaders,
	loaderHeaders,
	actionHeaders,
	errorHeaders,
}: HeadersArgs) {
	const headers = new Headers()

	// get the one that's actually in use
	let currentHeaders: Headers
	if (errorHeaders !== undefined) {
		currentHeaders = errorHeaders
	} else if (loaderHeaders.entries().next().done) {
		currentHeaders = actionHeaders
	} else {
		currentHeaders = loaderHeaders
	}

	const forwardHeaders = ['Cache-Control', 'Vary']
	for (const headerName of forwardHeaders) {
		const header = currentHeaders.get(headerName)
		if (header) {
			headers.set(headerName, header)
		}
	}

	headers.set(
		'Cache-Control',
		getConservativeCacheControl(
			parentHeaders.get('Cache-Control'),
			headers.get('Cache-Control'),
		),
	)

	const inheritHeaders = ['Vary']
	for (const headerName of inheritHeaders) {
		const header = parentHeaders.get(headerName)
		if (header) {
			headers.append(headerName, header)
		}
	}

	const fallbackHeaders = ['Cache-Control', 'Vary']
	for (const headerName of fallbackHeaders) {
		if (headers.has(headerName)) {
			continue
		}
		const fallbackHeader = parentHeaders.get(headerName)
		if (fallbackHeader) {
			headers.set(headerName, fallbackHeader)
		}
	}

	return headers
}

export function getConservativeCacheControl(
	...cacheControlHeaders: Array<string | null>
): string {
	return format(
		cacheControlHeaders
			.filter(Boolean)
			.map((header) => parse(header ?? undefined))
			.reduce<CacheControlValue>((acc, current) => {
				for (const key in current) {
					const directive = key as keyof Required<CacheControlValue> // keyof CacheControl includes functions

					const currentValue = current[directive]

					switch (typeof currentValue) {
						case 'boolean': {
							if (currentValue) {
								acc[directive] = true as never
							}

							break
						}
						case 'number': {
							const accValue = acc[directive] as number | undefined

							if (accValue === undefined) {
								acc[directive] = currentValue as never
							} else {
								const result = Math.min(accValue, currentValue)
								acc[directive] = result as never
							}

							break
						}
					}
				}

				return acc
			}, {}),
	)
}
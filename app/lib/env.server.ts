import { z } from 'zod'

const schema = z.object({
	NODE_ENV: z.enum(['production', 'development'] as const),
	SESSION_SECRET: z.string(),
	HONEYPOT_SECRET: z.string(),
	ALLOW_INDEXING: z.enum(['true', 'false']).default('true')
})

export function init() {
	const parsed = schema.safeParse(process.env)

	if (parsed.success === false) {
		console.error(
			'❌ Invalid environment variables:',
			parsed.error.flatten().fieldErrors,
		)

		throw new Error('Invalid environment variables')
	}
}

export function getEnv() {
	return {
		MODE: process.env.NODE_ENV,
		ALLOW_INDEXING: process.env.ALLOW_INDEXING,
	}
}

type ENV = ReturnType<typeof getEnv>

declare global {
  // eslint-disable-next-line no-var
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
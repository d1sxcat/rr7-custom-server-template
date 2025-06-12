import { useLoaderData } from 'react-router'
import { loader } from '~/routes/home'

export function Welcome() {
  const data = useLoaderData<typeof loader>()
  return (
    <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h1 className="mt-4 text-h1 font-semibold tracking-tight text-balance sm:text-7xl">
          Hi!
        </h1>
        <p className="mt-6 text-caption text-pretty text-accent-foreground">
          This is an example page for a new React Router app
        </p>
        <br />
        <p className="mt-6 text-caption text-pretty text-accent-foreground">
          <b>Value from Express:</b> {data.valueFromExpress}
        </p>
      </div>
    </main>
  )
}

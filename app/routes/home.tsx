import type { Route } from "./+types/home";
import { Welcome } from "~/welcome/welcome";

export async function loader({context}: Route.LoaderArgs) {
  const valueFromExpress = context?.valueFromExpress;
  return { valueFromExpress};
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.valueFromExpress || "Home" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Welcome />;
}

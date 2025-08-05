import type { Route } from "./+types/cooking";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Cooking" }];
}

export default function Cooking() {
  return <div>Cooking Page</div>;
}

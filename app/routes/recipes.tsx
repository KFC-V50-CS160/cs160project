import type { Route } from "./+types/recipes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Recipes" }];
}

export default function Recipes() {
  return <div>Recipes Page</div>;
}

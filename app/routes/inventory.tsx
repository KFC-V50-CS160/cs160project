import type { Route } from "./+types/inventory";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Inventory" }];
}

export default function Inventory() {
  return <div>Inventory Page</div>;
}

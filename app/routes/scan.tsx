import type { Route } from "./+types/scan";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Scan" }];
}

export default function Scan() {
  return <div>Scan Page</div>;
}

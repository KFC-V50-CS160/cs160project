import type { Route } from "./+types/settings";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Settings" }];
}

export default function Settings() {
  return <div>Settings Page</div>;
}

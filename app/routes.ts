import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("recipes", "routes/recipes.tsx"),
  route("recipes/:dishName", "routes/RecipeDetail.tsx"),
  route("inventory", "routes/inventory.tsx"),
  route("cooking", "routes/cooking.tsx"),
  route("settings", "routes/settings.tsx"),
  route("scan", "routes/scan.tsx"),
  route("api/chat", "routes/api.chat.tsx"),
] satisfies RouteConfig;

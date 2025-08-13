// Recipe API Service Layer
export type Difficulty = "easy" | "medium" | "hard";

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  ready: boolean;
  substitution: string;
}

export interface Tool {
  name: string;
  quantity: number;
}

export interface Step {
  time: number;
  instruction: string;
}

export interface RecipeDetail {
  title: string;
  ingredient_checklist: Ingredient[];
  kitchen_setup: Tool[];
  complete_instructions: Step[];
  instruction_summary: string;
  difficulty?: Difficulty; // 新增字段
  estimatedTime?: number;  // 计算得出
  missingItemsCount?: number; // 计算得出
  imageUrl?: string; // 来自图片API
}

export interface RecipeCardData {
  id: string;
  title: string;
  status: string; // "ready to go" | "missing X item(s)"
  difficulty: Difficulty;
  time: string; // "30 min"
  imageUrl?: string;
  missingItemsCount: number;
  ready: boolean; // 是否可以制作
}

// API缓存配置
const RECIPE_CACHE_KEY = "magicfridge_recipe_details"; // 保留但不再用于详情缓存读写
const IMAGE_CACHE_KEY = "magicfridge_recipe_images";
const RECIPE_STORAGE_KEY = "magicfridge_recipe_storage";
const SAVED_RECIPES_KEY = "magicfridge_saved_recipes";
const RANDOM_DISHES_KEY = "magicfridge_random_dishes";

// API端点配置
const RECIPE_API_URL = "https://noggin.rea.gent/strong-crocodile-1199";
const IMAGE_API_URL = "https://noggin.rea.gent/magic-tiglon-7454";
const RECIPE_API_TOKEN = "Bearer rg_v1_9ywglo9vl0010xmeb2u0c4iqsuem814wzi1e_ngk";
const IMAGE_API_TOKEN = "Bearer rg_v1_ae72y97juphr37kmg4spwck0un6qdcdybw6r_ngk";

// 统一响应校验（对齐 RecipeDetail.tsx）
function validateRecipeDetail(obj: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") {
    errors.push("Response is not an object");
    return { ok: false, errors };
  }
  const keys: (keyof RecipeDetail)[] = [
    "title",
    "ingredient_checklist",
    "kitchen_setup",
    "complete_instructions",
    "instruction_summary"
  ];
  for (const k of keys) {
    if (!(k in obj)) errors.push(`Missing field: ${String(k)}`);
  }
  if (typeof obj.title !== "string") errors.push("title must be string");
  if (!Array.isArray(obj.ingredient_checklist)) errors.push("ingredient_checklist must be array");
  if (!Array.isArray(obj.kitchen_setup)) errors.push("kitchen_setup must be array");
  if (!Array.isArray(obj.complete_instructions)) errors.push("complete_instructions must be array");
  if (typeof obj.instruction_summary !== "string") errors.push("instruction_summary must be string");
  // 采样少量条目检查
  const ings = Array.isArray(obj.ingredient_checklist) ? obj.ingredient_checklist.slice(0, 3) : [];
  ings.forEach((it: any, idx: number) => {
    if (!it || typeof it !== "object") errors.push(`ingredient[${idx}] not object`);
    if (typeof it?.name !== "string") errors.push(`ingredient[${idx}].name not string`);
    if (typeof it?.unit !== "string") errors.push(`ingredient[${idx}].unit not string`);
    if (typeof it?.ready !== "boolean") errors.push(`ingredient[${idx}].ready not boolean`);
  });
  const steps = Array.isArray(obj.complete_instructions) ? obj.complete_instructions.slice(0, 3) : [];
  steps.forEach((it: any, idx: number) => {
    if (typeof it?.instruction !== "string") errors.push(`step[${idx}].instruction not string`);
  });
  return { ok: errors.length === 0, errors };
}

// 缓存工具函数（对齐 RecipeDetail.tsx：{ t, data } 无过期）
function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const payload = parsed?.data ?? parsed;
    return payload as T;
  } catch (e) {
    console.warn("[recipeApi] Cache read error:", e);
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const pack = { t: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(pack));
  } catch (e) {
    console.warn("[recipeApi] Cache write error:", e);
  }
}

// 读写“首次随机菜名列表”
function getRandomDishesFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RANDOM_DISHES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveRandomDishesToStorage(dishes: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RANDOM_DISHES_KEY, JSON.stringify(dishes));
  } catch {
    // ignore
  }
}

// 新增：只读已持久化的随机菜名，不生成
export function getPersistedRandomDishes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RANDOM_DISHES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim().length > 0) : [];
  } catch {
    return [];
  }
}

// ===== 工具函数（供详情计算/卡片展示）=====
export function calculateMissingItems(ingredients: Ingredient[]): number {
  return Array.isArray(ingredients) ? ingredients.filter(ing => !ing?.ready).length : 0;
}
export function calculateTotalTime(steps: Step[]): number {
  return Array.isArray(steps) ? steps.reduce((sum, s) => sum + (s?.time || 0), 0) : 0;
}
export function inferDifficulty(steps: Step[], totalTime: number): Difficulty {
  const c = Array.isArray(steps) ? steps.length : 0;
  if (c <= 3 && totalTime <= 30) return "easy";
  if (c <= 6 && totalTime <= 60) return "medium";
  return "hard";
}
export function generateStatusText(missingCount: number): string {
  return missingCount === 0 ? "ready to go" : `missing ${missingCount} item(s)`;
}
// ===== 工具函数结束 =====

// 从 InventoryContext 持久化的本地存储读取库存并拼接为字符串
// 注意：该 key 必须与 inventoryContext.tsx 中的 INVENTORY_STORAGE_KEY 保持一致
const INVENTORY_STORAGE_KEY_FOR_API = "magicfridge_inventory";
type StoredInventoryItem = { name?: string; count?: number };

// 将库存条目拼接为 "2 egg, 1 milk" 这样的字符串（包含数量与名称）
export function getUserDishesFromInventory(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY_FOR_API);
    if (!raw) return "";
    const items: StoredInventoryItem[] = JSON.parse(raw);
    if (!Array.isArray(items)) return "";

    const parts: string[] = [];
    for (const it of items) {
      const name = (it?.name || "").trim();
      if (!name) continue;
      const n = Number(it?.count);
      const count = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
      parts.push(`${count} ${name}`);
    }
    return parts.join(", ");
  } catch (e) {
    console.warn("[recipeApi] Read inventory for userDishes failed:", e);
    return "";
  }
}

// 生成与 RecipeDetail.tsx 完全一致的页面级缓存 key（导出给外部使用）
export function makeRecipeDetailKey(dishName: string, prefs: string, dishes: string) {
  return `recipeDetail:${encodeURIComponent(dishName)}|p:${encodeURIComponent(prefs)}|d:${encodeURIComponent(dishes)}`;
}

// RecipeDetail 使用的封面图缓存键与结构（严格对齐）
function makeHeroPageKey(recipeName: string) {
  return `recipeHero:${encodeURIComponent(recipeName)}`;
}
function writeHeroPageCache(recipeName: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    const key = makeHeroPageKey(recipeName);
    const pack = { t: Date.now(), url };
    localStorage.setItem(key, JSON.stringify(pack));
    console.log("[recipeApi][Image] mirrored page hero cache:", { key });
  } catch (e) {
    console.warn("[recipeApi][Image] write hero page cache failed:", e);
  }
}
// 新增：读取页面级 hero 图缓存
export function readHeroPageCache(recipeName: string): string | null {
  if (typeof window === "undefined" || !recipeName) return null;
  try {
    const key = makeHeroPageKey(recipeName);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const url = typeof parsed?.url === "string" ? parsed.url : null;
    return url || null;
  } catch {
    return null;
  }
}

// 按组合键的详情请求去重：同一 key 仅发起一次网络请求
const detailInFlight = new Map<string, Promise<RecipeDetail>>();

// 获取菜谱详情（仅使用 RecipeDetail.tsx 的组合键缓存）
export async function fetchRecipeDetail(
  dishName: string,
  userPreferences: string = "",
  userDishes: string = ""
): Promise<RecipeDetail> {
  const prefs = userPreferences === "N.A." ? "" : userPreferences;
  const dishes =
    userDishes && userDishes !== "N.A." && userDishes.trim().length > 0
      ? userDishes
      : getUserDishesFromInventory();
  const pageKey = makeRecipeDetailKey(dishName, prefs, dishes);

  console.groupCollapsed("[recipeApi] fetchRecipeDetail");
  console.log("params", { dishName, userPreferences: prefs, userDishes: dishes });
  console.log("pageKey", pageKey);

  // 先读缓存
  const cached = readCache<RecipeDetail>(pageKey);
  if (cached) {
    console.info("[recipeApi] page cache HIT");
    console.groupEnd();
    return cached;
  }

  // 去重：相同 key 的并发请求复用同一 Promise
  const inflight = detailInFlight.get(pageKey);
  if (inflight) {
    console.info("[recipeApi] inflight HIT (dedup)");
    console.groupEnd();
    return inflight;
  }

  const p = (async () => {
    const res = await fetch(RECIPE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RECIPE_API_TOKEN
      },
      body: JSON.stringify({
        dishName,
        userPreferences: prefs,
        userDishes: dishes
      })
    });

    console.log("[recipeApi] status:", res.status, res.statusText);
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[recipeApi] error:", res.status, res.statusText, errText?.slice(0, 200));
      throw new Error(`Recipe API error: ${res.status} ${res.statusText}`);
    }

    let data: unknown = null;
    try {
      data = await res.json();
    } catch (e) {
      const txt = await res.text().catch(() => "");
      console.error("[recipeApi] JSON parse error, body preview:", txt?.slice(0, 200));
      throw new Error("Recipe API returned non-JSON response");
    }

    const shape = validateRecipeDetail(data);
    if (!shape.ok) {
      console.error("[recipeApi] Invalid shape:", shape.errors);
      throw new Error(`Invalid recipe shape: ${shape.errors.join("; ")}`);
    }

    const detail = data as RecipeDetail;
    const missingItemsCount = calculateMissingItems(detail.ingredient_checklist || []);
    const estimatedTime = calculateTotalTime(detail.complete_instructions || []);
    const difficulty = inferDifficulty(detail.complete_instructions || [], estimatedTime);

    const enrichedData: RecipeDetail = {
      ...detail,
      difficulty,
      estimatedTime,
      missingItemsCount
    };

    writeCache(pageKey, enrichedData);
    console.log("[recipeApi] SUCCESS -> cached via pageKey", {
      title: enrichedData.title,
      missingItemsCount,
      estimatedTime,
      difficulty
    });
    return enrichedData;
  })();

  detailInFlight.set(pageKey, p);
  try {
    const result = await p;
    return result;
  } finally {
    detailInFlight.delete(pageKey);
    console.groupEnd();
  }
}

// 获取菜谱图片（与 RecipeDetail.tsx 对齐的解析和缓存）
export async function fetchRecipeImage(recipeName: string): Promise<string | null> {
  const cacheKey = `${IMAGE_CACHE_KEY}:${encodeURIComponent(recipeName)}`;
  const cached = readCache<string>(cacheKey);
  if (cached) {
    console.info("[recipeApi][Image] cache HIT:", { recipeName });
    // 命中服务层缓存时，也确保镜像到页面 hero 缓存（避免 RecipeDetail 再次请求）
    writeHeroPageCache(recipeName, cached);
    return cached;
  }

  console.groupCollapsed("[recipeApi][Image] Fetch START");
  console.log("[recipeApi][Image] recipeName:", recipeName);

  try {
    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: IMAGE_API_TOKEN
      },
      body: JSON.stringify({ recipeName })
    });

    console.log("[recipeApi][Image] status:", response.status, response.statusText);

    const text = await response.text();
    console.log("[recipeApi][Image] raw response preview:", text.substring(0, 200));

    let imageUrl = "";
    try {
      const json = JSON.parse(text);
      if (json && typeof json.url === "string") {
        imageUrl = json.url;
      }
    } catch {
      if (/^https?:\/\//i.test(text.trim())) {
        imageUrl = text.trim();
      }
    }

    if (!imageUrl) {
      if (typeof (response as any).url === "string" && (response as any).url.startsWith("http")) {
        imageUrl = (response as any).url;
      }
    }

    if (imageUrl) {
      // 写入服务层图片缓存
      writeCache(cacheKey, imageUrl);
      // 同步镜像到 RecipeDetail 的 hero 缓存
      writeHeroPageCache(recipeName, imageUrl);
      console.log("[recipeApi][Image] SUCCESS URL:", imageUrl);
      console.groupEnd();
      return imageUrl;
    }

    console.warn("[recipeApi][Image] No valid URL found");
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("[recipeApi][Image] Fetch error:", error);
    console.groupEnd();
    return null;
  }
}

// 转换为卡片数据格式
export function convertToRecipeCard(recipe: RecipeDetail): RecipeCardData {
  const missingCount = recipe.missingItemsCount || 0;
  const timeText = recipe.estimatedTime ? `${recipe.estimatedTime} min` : "Unknown";
  return {
    id: recipe.title,
    title: recipe.title,
    status: generateStatusText(missingCount),
    difficulty: recipe.difficulty || "medium",
    time: timeText,
    imageUrl: recipe.imageUrl,
    missingItemsCount: missingCount,
    ready: missingCount === 0
  };
}

// 批量获取菜谱数据（严格走组合键）
export async function fetchMultipleRecipes(
  dishNames: string[],
  userPreferences: string = "",
  userDishes?: string
): Promise<RecipeCardData[]> {
  const prefs = userPreferences === "N.A." ? "" : userPreferences;
  const dishes =
    userDishes && userDishes !== "N.A." && userDishes.trim().length > 0
      ? userDishes
      : getUserDishesFromInventory();

  console.groupCollapsed("[fetchMultipleRecipes] START");
  // 去重，避免同名导致重复请求
  const uniqueNames = Array.from(new Set((dishNames || []).filter(Boolean)));
  console.log("params", { count: uniqueNames.length, prefs, dishes });

  const promises = uniqueNames.map(async (dishName) => {
    try {
      console.groupCollapsed("[fetchMultipleRecipes] item:", dishName);
      const detail = await fetchRecipeDetail(dishName, prefs, dishes);
      const imageUrl = await fetchRecipeImage(detail.title);
      const result = convertToRecipeCard({ ...detail, imageUrl: imageUrl || undefined });
      console.log("[fetchMultipleRecipes] OK", { dishName, ready: result.ready, time: result.time });
      console.groupEnd();
      return result;
    } catch (error) {
      console.error("[fetchMultipleRecipes] FAIL", dishName, error);
      console.groupEnd();
      return {
        id: dishName,
        title: dishName,
        status: "missing 0 item(s)",
        difficulty: "medium" as Difficulty,
        time: "Unknown",
        missingItemsCount: 0,
        ready: false
      };
    }
  });

  const results = await Promise.all(promises);
  console.log("[fetchMultipleRecipes] Completed:", results.length);
  console.groupEnd();
  return results;
}

// 新增：仅从本地组合键缓存构建卡片（不发起任何网络）
// - 根据当前库存生成 dishes（或使用来参），对每个 dishName 读取 recipeDetail:<name>|p:<prefs>|d:<dishes>
// - 如缓存里没有计算字段，则按原始字段即时计算（missing/time/difficulty）
// - 尝试读取 hero 图缓存注入 imageUrl
export function buildCardsFromCache(
  dishNames: string[],
  userPreferences: string = "",
  userDishes?: string
): RecipeCardData[] {
  if (typeof window === "undefined") return [];
  const prefs = userPreferences === "N.A." ? "" : userPreferences;
  const dishes =
    userDishes && userDishes !== "N.A." && userDishes.trim().length > 0
      ? userDishes
      : getUserDishesFromInventory();

  const unique = Array.from(new Set((dishNames || []).filter(Boolean)));
  const cards: RecipeCardData[] = [];

  for (const name of unique) {
    try {
      const key = makeRecipeDetailKey(name, prefs, dishes);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const payload = parsed?.data ?? parsed;
      const shape = validateRecipeDetail(payload);
      if (!shape.ok) continue;

      // 即时补计算字段（兼容页面写入的“未富化”缓存）
      const detail = payload as RecipeDetail;
      const computedMissing = typeof (detail as any).missingItemsCount === "number"
        ? (detail as any).missingItemsCount
        : calculateMissingItems(detail.ingredient_checklist || []);
      const computedTime = typeof (detail as any).estimatedTime === "number"
        ? (detail as any).estimatedTime
        : calculateTotalTime(detail.complete_instructions || []);
      const computedDifficulty = (detail as any).difficulty || inferDifficulty(detail.complete_instructions || [], computedTime);

      // hero 图（如有则注入）
      const hero = readHeroPageCache(name);

      const enriched: RecipeDetail = {
        ...detail,
        estimatedTime: computedTime,
        missingItemsCount: computedMissing,
        difficulty: computedDifficulty,
        imageUrl: hero || detail.imageUrl
      };
      cards.push(convertToRecipeCard(enriched));
    } catch {
      // 单项失败忽略
    }
  }

  return cards;
}

// 菜谱存储管理（仍保留工具，但推荐列表展示不再依赖它）
export function getStoredRecipes(): RecipeCardData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECIPE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const data = parsed?.data ?? parsed;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("[recipeApi] Failed to read recipe storage:", e);
    return [];
  }
}
export function storeRecipes(recipes: RecipeCardData[]) {
  if (typeof window === "undefined") return;
  try {
    const stored = getStoredRecipes();
    const byId = new Map<string, RecipeCardData>();
    stored.forEach(r => byId.set(r.id, r));

    const isErrorCard = (r: RecipeCardData) =>
      r?.status === "error" || !r?.time || r?.time === "Unknown";

    for (const incoming of recipes) {
      // 跳过“纯错误卡片”（避免污染存储）
      if (isErrorCard(incoming) && !byId.has(incoming.id)) {
        console.warn("[recipeApi] skip storing error card:", incoming.id);
        continue;
      }

      const existing = byId.get(incoming.id);
      if (!existing) {
        byId.set(incoming.id, incoming);
        continue;
      }

      // 择优合并
      const merged: RecipeCardData = { ...existing };
      merged.title = incoming.title || existing.title;
      if (!merged.imageUrl && incoming.imageUrl) merged.imageUrl = incoming.imageUrl;
      if (incoming.time && incoming.time !== "Unknown") merged.time = incoming.time;
      if (incoming.difficulty) merged.difficulty = incoming.difficulty;
      if (typeof incoming.missingItemsCount === "number") merged.missingItemsCount = incoming.missingItemsCount;

      if (!isErrorCard(incoming)) {
        merged.status = incoming.status;
        merged.ready = incoming.ready;
      }

      if (typeof merged.missingItemsCount === "number") {
        merged.status = generateStatusText(merged.missingItemsCount);
        merged.ready = merged.missingItemsCount === 0;
      }

      byId.set(incoming.id, merged);
    }

    // 最终统一清理：移除 error/Unknown 卡片，确保本地存储中不残留无效项
    const combinedRecipes = Array.from(byId.values()).filter(
      r => r && r.title && r.status !== "error" && r.time && r.time !== "Unknown" && typeof r.missingItemsCount === "number"
    );
    const pack = { t: Date.now(), data: combinedRecipes };
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(pack));
    console.log("[recipeApi] Stored recipes (merged & sanitized):", {
      total: combinedRecipes.length
    });
  } catch (e) {
    console.warn("[recipeApi] Failed to store recipes:", e);
  }
}
export function clearStoredRecipes() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECIPE_STORAGE_KEY);
}

// 已保存菜谱管理（仍保留工具；展示时按组合键获取详情再渲染）
export function getSavedRecipes(): RecipeCardData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const data = parsed?.data ?? parsed;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("[recipeApi] Failed to read saved recipes:", e);
    return [];
  }
}
export function storeSavedRecipes(recipes: RecipeCardData[]) {
  if (typeof window === "undefined") return;
  try {
    const pack = { t: Date.now(), data: recipes };
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(pack));
    console.log("[recipeApi] Stored saved recipes:", recipes.length);
  } catch (e) {
    console.warn("[recipeApi] Failed to store saved recipes:", e);
  }
}

// 获取已保存菜谱（按组合键读取/请求）
export async function getCachedSavedRecipes(): Promise<RecipeCardData[]> {
  const cached = getSavedRecipes();
  const names = cached.length > 0 ? cached.map(r => r.title) : ["Pasta Carbonara", "Chicken Soup", "Vegetable Stir Fry", "Fish Tacos", "Beef Stew"];
  const dishes = getUserDishesFromInventory();
  console.groupCollapsed("[getCachedSavedRecipes] build via combo");
  console.log("names", names);
  const list = await fetchMultipleRecipes(names, "", dishes);
  console.groupEnd();
  return list;
}

// 获取推荐菜谱（按组合键读取/请求，不再用 RECIPE_STORAGE_KEY 作为展示源）
export async function getRecommendedRecipes(inventoryItems: string[], forceRefresh: boolean = false): Promise<RecipeCardData[]> {
  console.groupCollapsed("[Recommendations] START");
  const possibleDishes = [
    "Chicken Stir Fry", "Vegetable Soup", "Pasta Carbonara", "Fried Rice", "Grilled Salmon",
    "Beef Noodle Soup", "Fish Tacos", "Mushroom Risotto", "Pork Dumplings", "Tofu Curry",
    "Shrimp Tempura", "Chicken Tikka", "Vegetable Curry", "Beef Stew", "Fish and Chips",
    "Pork Chops", "Chicken Wings", "Veggie Burger", "Salmon Teriyaki", "Beef Tacos",
    "Vegetable Stir Fry", "Chicken Caesar Salad", "Pasta Primavera", "Shrimp Scampi", "Stuffed Peppers"
    , "Egg Fried Rice", "Lemon Chicken", "Spaghetti Bolognese", "Roast Duck", "Mapo Tofu", "Clam Chowder", "Chicken Alfredo", "Eggplant Parmesan", "Lamb Kebabs", "Seafood Paella", "Pumpkin Soup", "Turkey Sandwich", "Quinoa Salad", "BBQ Ribs", "Sushi Rolls", "Pad Thai", "Falafel Wrap", "Greek Salad", "Lasagna", "Chicken Parmesan"
  ];

  // 仍复用已持久化的随机菜名，列表来源不变
  let selectedDishes = getRandomDishesFromStorage();
  if (selectedDishes.length === 0) {
    selectedDishes = possibleDishes.slice().sort(() => Math.random() - 0.5).slice(0, 6);
    saveRandomDishesToStorage(selectedDishes);
    console.log("[Recommendations] init random dishes:", selectedDishes);
  } else {
    console.log("[Recommendations] use random dishes from storage:", selectedDishes);
  }

  // 组合键的 dishes 严格来自库存（忽略外部 inventoryItems，以保持与 RecipeDetail 对齐）
  const dishes = getUserDishesFromInventory();
  console.log("[Recommendations] prefs/dishes", { prefs: "", dishes });

  const cards = await fetchMultipleRecipes(selectedDishes, "", dishes);
  console.groupEnd();
  return cards;
}


// 按菜名在本地扫描并返回最近一次缓存的 RecipeDetail（忽略 prefs/dishes 差异）
export function getCachedRecipeDetailAny(dishName: string): RecipeDetail | null {
  if (typeof window === "undefined" || !dishName) return null;
  try {
    const svcPrefix = `${RECIPE_CACHE_KEY}:${encodeURIComponent(dishName)}|`;
    const pagePrefix = `recipeDetail:${encodeURIComponent(dishName)}|`;
    let latest: { t: number; data: any } | null = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.startsWith(svcPrefix) && !key.startsWith(pagePrefix))) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const t = typeof parsed?.t === "number" ? parsed.t : 0;
        const payload = parsed?.data ?? parsed;
        const shape = validateRecipeDetail(payload);
        if (!shape.ok) continue;
        if (!latest || t > latest.t) {
          latest = { t, data: payload };
        }
      } catch {
        // ignore single bad entry
      }
    }

    if (latest && latest.data) {
      return latest.data as RecipeDetail;
    }
    return null;
  } catch (e) {
    console.warn("[recipeApi] getCachedRecipeDetailAny failed:", e);
    return null;
  }
}


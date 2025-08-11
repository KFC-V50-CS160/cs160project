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
const RECIPE_CACHE_KEY = "magicfridge_recipe_details";
const IMAGE_CACHE_KEY = "magicfridge_recipe_images";
const RECIPE_STORAGE_KEY = "magicfridge_recipe_storage"; // 用于存储推荐菜谱
const SAVED_RECIPES_KEY = "magicfridge_saved_recipes"; // 用于存储已保存菜谱
const CACHE_EXPIRY = 1000 * 60 * 30; // 30分钟

// API端点配置
const RECIPE_API_URL = "https://noggin.rea.gent/coloured-sawfish-2455";
const IMAGE_API_URL = "https://noggin.rea.gent/magic-tiglon-7454";
const RECIPE_API_TOKEN = "Bearer rg_v1_rho6lzo78nf02k4dhvy8xmlgof424rug3x9f_ngk";
const IMAGE_API_TOKEN = "Bearer rg_v1_ae72y97juphr37kmg4spwck0un6qdcdybw6r_ngk";

// 缓存工具函数
function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    if (parsed.expiry && now > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (e) {
    console.warn("Cache read error:", e);
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const cacheData = {
      data,
      expiry: Date.now() + CACHE_EXPIRY,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Cache write error:", e);
  }
}

// 计算缺少的物品数量
export function calculateMissingItems(ingredients: Ingredient[]): number {
  return ingredients.filter(ing => !ing.ready).length;
}

// 计算总烹饪时间
export function calculateTotalTime(steps: Step[]): number {
  return steps.reduce((total, step) => total + (step.time || 0), 0);
}

// 根据时间和步骤数量推断难度
export function inferDifficulty(steps: Step[], totalTime: number): Difficulty {
  const stepCount = steps.length;
  
  if (stepCount <= 3 && totalTime <= 30) return "easy";
  if (stepCount <= 6 && totalTime <= 60) return "medium";
  return "hard";
}

// 生成状态文本
export function generateStatusText(missingCount: number): string {
  if (missingCount === 0) return "ready to go";
  return `missing ${missingCount} item(s)`;
}

// 获取菜谱详情
export async function fetchRecipeDetail(
  dishName: string,
  userPreferences: string = "",
  userDishes: string = ""
): Promise<RecipeDetail> {
  const cacheKey = `${RECIPE_CACHE_KEY}_${dishName}_${userPreferences}_${userDishes}`;
  
  // 尝试缓存
  const cached = readCache<RecipeDetail>(cacheKey);
  if (cached) return cached;
  
  const response = await fetch(RECIPE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: RECIPE_API_TOKEN
    },
    body: JSON.stringify({
      dishName,
      userPreferences,
      userDishes
    })
  });
  
  if (!response.ok) {
    throw new Error(`Recipe API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json() as RecipeDetail;
  
  // 计算额外字段
  const missingItemsCount = calculateMissingItems(data.ingredient_checklist || []);
  const estimatedTime = calculateTotalTime(data.complete_instructions || []);
  const difficulty = inferDifficulty(data.complete_instructions || [], estimatedTime);
  
  const enrichedData: RecipeDetail = {
    ...data,
    difficulty,
    estimatedTime,
    missingItemsCount
  };
  
  // 写入缓存
  writeCache(cacheKey, enrichedData);
  
  return enrichedData;
}

// 获取菜谱图片
export async function fetchRecipeImage(recipeName: string): Promise<string | null> {
  const cacheKey = `${IMAGE_CACHE_KEY}_${recipeName}`;
  
  // 尝试缓存
  const cached = readCache<string>(cacheKey);
  if (cached) {
    console.log(`[Image] Using cached image for ${recipeName}:`, cached);
    return cached;
  }
  
  try {
    console.log(`[Image] Fetching image for recipe: ${recipeName}`);
    
    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: IMAGE_API_TOKEN
      },
      body: JSON.stringify({ recipeName })
    });
    
    console.log(`[Image] API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Image] API error ${response.status}: ${errorText}`);
      return null;
    }
    
    const text = await response.text();
    console.log(`[Image] API response:`, text.substring(0, 200));
    
    let imageUrl = "";
    
    // 尝试解析JSON响应
    try {
      const json = JSON.parse(text);
      console.log(`[Image] Parsed JSON:`, json);
      if (json && typeof json.url === "string") {
        imageUrl = json.url;
      }
    } catch {
      // 如果不是JSON，检查是否直接是URL
      if (/^https?:\/\//i.test(text.trim())) {
        imageUrl = text.trim();
        console.log(`[Image] Using text as URL:`, imageUrl);
      }
    }
    
    if (imageUrl) {
      writeCache(cacheKey, imageUrl);
      console.log(`[Image] Successfully got image URL for ${recipeName}:`, imageUrl);
      return imageUrl;
    }
    
    console.warn(`[Image] No valid URL found in response for ${recipeName}`);
    return null;
  } catch (error) {
    console.error(`[Image] Fetch error for ${recipeName}:`, error);
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

// 批量获取菜谱数据（用于recipes页面）
export async function fetchMultipleRecipes(dishNames: string[]): Promise<RecipeCardData[]> {
  console.log(`[fetchMultipleRecipes] Fetching ${dishNames.length} recipes:`, dishNames);
  
  const promises = dishNames.map(async (dishName) => {
    try {
      console.log(`[fetchMultipleRecipes] Processing recipe: ${dishName}`);
      const detail = await fetchRecipeDetail(dishName);
      // 并行获取图片
      const imageUrl = await fetchRecipeImage(detail.title);
      const result = convertToRecipeCard({ ...detail, imageUrl: imageUrl || undefined });
      console.log(`[fetchMultipleRecipes] Completed recipe: ${dishName}`);
      return result;
    } catch (error) {
      console.error(`Failed to fetch recipe ${dishName}:`, error);
      // 返回默认数据
      return {
        id: dishName,
        title: dishName,
        status: "error",
        difficulty: "medium" as Difficulty,
        time: "Unknown",
        missingItemsCount: 0,
        ready: false
      };
    }
  });
  
  const results = await Promise.all(promises);
  console.log(`[fetchMultipleRecipes] Completed all ${results.length} recipes`);
  return results;
}

// 获取已保存菜谱（带缓存）
export async function getCachedSavedRecipes(): Promise<RecipeCardData[]> {
  // 首先尝试从缓存获取
  const cached = getSavedRecipes();
  if (cached.length > 0) {
    console.log("Using cached saved recipes:", cached.length);
    return cached;
  }
  
  console.log("Fetching saved recipes from API");
  
  // 如果缓存为空，从API获取
  const savedDishNames = [
    "Pasta Carbonara", 
    "Chicken Soup", 
    "Vegetable Stir Fry", 
    "Fish Tacos", 
    "Beef Stew"
  ];
  
  try {
    const savedRecipes = await fetchMultipleRecipes(savedDishNames);
    
    // 缓存结果
    storeSavedRecipes(savedRecipes);
    
    return savedRecipes;
  } catch (error) {
    console.error("Failed to fetch saved recipes:", error);
    return [];
  }
}

// 菜谱存储管理
export function getStoredRecipes(): RecipeCardData[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECIPE_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    const now = Date.now();
    
    if (parsed.expiry && now > parsed.expiry) {
      localStorage.removeItem(RECIPE_STORAGE_KEY);
      return [];
    }
    
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch (e) {
    console.warn("Failed to read recipe storage:", e);
    return [];
  }
}

export function storeRecipes(recipes: RecipeCardData[]) {
  if (typeof window === "undefined") return;
  try {
    const stored = getStoredRecipes();
    // 合并新菜谱，避免重复（基于id）
    const existingIds = new Set(stored.map(r => r.id));
    const newRecipes = recipes.filter(r => !existingIds.has(r.id));
    const combinedRecipes = [...stored, ...newRecipes];
    
    const cacheData = {
      data: combinedRecipes,
      expiry: Date.now() + CACHE_EXPIRY,
      timestamp: Date.now()
    };
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Failed to store recipes:", e);
  }
}

export function clearStoredRecipes() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECIPE_STORAGE_KEY);
}

// 已保存菜谱管理
export function getSavedRecipes(): RecipeCardData[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SAVED_RECIPES_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    const now = Date.now();
    
    if (parsed.expiry && now > parsed.expiry) {
      localStorage.removeItem(SAVED_RECIPES_KEY);
      return [];
    }
    
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch (e) {
    console.warn("Failed to read saved recipes:", e);
    return [];
  }
}

export function storeSavedRecipes(recipes: RecipeCardData[]) {
  if (typeof window === "undefined") return;
  try {
    const cacheData = {
      data: recipes,
      expiry: Date.now() + CACHE_EXPIRY,
      timestamp: Date.now()
    };
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Failed to store saved recipes:", e);
  }
}

// 获取推荐菜谱（基于库存）
export async function getRecommendedRecipes(inventoryItems: string[], forceRefresh: boolean = false): Promise<RecipeCardData[]> {
  console.log(`[Recommendations] Getting recipes - forceRefresh: ${forceRefresh}`);
  
  // 如果不是强制刷新且存储中有足够的菜谱，直接返回
  if (!forceRefresh) {
    const stored = getStoredRecipes();
    console.log(`[Recommendations] Found ${stored.length} stored recipes`);
    if (stored.length >= 6) {
      console.log(`[Recommendations] Using cached recipes (${stored.length} available)`);
      return stored.slice(0, 6); // 只返回前6个
    }
  }
  
  // 生成基于库存的菜谱名称（示例逻辑）
  const possibleDishes = [
    "Chicken Stir Fry", "Vegetable Soup", "Pasta Carbonara", "Fried Rice", "Grilled Salmon",
    "Beef Noodle Soup", "Fish Tacos", "Mushroom Risotto", "Pork Dumplings", "Tofu Curry",
    "Shrimp Tempura", "Chicken Tikka", "Vegetable Curry", "Beef Stew", "Fish and Chips",
    "Pork Chops", "Chicken Wings", "Veggie Burger", "Salmon Teriyaki", "Beef Tacos"
  ];
  
  // 随机选择6个新菜谱
  const randomDishes = possibleDishes
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  
  try {
    console.log(`[Recommendations] Fetching ${randomDishes.length} new recipes from API`);
    const newRecipes = await fetchMultipleRecipes(randomDishes);
    
    // 存储新菜谱
    storeRecipes(newRecipes);
    console.log(`[Recommendations] Stored ${newRecipes.length} new recipes`);
    
    return newRecipes;
  } catch (error) {
    console.error("Failed to fetch recommended recipes:", error);
    // 如果API失败，返回存储的菜谱（如果有的话）
    const stored = getStoredRecipes();
    console.log(`[Recommendations] API failed, returning ${stored.length} stored recipes`);
    return stored.slice(0, 6);
  }
}

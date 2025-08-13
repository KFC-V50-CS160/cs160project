import type { Route } from "./+types/recipes";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { styles } from "./recipes.styles";
import "./recipes.css";
import { 
  fetchMultipleRecipes, 
  type RecipeCardData,
  getUserDishesFromInventory,
  buildCardsFromCache
} from "../services/recipeApi";
import { useInventory } from "../services/inventoryContext";

// 扩展API类型以适配recipes页面需求
type Recipe = RecipeCardData & {
  rating: number;
  ratingCount: number;
  ingredients: string[];
  description?: string;
  estimatedTime: number; // 以分钟为单位的估计时间
  status: "ready" | "missing"; // 适配过滤器
  missingItems?: number; // 别名，与missingItemsCount相同
};

// —— 图片缓存工具，与 Home/RecipeDetail 保持一致 —— 
const makeHeroKey = (recipeName: string) => `recipeHero:${encodeURIComponent(recipeName)}`;
const readHero = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const url = typeof parsed?.url === "string" ? parsed.url : null;
    if (url) {
      console.info("[Recipes] hero cache hit", { key });
      return url;
    }
    return null;
  } catch (e) {
    console.warn("[Recipes] hero cache read error", e);
    return null;
  }
};
const writeHero = (key: string, url: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ t: Date.now(), url }));
    console.info("[Recipes] hero cache saved", { key });
  } catch (e) {
    console.warn("[Recipes] hero cache write error", e);
  }
};

// 调用图片生成 API（带缓存）
const fetchHeroImage = async (recipeName: string, signal?: AbortSignal): Promise<string | null> => {
  if (!recipeName) return null;
  const heroKey = makeHeroKey(recipeName);
  const cached = readHero(heroKey);
  if (cached) return cached;

  try {
    const res = await fetch("https://noggin.rea.gent/magic-tiglon-7454", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer rg_v1_ae72y97juphr37kmg4spwck0un6qdcdybw6r_ngk"
      },
      body: JSON.stringify({ recipeName }),
      signal
    });
    const text = await res.text();
    let url = "";
    try {
      const maybe = JSON.parse(text);
      if (maybe && typeof maybe.url === "string") url = maybe.url;
    } catch {
      // 非 JSON 忽略
    }
    if (!url) {
      if (typeof res.url === "string" && res.url.startsWith("http")) url = res.url;
      else if (/^https?:\/\//i.test(text.trim())) url = text.trim();
    }
    if (!url) {
      console.warn("[Recipes] hero image: url not found in response");
      return null;
    }
    writeHero(heroKey, url);
    return url;
  } catch (e) {
    console.error("[Recipes] hero image error", e);
    return null;
  }
};

// 转换API数据为recipes页面需要的格式
function convertApiDataToRecipe(apiData: RecipeCardData): Recipe {
  const estimatedTime = parseInt(apiData.time.replace(" min", "")) || 30;
  return {
    ...apiData,
    status: apiData.ready ? "ready" : "missing",
    estimatedTime,
    missingItems: apiData.missingItemsCount, // 别名
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0 (随机生成，因为API没有提供)
    ratingCount: Math.floor(Math.random() * 1000) + 50, // 随机生成
    ingredients: [], // API暂不提供，后续可以从详情API获取
    description: `Delicious ${apiData.title.toLowerCase()} with amazing flavors.`
  };
}

// Recipes页面专用的缓存存储键
const RECIPES_STORAGE_KEY = "magicfridge_recipes_page";
const RECIPES_DISH_NAMES_KEY = "magicfridge_recipes_dish_names";

// 所有可能的菜谱名称池
const ALL_POSSIBLE_DISHES = [
    "Chicken Stir Fry", "Vegetable Soup", "Pasta Carbonara", "Fried Rice", "Grilled Salmon",
    "Beef Noodle Soup", "Fish Tacos", "Mushroom Risotto", "Pork Dumplings", "Tofu Curry",
  "Shrimp Tempura", "Chicken Tikka", "Vegetable Curry", "Beef Stew", "Fish and Chips",
  "Pork Chops", "Chicken Wings", "Veggie Burger", "Salmon Teriyaki", "Beef Tacos",
  "Vegetable Stir Fry", "Chicken Caesar Salad", "Pasta Primavera", "Shrimp Scampi", 
  "Stuffed Peppers", "Egg Fried Rice", "Lemon Chicken", "Spaghetti Bolognese", 
  "Roast Duck", "Mapo Tofu", "Clam Chowder", "Chicken Alfredo", "Eggplant Parmesan",
  "Greek Salad", "Lasagna", "Chicken Parmesan", "Pad Thai", "Falafel Wrap", "BBQ Ribs"
];

// 读写固定的菜谱列表（持久化，与home的随机菜名逻辑类似）
function getRecipesDishesFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECIPES_DISH_NAMES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveRecipesDishesToStorage(dishes: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECIPES_DISH_NAMES_KEY, JSON.stringify(dishes));
  } catch {
    // ignore
  }
}

// 读写recipes页面的卡片缓存
function readRecipesPageCache(): Recipe[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RECIPES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const payload = parsed?.data ?? parsed;
    return Array.isArray(payload) ? payload : null;
  } catch (e) {
    console.warn("[Recipes] Cache read error:", e);
    return null;
  }
}
function writeRecipesPageCache(recipes: Recipe[]) {
  if (typeof window === "undefined") return;
  try {
    const pack = { t: Date.now(), data: recipes };
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(pack));
    console.log("[Recipes] Cache saved:", recipes.length, "recipes");
  } catch (e) {
    console.warn("[Recipes] Cache write error:", e);
  }
}

// 从组合键缓存获取菜谱（现在有页面级缓存了）
async function fetchRecipesViaComboCache(): Promise<Recipe[]> {
  // 1. 先尝试页面级缓存
  const cached = readRecipesPageCache();
  if (cached && cached.length > 0) {
    console.log("[Recipes] Page cache HIT. Count:", cached.length);
    return cached;
  }

  // 2. 获取或初始化固定的菜谱列表
  let selectedDishes = getRecipesDishesFromStorage();
  if (selectedDishes.length === 0) {
    // 随机选择一定数量的菜谱，但保持固定（类似home的随机菜名）
    selectedDishes = ALL_POSSIBLE_DISHES.slice().sort(() => Math.random() - 0.5).slice(0, 20);
    saveRecipesDishesToStorage(selectedDishes);
    console.log("[Recipes] Initialized dish list:", selectedDishes.length);
  } else {
    console.log("[Recipes] Using stored dish list:", selectedDishes.length);
  }

  // 3. 从API获取数据
  const dishes = getUserDishesFromInventory();
  console.groupCollapsed("[Recipes] fetchRecipesViaComboCache");
  console.log("dishes from inventory", dishes);
  console.log("selected dishes", selectedDishes);
  
  const apiRecipes = await fetchMultipleRecipes(selectedDishes, "", dishes);
  const recipes = apiRecipes.map(convertApiDataToRecipe);
  
  // 4. 缓存结果
  writeRecipesPageCache(recipes);
  
  console.log("[Recipes] loaded", { count: recipes.length });
  console.groupEnd();
  return recipes;
}

// 强制刷新：清除页面缓存和菜谱列表，重新生成
function forceRefreshRecipes(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECIPES_STORAGE_KEY);
    localStorage.removeItem(RECIPES_DISH_NAMES_KEY);
    console.log("[Recipes] Force refresh - cleared caches");
  } catch (e) {
    console.warn("[Recipes] Force refresh error:", e);
  }
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Recipes - MagicFridge" }];
}

export default function Recipes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loaded, getCurrentPlateIngredients } = useInventory();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAttribute, setFilterAttribute] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Favorites management
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 与 Home 一致的缓存和刷新逻辑
  const reloadingRef = useRef(false);
  const lastReloadAtRef = useRef(0);
  const MIN_RELOAD_INTERVAL = 1200;

  const reloadByComboCache = async (forceRefresh: boolean = false) => {
    reloadingRef.current = true;
    try {
      console.groupCollapsed("[Recipes] reloadByComboCache");
      const dishes = getUserDishesFromInventory();
      console.log("current dishes", dishes);
      console.log("force refresh", forceRefresh);
      
      // 如果是强制刷新，先清除缓存
      if (forceRefresh) {
        forceRefreshRecipes();
      }
      
      setLoading(true);
      const apiRecipes = await fetchRecipesViaComboCache();
      setRecipes(apiRecipes);
      console.log("[Recipes] loaded", { count: apiRecipes.length });
    } catch (e) {
      console.error("[Recipes] reloadByComboCache failed", e);
    } finally {
      setLoading(false);
      lastReloadAtRef.current = Date.now();
      reloadingRef.current = false;
      console.groupEnd();
    }
  };

  const requestReload = () => {
    if (!loaded) {
      console.log("[Recipes] inventory not loaded yet, skip reload");
          return;
        }
    if (reloadingRef.current) return;
    const now = Date.now();
    if (now - lastReloadAtRef.current < MIN_RELOAD_INTERVAL) return;
    void reloadByComboCache();
  };

  // 首屏 + 路由变化：仅在 inventory 已加载后才触发 reload
  useEffect(() => {
    if (location.pathname === "/recipes" && loaded) {
      console.log("[Recipes] path change -> requestReload (inventory loaded)");
      requestReload();
    }

    const onPopState = () => {
      if (!loaded) {
        console.log("[Recipes] popstate -> inventory not loaded, skip");
        return;
      }
      console.log("[Recipes] popstate -> requestReload");
      requestReload();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [location.pathname, loaded]);

  // 刷新按钮：强制刷新，清除所有缓存
  const handleRefreshRecipes = async () => {
    if (!loaded || reloadingRef.current || refreshing) return;
    setRefreshing(true);
    try {
      await reloadByComboCache(true); // 强制刷新
    } finally {
      setRefreshing(false);
    }
  };

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedFavorites = localStorage.getItem("magicfridge_favorites");
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
      } catch (e) {
        console.warn("Failed to load favorites:", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("magicfridge_favorites", JSON.stringify(Array.from(newFavorites)));
      } catch (e) {
        console.warn("Failed to save favorites:", e);
      }
    }
  };

  // 为所有菜谱补齐图片（与 Home 一致）
  useEffect(() => {
    if (!recipes || recipes.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      console.groupCollapsed("[Recipes] Fill images for recipes");
      try {
        // 仅处理没有 imageUrl 的项，按顺序请求避免打爆 API
        const updated = await recipes.reduce<Promise<Recipe[]>>(async (accP, item) => {
          const acc = await accP;
          if (item.imageUrl || !item.title) return [...acc, item];
          const url = await fetchHeroImage(item.title, controller.signal);
          return [...acc, url ? { ...item, imageUrl: url } : item];
        }, Promise.resolve<Recipe[]>([]));

        if (!cancelled) {
          // 仅当有变更时更新，避免无谓重渲染
          const changed = updated.some((it, i) => it.imageUrl && it.imageUrl !== recipes[i]?.imageUrl);
          if (changed) setRecipes(updated);
        }
      } finally {
        console.groupEnd();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [recipes]);

  // Toggle favorite (use title as identifier for consistency with detail page)
  const toggleFavorite = (recipeTitle: string) => {
    console.log("[Recipes] Toggle favorite:", recipeTitle);
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recipeTitle)) {
      newFavorites.delete(recipeTitle);
    } else {
      newFavorites.add(recipeTitle);
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // Filter and sort recipes
  const filteredAndSortedRecipes = useMemo(() => {
    const before = recipes.length;
    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterAttribute === "all" || 
                           (filterAttribute === "ready" && recipe.ready) ||
                           (filterAttribute === "missing" && !recipe.ready) ||
                           (filterAttribute === "favorites" && favorites.has(recipe.title)) ||
                           (filterAttribute === recipe.difficulty);
      
      return matchesSearch && matchesFilter;
    });
    const afterFilter = filtered.length;

    // Sort recipes
    filtered.sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case "rating":
          result = a.rating - b.rating; // 统一为从低到高的基础排序
          break;
        case "time":
          result = a.estimatedTime - b.estimatedTime; // 从短到长
          break;
        case "difficulty":
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          result = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]; // 从易到难
          break;
        case "title":
          result = a.title.localeCompare(b.title); // 字母顺序
          break;
        default:
          return 0;
      }
      // 根据排序方向调整结果
      return sortDirection === "desc" ? -result : result;
    });

    console.log("[Recipes] Filter/sort:", { before, afterFilter, sortBy, sortDirection, filterAttribute, searchTermLen: searchTerm.length });
    return filtered;
  }, [recipes, searchTerm, filterAttribute, sortBy, sortDirection, favorites]);

  // 跳转详情：携带与组合键一致的 prefs/dishes（与 Home 一致）
  const mirrorDetailCacheBeforeNavigate = (title: string) => {
    // 简化：由组合键 API 负责写入缓存，这里仅保证参数一致性与日志
    const prefs = "";
    const dishes = getUserDishesFromInventory();
    console.groupCollapsed("[Recipes] navigate detail intent");
    console.log("params", { dishName: title, prefs, dishes });
    console.groupEnd();
  };

  const handleRecipeClick = (recipe: Recipe) => {
    if (!recipe?.title) {
      console.warn("[Recipes] Clicked recipe has no title:", recipe);
      return;
    }
    console.log("[Recipes] Navigate to detail:", recipe.title);
    const title = recipe.title;
    mirrorDetailCacheBeforeNavigate(title);
    const prefs = ""; // 与 API 默认一致
    const dishes = getUserDishesFromInventory(); // 与 API 内部使用一致
    console.log("[Recipes] navigate to detail with", { dishName: title, prefs, dishes });
    navigate(
      `/recipes/${encodeURIComponent(title)}?prefs=${encodeURIComponent(prefs)}&dishes=${encodeURIComponent(dishes)}`
    );
  };

  const handleGenerateRecipe = () => {
    try {
      const plateIngredients = getCurrentPlateIngredients();
      console.log("[Recipes] Generate with plate ingredients:", plateIngredients);
      const ingredientsParam = plateIngredients.length > 0 ? plateIngredients.join(',') : 'N.A.';
      navigate(`/recipes/N.A.?prefs=N.A.&dishes=${encodeURIComponent(ingredientsParam)}`);
    } catch (error) {
      console.error("[Recipes] Generate error:", error);
      navigate('/recipes/N.A.?prefs=N.A.&dishes=N.A.');
    }
  };

  const handleRetry = () => {
    // 强制刷新，清除缓存
    void reloadByComboCache(true);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        
        {/* Simplified Search section */}
        <div className={styles.searchSection}>
          <div className={styles.searchInputContainer}>
            <svg className={styles.searchIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
              <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathSearch} />
            </svg>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          

        </div>

        {/* Filter section - inline layout */}
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter</label>
            <select 
              value={filterAttribute}
              onChange={(e) => setFilterAttribute(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Recipes</option>
              <option value="ready">Everything Ready</option>
              <option value="missing">Missing Items</option>
              <option value="favorites">Favorites</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort by</label>
            <div className="flex items-center gap-2">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="rating">Rating</option>
                <option value="time">Time</option>
                <option value="difficulty">Difficulty</option>
                <option value="title">Name</option>
              </select>
              <button
                onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                className="px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                title={`Currently: ${sortDirection === "desc" ? "High to Low" : "Low to High"}. Click to toggle.`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sortDirection === "desc" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Recipe grid */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyStateIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
              <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathSearch} />
            </svg>
            <h3 className={styles.emptyStateTitle}>No recipes found</h3>
            <p className={styles.emptyStateSubtitle}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={styles.recipeGrid}>
            {filteredAndSortedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe)}
                className={styles.recipeCard}
              >
                <div className={styles.recipeImageContainer}>
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className={styles.recipeImage}
                    />
                  ) : (
                    <div className={styles.recipeImagePlaceholder}>
                      <span className={styles.recipeImageText}>Recipe Image</span>
                    </div>
                  )}
                  
                  {/* Rating badge */}
                  <div className={styles.ratingContainer}>
                    <div className={styles.ratingBadge}>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className={styles.ratingText}>{recipe.rating}</span>
                      <span className={styles.ratingCount}>({recipe.ratingCount})</span>
                    </div>
                  </div>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe.title);
                    }}
                    className={styles.favoriteButton}
                  >
                    <svg 
                      className={favorites.has(recipe.title) ? styles.favoriteIconActive : styles.favoriteIconInactive} 
                      fill={favorites.has(recipe.title) ? "currentColor" : "none"} 
                      stroke="currentColor" 
                      viewBox={styles.svgViewBox}
                    >
                      <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathHeart} />
                    </svg>
                  </button>
                </div>

                <div className={styles.recipeContent}>
                  <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                  
                  <div className={styles.recipeStatus}>
                    {recipe.status === "ready" ? (
                      <span className={styles.recipeStatusReady}>
                        <svg className={styles.statusIcon + " " + styles.statusIconReady} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Everything Ready
                      </span>
                    ) : (
                      <span className={styles.recipeStatusMissing} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <svg className={styles.statusIcon + " " + styles.statusIconMissing} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Missing {recipe.missingItems || 1} item(s)</span>
                      </span>
                    )}
                  </div>

                  <div className={styles.recipeInfo}>
                    <div className={styles.recipeTime}>
                      <svg className="w-4 h-4" fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      {recipe.estimatedTime} min
                    </div>
                    <span className={styles.recipeDifficulty}>
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

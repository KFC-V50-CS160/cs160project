import type { Route } from "./+types/recipes";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./recipes.styles";
import "./recipes.css";
import { fetchMultipleRecipes, type RecipeCardData } from "../services/recipeApi";
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

// Cache management
const CACHE_KEY = "magicfridge_recipes";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

function readRecipesCache(): Recipe[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    if (parsed.expiry && now > parsed.expiry) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return Array.isArray(parsed.data) ? parsed.data : null;
  } catch (e) {
    console.warn("Failed to read recipes cache:", e);
    return null;
  }
}

function writeRecipesCache(recipes: Recipe[]) {
  if (typeof window === "undefined") return;
  try {
    const cacheData = {
      data: recipes,
      expiry: Date.now() + CACHE_EXPIRY,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Failed to write recipes cache:", e);
  }
}

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

// 从API获取真实菜谱数据
async function fetchRealRecipes(): Promise<Recipe[]> {
  const dishNames = [
    "Chicken Stir Fry", "Vegetable Soup", "Pasta Carbonara", "Fried Rice", "Grilled Salmon",
    "Beef Noodle Soup", "Fish Tacos", "Mushroom Risotto", "Pork Dumplings", "Tofu Curry",
    "Shrimp Tempura", "Chicken Tikka", "Vegetable Curry", "Beef Stew", "Fish and Chips"
  ];
  
  const apiRecipes = await fetchMultipleRecipes(dishNames);
  return apiRecipes.map(convertApiDataToRecipe);
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Recipes - MagicFridge" }];
}

export default function Recipes() {
  const navigate = useNavigate();
  const { getCurrentPlateIngredients } = useInventory();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAttribute, setFilterAttribute] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  
  // Favorites management
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load recipes data from real API
  useEffect(() => {
    const loadRecipes = async () => {
      console.groupCollapsed("[Recipes] Load START");
      setLoading(true);
      setError(null);
      try {
        // Try to load from cache first
        const cached = readRecipesCache();
        if (cached) {
          console.log("[Recipes] Cache HIT. Count:", cached.length);
          setRecipes(cached);
          return;
        }
        console.log("[Recipes] Cache MISS. Fetching from API...");
        const realRecipes = await fetchRealRecipes();
        console.log("[Recipes] API result count:", realRecipes.length);
        setRecipes(realRecipes);
        writeRecipesCache(realRecipes);
      } catch (err) {
        console.error("[Recipes] Load error:", err);
        setError("Failed to load recipes. Please try again.");
        // Fallback
        const fallbackRecipes: Recipe[] = [
          {
            id: "fallback1",
            title: "Fallback Recipe 1",
            status: "ready",
            difficulty: "easy",
            time: "30 min",
            estimatedTime: 30,
            missingItemsCount: 0,
            missingItems: 0,
            ready: true,
            rating: 4.2,
            ratingCount: 156,
            ingredients: ["chicken", "vegetables"],
            description: "A simple and delicious fallback recipe."
          },
          {
            id: "fallback2", 
            title: "Fallback Recipe 2",
            status: "missing",
            difficulty: "medium",
            time: "45 min",
            estimatedTime: 45,
            missingItemsCount: 2,
            missingItems: 2,
            ready: false,
            rating: 4.5,
            ratingCount: 89,
            ingredients: ["beef", "pasta"],
            description: "Another fallback recipe for when API fails."
          }
        ];
        setRecipes(fallbackRecipes);
      } finally {
        setLoading(false);
        console.groupEnd();
      }
    };
    loadRecipes();
  }, []);

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

  // Toggle favorite
  const toggleFavorite = (recipeId: string) => {
    console.log("[Recipes] Toggle favorite:", recipeId);
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
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
                           (filterAttribute === "favorites" && favorites.has(recipe.id)) ||
                           (filterAttribute === recipe.difficulty);
      
      return matchesSearch && matchesFilter;
    });
    const afterFilter = filtered.length;

    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "time":
          return a.estimatedTime - b.estimatedTime;
        case "difficulty":
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    console.log("[Recipes] Filter/sort:", { before, afterFilter, sortBy, filterAttribute, searchTermLen: searchTerm.length });
    return filtered;
  }, [recipes, searchTerm, filterAttribute, sortBy, favorites]);

  const handleRecipeClick = (recipe: Recipe) => {
    if (!recipe?.title) {
      console.warn("[Recipes] Clicked recipe has no title:", recipe);
      return;
    }
    console.log("[Recipes] Navigate to detail:", recipe.title);
    navigate(`/recipes/${encodeURIComponent(recipe.title)}`);
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
    // Clear cache and reload
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
    window.location.reload();
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

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContainer}>
          <div className={styles.errorState}>
            <h3 className={styles.errorTitle}>Oops! Something went wrong</h3>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>
              Try Again
            </button>
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
          
          {/* Generate Recipe Button */}
          <button
            onClick={handleGenerateRecipe}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            title={getCurrentPlateIngredients().length > 0 ? `Generate recipe using: ${getCurrentPlateIngredients().join(', ')}` : 'No ingredients on plate'}
          >
            Generate Recipe {getCurrentPlateIngredients().length > 0 && `(${getCurrentPlateIngredients().length} ingredients)`}
          </button>
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
                      toggleFavorite(recipe.id);
                    }}
                    className={styles.favoriteButton}
                  >
                    <svg 
                      className={favorites.has(recipe.id) ? styles.favoriteIconActive : styles.favoriteIconInactive} 
                      fill={favorites.has(recipe.id) ? "currentColor" : "none"} 
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
                      <span className={styles.recipeStatusMissing}>
                        <svg className={styles.statusIcon + " " + styles.statusIconMissing} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Missing {recipe.missingItems || 1} item(s)
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

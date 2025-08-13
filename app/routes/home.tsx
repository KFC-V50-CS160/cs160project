import type { Route } from "./+types/home";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { styles } from "./home.styles";
import {
  getRecommendedRecipes,
  getCachedSavedRecipes,
  type RecipeCardData,
  getUserDishesFromInventory,
} from "../services/recipeApi";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MagicFridge - Home" },
    { name: "description", content: "Your AI-powered cooking assistant" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [llmQuery, setLlmQuery] = useState("");
  const [showLlmModal, setShowLlmModal] = useState(false);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [currentSavedIndex, setCurrentSavedIndex] = useState(0);
  const [recipeAnimating, setRecipeAnimating] = useState(false);
  const [savedAnimating, setSavedAnimating] = useState(false);

  // Mock data for reminders (with days)
  const reminders = [
    { item: "chicken", days: "2" },
    { item: "broccoli", days: "3" },
    { item: "ginger", days: "4" },
  ];

  // Real API data for recipe recommendations
  const [recommendations, setRecommendations] = useState<RecipeCardData[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeCardData[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock inventory data (later this should come from inventory state)
  const mockInventoryItems = ["chicken", "broccoli", "ginger", "rice", "soy sauce"];

  // Navigation functions for recipes with animation
  const navigateRecipe = (direction: 'prev' | 'next') => {
    if (recipeAnimating) return; // Prevent multiple rapid clicks
    const total = recommendations.length;
    console.log("[Home] Navigate recipe:", direction, "total:", total);

    setRecipeAnimating(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentRecipeIndex((prev) => (prev > 0 ? prev - 1 : Math.max(total - 1, 0)));
      } else {
        setCurrentRecipeIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
      }
      setTimeout(() => setRecipeAnimating(false), 150); // Short delay for fade in
    }, 150); // Fade out duration
  };

  const navigateSaved = (direction: 'prev' | 'next') => {
    if (savedAnimating) return; // Prevent multiple rapid clicks
    const total = savedRecipes.length;
    console.log("[Home] Navigate saved:", direction, "total:", total);

    setSavedAnimating(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentSavedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(total - 1, 0)));
      } else {
        setCurrentSavedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
      }
      setTimeout(() => setSavedAnimating(false), 150); // Short delay for fade in
    }, 150); // Fade out duration
  };

  // Handle LLM modal
  const handleLlmSubmit = () => {
    if (llmQuery.trim()) {
      console.log("LLM Query:", llmQuery);
      // Here you would typically send the query to your LLM service
      setLlmQuery("");
      setShowLlmModal(false);
    }
  };

  const handleReminderClick = () => {
    console.log("[Home] Navigate to /inventory");
    navigate('/inventory');
  };

  const reloadingRef = useRef(false);        // 防止并发重复加载
  const lastReloadAtRef = useRef(0);         // 最小间隔控制
  const MIN_RELOAD_INTERVAL = 1200;          // ms

  // 统一重载：按组合键从本地或网络获取推荐/已保存卡片（唯一入口）
  const reloadByComboCache = async () => {
    reloadingRef.current = true;
    try {
      console.groupCollapsed("[Home] reloadByComboCache");
      const dishes = getUserDishesFromInventory();
      console.log("current dishes", dishes);

      // 无论是否已有数据，进入 reload 时都显示加载态（你偏好可见的刷新反馈）
      setRecipesLoading(true);

      const [recs, saved] = await Promise.all([
        getRecommendedRecipes([], false),
        getCachedSavedRecipes()
      ]);
      setRecommendations(recs);
      setSavedRecipes(saved);
      setCurrentRecipeIndex(0);
      setCurrentSavedIndex(0);

      console.log("[Home] loaded", { recs: recs.length, saved: saved.length });
    } catch (e) {
      console.error("[Home] reloadByComboCache failed", e);
    } finally {
      setRecipesLoading(false);
      lastReloadAtRef.current = Date.now();
      reloadingRef.current = false;
      console.groupEnd();
    }
  };

  // 带最小间隔的触发器
  const requestReload = () => {
    if (reloadingRef.current) return;
    const now = Date.now();
    if (now - lastReloadAtRef.current < MIN_RELOAD_INTERVAL) return;
    void reloadByComboCache();
  };

  // 单一入口：首屏 + 路由变化 + 窗口焦点/历史返回，均通过 reload（本地命中则不走网）
  useEffect(() => {
    if (location.pathname === "/") {
      console.log("[Home] path change -> requestReload");
      requestReload();
    }

    const onFocus = () => {
      console.log("[Home] window focus -> requestReload");
      requestReload();
    };
    const onPopState = () => {
      console.log("[Home] popstate -> requestReload");
      requestReload();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("popstate", onPopState);
    };
  }, [location.pathname]);

  // 刷新推荐菜谱按钮：直接触发 reload，并显示刷新中的按钮态
  const handleRefreshRecipes = async () => {
    if (reloadingRef.current || refreshing) return;
    setRefreshing(true);
    try {
      await reloadByComboCache(); // 忽略最小间隔，用户主动刷新
    } finally {
      setRefreshing(false);
    }
  };

  // —— 图片缓存工具，与 RecipeDetail 保持一致 —— 
  const makeHeroKey = (recipeName: string) => `recipeHero:${encodeURIComponent(recipeName)}`;
  const readHero = (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const url = typeof parsed?.url === "string" ? parsed.url : null;
      if (url) {
        console.info("[Home] hero cache hit", { key });
        return url;
      }
      return null;
    } catch (e) {
      console.warn("[Home] hero cache read error", e);
      return null;
    }
  };
  const writeHero = (key: string, url: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ t: Date.now(), url }));
      console.info("[Home] hero cache saved", { key });
    } catch (e) {
      console.warn("[Home] hero cache write error", e);
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
        console.warn("[Home] hero image: url not found in response");
        return null;
      }
      writeHero(heroKey, url);
      return url;
    } catch (e) {
      console.error("[Home] hero image error", e);
      return null;
    }
  };

  // 为“推荐”补齐图片
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      console.groupCollapsed("[Home] Fill images for recommendations");
      try {
        // 仅处理没有 imageUrl 的项，按顺序请求避免打爆 API
        const updated = await recommendations.reduce<Promise<RecipeCardData[]>>(async (accP, item) => {
          const acc = await accP;
          if (item.imageUrl || !item.title) return [...acc, item];
          const url = await fetchHeroImage(item.title, controller.signal);
          return [...acc, url ? { ...item, imageUrl: url } : item];
        }, Promise.resolve<RecipeCardData[]>([]));

        if (!cancelled) {
          // 仅当有变更时更新，避免无谓重渲染
          const changed = updated.some((it, i) => it.imageUrl && it.imageUrl !== recommendations[i]?.imageUrl);
          if (changed) setRecommendations(updated);
        }
      } finally {
        console.groupEnd();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [recommendations]);

  // 为“已保存”补齐图片
  useEffect(() => {
    if (!savedRecipes || savedRecipes.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      console.groupCollapsed("[Home] Fill images for saved recipes");
      try {
        const updated = await savedRecipes.reduce<Promise<RecipeCardData[]>>(async (accP, item) => {
          const acc = await accP;
          if (item.imageUrl || !item.title) return [...acc, item];
          const url = await fetchHeroImage(item.title, controller.signal);
          return [...acc, url ? { ...item, imageUrl: url } : item];
        }, Promise.resolve<RecipeCardData[]>([]));

        if (!cancelled) {
          const changed = updated.some((it, i) => it.imageUrl && it.imageUrl !== savedRecipes[i]?.imageUrl);
          if (changed) setSavedRecipes(updated);
        }
      } finally {
        console.groupEnd();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [savedRecipes]);

  // 跳转详情：携带与组合键一致的 prefs/dishes
  const mirrorDetailCacheBeforeNavigate = (title: string) => {
    // 简化：由组合键 API 负责写入缓存，这里仅保证参数一致性与日志
    const prefs = "";
    const dishes = getUserDishesFromInventory();
    console.groupCollapsed("[Home] navigate detail intent");
    console.log("params", { dishName: title, prefs, dishes });
    console.groupEnd();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        
        {/* Top Row: LLM Query and Reminders */}
        <div className={styles.topRowGrid}>
          
          {/* LLM Query Section */}
          <div 
            className={styles.llmContainer}
            onClick={() => setShowLlmModal(true)}
          >
            <h2 className={styles.llmTitle}>
              what are we cookin'?
            </h2>
            <p className={styles.llmSubtitle}>
              just ask! 
              <span className={styles.llmPlayButton}>
                <svg className={styles.llmPlayIcon} fill="currentColor" viewBox={styles.svgViewBox}>
                  <path d={styles.svgPathPlay}/>
                </svg>
              </span>
            </p>
          </div>

          {/* Reminders Section */}
          <div 
            className={styles.remindersContainer}
            onClick={handleReminderClick}
          >
            <h2 className={styles.remindersTitle}>reminders</h2>
            <div className={styles.remindersList}>
              {reminders.map((reminder, index) => (
                <div key={index} className={styles.reminderItem}>
                  <div className={styles.reminderDot}></div>
                  <span className={styles.reminderName}>{reminder.item}</span>
                  <span className={styles.reminderDays}>{reminder.days}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Recommendations Section */}
        <div className={styles.recipeSection}>
          <div className={styles.recipeSectionHeader}>
            <h2 className={styles.recipeSectionTitle}>recipes for you</h2>
            <div className={styles.navigationControls}>
              <button
                onClick={handleRefreshRecipes}
                className={`${styles.refreshButton} ${refreshing ? styles.refreshButtonLoading : ''}`}
                disabled={refreshing}
                title="get new recommendations"
              >
                <svg className={`${styles.refreshIcon} ${refreshing ? styles.refreshIconSpinning : ''}`} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                  <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathRefresh} />
                </svg>
              </button>
              <button
                onClick={() => navigateRecipe('prev')}
                className={styles.navButton}
                disabled={recommendations.length <= 1}
              >
                <svg className={styles.navIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                  <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathLeftArrow} />
                </svg>
              </button>
              <button
                onClick={() => navigateRecipe('next')}
                className={styles.navButton}
                disabled={recommendations.length <= 1}
              >
                <svg className={styles.navIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                  <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathRightArrow} />
                </svg>
              </button>
            </div>
          </div>
          
          <div className={styles.recipeDisplayContainer}>
            {recipesLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span className={styles.loadingText}>Loading recipes...</span>
              </div>
            ) : recommendations.length > 0 ? (
              <div 
                className={`${styles.recipeCard} ${recipeAnimating ? styles.recipeCardAnimating : ''}`}
                onClick={() => {
                  const title = recommendations[currentRecipeIndex].title;
                  mirrorDetailCacheBeforeNavigate(title);
                  const prefs = ""; // 与 API 默认一致
                  const dishes = getUserDishesFromInventory(); // 与 API 内部使用一致
                  console.log("[Home] navigate to detail with", { dishName: title, prefs, dishes });
                  navigate(
                    `/recipes/${encodeURIComponent(title)}?prefs=${encodeURIComponent(prefs)}&dishes=${encodeURIComponent(dishes)}`
                  );
                }}
                style={{
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '960px',
                  margin: '0 auto'
                }}
              >
                <div
                  className={styles.recipeImagePlaceholder}
                  style={{
                    width: '100%',
                    position: 'relative',
                    paddingTop: '75%', // 4:3，更高不“瘦”
                    overflow: 'hidden',
                    borderRadius: '12px'
                  }}
                >
                  {recommendations[currentRecipeIndex].imageUrl ? (
                    <img 
                      src={recommendations[currentRecipeIndex].imageUrl} 
                      alt={recommendations[currentRecipeIndex].title}
                      className={styles.recipeImage}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    // 居中占位
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span className={styles.recipeImageText}>Recipe Image</span>
                    </div>
                  )}
                </div>
                <button className={styles.recipeFavoriteButton}>
                  <svg className={styles.recipeFavoriteIcon} fill="currentColor" viewBox={styles.svgViewBox}>
                    <path d={styles.svgPathHeart}/>
                  </svg>
                </button>
                
                <h3 className={styles.recipeTitle}>{recommendations[currentRecipeIndex].title}</h3>
                <p className={recommendations[currentRecipeIndex].ready ? styles.recipeStatusReady : styles.recipeStatusMissing}>
                  {recommendations[currentRecipeIndex].status}
                </p>
                <p className={styles.recipeInfo}>
                  {recommendations[currentRecipeIndex].difficulty} • {recommendations[currentRecipeIndex].time}
                </p>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateText}>No recipes available</span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Recipes Section */}
        <div className={styles.recipeSection}>
          <div className={styles.recipeSectionHeader}>
            <h2 className={styles.recipeSectionTitle}>saved recipes</h2>
            <div className={styles.navigationControls}>
              <button
                onClick={() => navigateSaved('prev')}
                className={styles.navButton}
                disabled={savedRecipes.length <= 1}
              >
                <svg className={styles.navIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                  <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathLeftArrow} />
                </svg>
              </button>
              <button
                onClick={() => navigateSaved('next')}
                className={styles.navButton}
                disabled={savedRecipes.length <= 1}
              >
                <svg className={styles.navIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                  <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth} d={styles.svgPathRightArrow} />
                </svg>
              </button>
            </div>
          </div>
          
          <div className={styles.recipeDisplayContainer}>
            {recipesLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span className={styles.loadingText}>Loading saved recipes...</span>
              </div>
            ) : savedRecipes.length > 0 ? (
              <div 
                className={`${styles.savedRecipeCard} ${savedAnimating ? styles.savedRecipeCardAnimating : ''}`}
                onClick={() => {
                  const title = savedRecipes[currentSavedIndex].title;
                  mirrorDetailCacheBeforeNavigate(title);
                  const prefs = ""; // 与 API 默认一致
                  const dishes = getUserDishesFromInventory(); // 与 API 内部使用一致
                  console.log("[Home] navigate to detail with", { dishName: title, prefs, dishes });
                  navigate(
                    `/recipes/${encodeURIComponent(title)}?prefs=${encodeURIComponent(prefs)}&dishes=${encodeURIComponent(dishes)}`
                  );
                }}
                style={{
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '960px',
                  margin: '0 auto'
                }}
              >
                <div
                  className={styles.savedRecipeImagePlaceholder}
                  style={{
                    width: '100%',
                    position: 'relative',
                    paddingTop: '75%', // 4:3，更高不“瘦”
                    overflow: 'hidden',
                    borderRadius: '12px'
                  }}
                >
                  {savedRecipes[currentSavedIndex].imageUrl ? (
                    <img 
                      src={savedRecipes[currentSavedIndex].imageUrl} 
                      alt={savedRecipes[currentSavedIndex].title}
                      className={styles.savedRecipeImage}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span className={styles.savedRecipeImageText}>Saved Recipe</span>
                    </div>
                  )}
                </div>
                <button className={styles.savedRecipeFavoriteButton}>
                  <svg className={styles.savedRecipeFavoriteIcon} fill="currentColor" viewBox={styles.svgViewBox}>
                    <path d={styles.svgPathHeart}/>
                  </svg>
                </button>
                
                <h3 className={styles.savedRecipeTitle}>{savedRecipes[currentSavedIndex].title}</h3>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateText}>No saved recipes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LLM Query Modal */}
      {showLlmModal && (
        <div 
          className={styles.llmModalOverlay}
          onClick={() => setShowLlmModal(false)}
        >
          <div 
            className={styles.llmModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.llmModalTitle}>What are we cookin' today?</h3>
            <div className={styles.llmModalInputContainer}>
              <input
                type="text"
                value={llmQuery}
                onChange={(e) => setLlmQuery(e.target.value)}
                placeholder="Ask me anything about cooking..."
                className={styles.llmModalInput}
                autoFocus
              />
              <div className={styles.llmModalButtonContainer}>
                <button 
                  onClick={() => setShowLlmModal(false)}
                  className={styles.llmModalCancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLlmSubmit}
                  className={styles.llmModalButton}
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

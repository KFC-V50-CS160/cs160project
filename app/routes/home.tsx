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
import { useInventory } from "../services/inventoryContext"; // 新增：读取库存加载状态

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "MagicFridge - Home" },
    { name: "description", content: "Your AI-powered cooking assistant" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loaded } = useInventory(); // 新增
  const [llmQuery, setLlmQuery] = useState("");
  const [showLlmModal, setShowLlmModal] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [currentSavedIndex, setCurrentSavedIndex] = useState(0);
  const [recipeAnimating, setRecipeAnimating] = useState(false);
  const [savedAnimating, setSavedAnimating] = useState(false);

  // Get real inventory data for reminders
  const { inventoryItems } = useInventory();

  // Filter items that are near expiring and create reminders
  const reminders = inventoryItems
    .filter(item => item.status === "near-expiring")
    .map(item => ({
      item: item.name,
      days: item.expiresIn.replace(/\s*days?/i, '').replace(/\s*day/i, '') || '1'
    }))
    .slice(0, 3); // Show max 3 reminders

  // Get all near-expiring items for the reminder modal (up to 10 items)
  const allExpiringItems = inventoryItems
    .filter(item => item.status === "near-expiring")
    .map(item => ({
      name: item.name,
      daysLeft: item.expiresIn.replace(/\s*days?/i, '').replace(/\s*day/i, '') || '1',
      count: item.count || 1,
      category: item.category
    }))
    .slice(0, 10); // Show up to 10 items in modal

  // Real API data for recipe recommendations
  const [recommendations, setRecommendations] = useState<RecipeCardData[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeCardData[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);



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

  // Handle AI Assistant API call
  const handleLlmSubmit = async () => {
    if (!llmQuery.trim()) return;
    
    setAiLoading(true);
    setAiResponse("");
    
    try {
      console.log("[Home] AI Query:", llmQuery);
      
      const response = await fetch('https://noggin.rea.gent/square-hamster-3060', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer rg_v1_2n7irt6igmzjsbbhtosxmah9m7ud311qp89j_ngk',
        },
        body: JSON.stringify({
          question: llmQuery,
        }),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`);
      }
      
      setAiResponse(responseText);
      console.log("[Home] AI Response:", responseText);
      
    } catch (error) {
      console.error("[Home] AI API failed:", error);
      setAiResponse("Sorry, I'm having trouble connecting right now. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleReminderClick = () => {
    console.log("[Home] Open reminder modal");
    setShowReminderModal(true);
  };

  const handleCloseReminderModal = () => {
    setShowReminderModal(false);
  };

  const handleGoToFridge = () => {
    console.log("[Home] Navigate to /inventory from reminder modal");
    setShowReminderModal(false);
    navigate('/inventory');
  };

  // Close modal and reset states
  const handleCloseModal = () => {
    setShowLlmModal(false);
    setLlmQuery("");
    setAiResponse("");
    setAiLoading(false);
  };

  // Start a new conversation
  const handleNewConversation = () => {
    setLlmQuery("");
    setAiResponse("");
    setAiLoading(false);
  };

  // Enhanced markdown parser for AI responses
  const renderMarkdownResponse = (text: string) => {
    if (!text) return null;
    
    // Split text into lines to handle line breaks and blocks properly
    const lines = text.split('\n');
    const elements: (string | React.ReactElement)[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockStartIndex = 0;
    
    lines.forEach((line, lineIndex) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeBlockContent = [];
          codeBlockStartIndex = lineIndex;
          return;
        } else {
          // End of code block
          inCodeBlock = false;
          if (elements.length > 0) {
            elements.push(<br key={`br-before-code-${lineIndex}`} />);
          }
          elements.push(
            <pre key={`codeblock-${codeBlockStartIndex}`} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 my-2 overflow-x-auto">
              <code className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          return;
        }
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }
      
      // Handle list items
      if (line.trim().startsWith('- ')) {
        if (lineIndex > 0) {
          elements.push(<br key={`br-${lineIndex}`} />);
        }
        const listContent = line.trim().substring(2); // Remove "- "
        const processedListContent = parseInlineMarkdown(listContent, lineIndex);
        elements.push(
          <div key={`list-${lineIndex}`} className="flex items-start gap-2 my-1">
            <span className="text-gray-600 dark:text-gray-400 mt-0.5">•</span>
            <span>{processedListContent}</span>
          </div>
        );
        return;
      }
      
      // Handle regular lines
      if (lineIndex > 0 && !line.trim().startsWith('- ')) {
        elements.push(<br key={`br-${lineIndex}`} />);
      }
      
      // Parse inline markdown for regular lines
      const processedLine = parseInlineMarkdown(line, lineIndex);
      if (Array.isArray(processedLine) && processedLine.length > 0) {
        elements.push(...processedLine);
      } else if (line.trim()) {
        elements.push(line);
      }
    });
    
    return elements.length > 0 ? elements : text;
  };

  // Helper function to parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text: string, lineIndex: number) => {
    const lineElements: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    
    // Combined regex for inline markdown patterns
    const combinedRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let match;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        lineElements.push(text.substring(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Bold text: **text**
        lineElements.push(
          <strong key={`bold-${lineIndex}-${match.index}`} className="font-bold">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // Italic text: *text*
        lineElements.push(
          <em key={`italic-${lineIndex}-${match.index}`} className="italic">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        // Code text: `code`
        lineElements.push(
          <code key={`code-${lineIndex}-${match.index}`} className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-sm font-mono">
            {match[6]}
          </code>
        );
      } else if (match[7]) {
        // Links: [text](url)
        const linkText = match[8];
        const linkUrl = match[9];
        lineElements.push(
          <button
            key={`link-${lineIndex}-${match.index}`}
            onClick={() => {
              console.log("[Home] AI link click:", linkUrl);
              navigate(linkUrl);
              handleCloseModal();
            }}
            className="text-blue-500 hover:text-blue-700 underline bg-transparent border-none cursor-pointer font-medium"
          >
            {linkText}
          </button>
        );
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
    
    // Add remaining text in the line
    if (lastIndex < text.length) {
      lineElements.push(text.substring(lastIndex));
    }
    
    return lineElements.length > 0 ? lineElements : text;
  };

  const reloadingRef = useRef(false);
  const lastReloadAtRef = useRef(0);
  const MIN_RELOAD_INTERVAL = 1200;

  const reloadByComboCache = async () => {
    reloadingRef.current = true;
    try {
      console.groupCollapsed("[Home] reloadByComboCache");
      const dishes = getUserDishesFromInventory();
      console.log("current dishes", dishes);
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

  const requestReload = () => {
    if (!loaded) {
      console.log("[Home] inventory not loaded yet, skip reload");
      return;
    }
    if (reloadingRef.current) return;
    const now = Date.now();
    if (now - lastReloadAtRef.current < MIN_RELOAD_INTERVAL) return;
    void reloadByComboCache();
  };

  // 首屏 + 路由变化 + 历史返回：仅在 inventory 已加载后才触发 reload（移除 window focus 触发）
  useEffect(() => {
    if (location.pathname === "/" && loaded) {
      console.log("[Home] path change -> requestReload (inventory loaded)");
      requestReload();
    }

    const onPopState = () => {
      if (!loaded) {
        console.log("[Home] popstate -> inventory not loaded, skip");
        return;
      }
      console.log("[Home] popstate -> requestReload");
      requestReload();
    };

    // 移除: window.addEventListener("focus", onFocus)
    window.addEventListener("popstate", onPopState);
    return () => {
      // 移除: window.removeEventListener("focus", onFocus)
      window.removeEventListener("popstate", onPopState);
    };
  }, [location.pathname, loaded]);

  // 刷新按钮：未 loaded 前禁用；loaded 后忽略最小间隔直接执行
  const handleRefreshRecipes = async () => {
    if (!loaded || reloadingRef.current || refreshing) return;
    setRefreshing(true);
    try {
      await reloadByComboCache();
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
            style={{ position: 'relative' }}
          >
            <h2 className={styles.llmTitle}>
              what are we cookin'?
            </h2>
            <p className={styles.llmSubtitle} style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              just ask!
            </p>
            <span className={styles.llmPlayButton} style={{ 
              position: 'absolute', 
              bottom: '16px', 
              right: '16px',
              width: '32px',
              height: '32px'
            }}>
              <svg className={styles.llmPlayIcon} fill="currentColor" viewBox={styles.svgViewBox} style={{ width: '16px', height: '16px' }}>
                <path d={styles.svgPathPlay} />
              </svg>
            </span>
          </div>

          {/* Reminders Section */}
          <div
            className={styles.remindersContainer}
            onClick={handleReminderClick}
          >
            <h2 className={styles.remindersTitle}>reminders</h2>
            <div className={styles.remindersList}>
              {reminders.length > 0 ? (
                reminders.map((reminder, index) => (
                  <div key={index} className={styles.reminderItem}>
                    <div className={styles.reminderDot}></div>
                    <span className={styles.reminderName}>{reminder.item}</span>
                    <span className={styles.reminderDays}>{reminder.days}d</span>
                  </div>
                ))
              ) : (
                <div className={styles.reminderItem}>
                  <div className={styles.reminderDot}></div>
                  <span className={styles.reminderName}>All items fresh!</span>
                  <span className={styles.reminderDays}>✓</span>
                </div>
              )}
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
                    paddingTop: '75%' // 4:3，更高不“瘦”
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
                    <path d={styles.svgPathHeart} />
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
                    paddingTop: '75%' // 4:3，更高不“瘦”
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
                    <path d={styles.svgPathHeart} />
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

      {/* AI Assistant Modal */}
      {showLlmModal && (
        <div
          className={styles.llmModalOverlay}
          onClick={handleCloseModal}
        >
          <div
            className={styles.llmModalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: aiResponse ? '600px' : '400px', maxHeight: '80vh', overflow: 'auto' }}
          >
            <h3 className={styles.llmModalTitle}>🍳 AI Cooking Assistant</h3>
            
            {!aiResponse && !aiLoading && (
              <div className={styles.llmModalInputContainer}>
                <input
                  type="text"
                  value={llmQuery}
                  onChange={(e) => setLlmQuery(e.target.value)}
                  placeholder="Ask me anything about cooking..."
                  className={styles.llmModalInput}
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleLlmSubmit()}
                />
                <div className={styles.llmModalButtonContainer}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.llmModalCancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLlmSubmit}
                    className={styles.llmModalButton}
                    disabled={!llmQuery.trim()}
                  >
                    Ask
                  </button>
                </div>
              </div>
            )}

            {aiLoading && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-600 dark:text-gray-300">Thinking...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">"{llmQuery}"</p>
              </div>
            )}

            {aiResponse && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Your question:</p>
                  <p className="text-gray-800 dark:text-white">{llmQuery}</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">AI Assistant:</p>
                  <div className="text-gray-800 dark:text-white whitespace-pre-wrap leading-relaxed">
                    {renderMarkdownResponse(aiResponse)}
                  </div>
                </div>

                <div className={styles.llmModalButtonContainer}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.llmModalCancelButton}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleNewConversation}
                    className={styles.llmModalButton}
                  >
                    Ask Another Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div
          className={styles.llmModalOverlay}
          onClick={handleCloseReminderModal}
        >
          <div
            className={styles.llmModalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', maxHeight: '70vh', overflow: 'auto' }}
          >
            <h3 className={styles.llmModalTitle}>🕒 Expiring Soon</h3>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                These items in your fridge are expiring soon. Consider using them in your next meal!
              </p>
              
              {allExpiringItems.length > 0 ? (
                <div className="space-y-3">
                  {allExpiringItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {item.count} {item.count === 1 ? 'item' : 'items'} • {item.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          {item.daysLeft} day{item.daysLeft !== '1' ? 's' : ''} left
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Great! No items are expiring soon.
                  </p>
                </div>
              )}

              <div className={styles.llmModalButtonContainer}>
                <button
                  onClick={handleCloseReminderModal}
                  className={styles.llmModalCancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoToFridge}
                  className={styles.llmModalButton}
                >
                  Go to the Fridge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

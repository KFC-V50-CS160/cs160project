import type { Route } from "./+types/home";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { styles } from "./home.styles";
import { getRecommendedRecipes, getCachedSavedRecipes, type RecipeCardData, clearStoredRecipes } from "../services/recipeApi";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MagicFridge - Home" },
    { name: "description", content: "Your AI-powered cooking assistant" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
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
    
    setRecipeAnimating(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentRecipeIndex((prev) => 
          prev > 0 ? prev - 1 : recommendations.length - 1
        );
      } else {
        setCurrentRecipeIndex((prev) => 
          prev < recommendations.length - 1 ? prev + 1 : 0
        );
      }
      setTimeout(() => setRecipeAnimating(false), 150); // Short delay for fade in
    }, 150); // Fade out duration
  };

  const navigateSaved = (direction: 'prev' | 'next') => {
    if (savedAnimating) return; // Prevent multiple rapid clicks
    
    setSavedAnimating(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentSavedIndex((prev) => 
          prev > 0 ? prev - 1 : savedRecipes.length - 1
        );
      } else {
        setCurrentSavedIndex((prev) => 
          prev < savedRecipes.length - 1 ? prev + 1 : 0
        );
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
    navigate('/inventory');
  };

  // 刷新推荐菜谱
  const handleRefreshRecipes = async () => {
    if (refreshing) return; // 防止重复点击
    
    setRefreshing(true);
    try {
      // 强制刷新推荐菜谱
      const newRecommendations = await getRecommendedRecipes(mockInventoryItems, true);
      setRecommendations(newRecommendations);
      
      // 重置当前索引，如果新数据少于当前索引
      if (currentRecipeIndex >= newRecommendations.length) {
        setCurrentRecipeIndex(0);
      }
    } catch (error) {
      console.error("Failed to refresh recipes:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // 获取推荐菜谱和已保存菜谱
  useEffect(() => {
    const loadRecipes = async () => {
      console.log("[Home] Loading recipes...");
      setRecipesLoading(true);
      try {
        // 并行获取推荐菜谱和已保存菜谱（都使用缓存）
        const [recommendedData, savedData] = await Promise.all([
          getRecommendedRecipes(mockInventoryItems, false), // 明确传递false，优先使用缓存
          getCachedSavedRecipes() // 使用缓存的已保存菜谱
        ]);
        
        console.log(`[Home] Loaded ${recommendedData.length} recommendations, ${savedData.length} saved recipes`);
        setRecommendations(recommendedData);
        setSavedRecipes(savedData);
      } catch (error) {
        console.error("Failed to load recipes:", error);
        // 使用fallback数据
        setRecommendations([
          { id: "1", title: "fallback recipe 1", status: "ready to go", difficulty: "easy", time: "30 min", missingItemsCount: 0, ready: true },
          { id: "2", title: "fallback recipe 2", status: "missing 1 item(s)", difficulty: "medium", time: "45 min", missingItemsCount: 1, ready: false },
        ]);
        setSavedRecipes([
          { id: "3", title: "Saved Fallback 1", status: "ready to go", difficulty: "easy", time: "20 min", missingItemsCount: 0, ready: true },
          { id: "4", title: "Saved Fallback 2", status: "ready to go", difficulty: "medium", time: "35 min", missingItemsCount: 0, ready: true },
        ]);
      } finally {
        setRecipesLoading(false);
      }
    };

    loadRecipes();
  }, []);

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
                title="获取新菜谱"
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
                onClick={() => navigate(`/recipes/${encodeURIComponent(recommendations[currentRecipeIndex].title)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.recipeImagePlaceholder}>
                  {recommendations[currentRecipeIndex].imageUrl ? (
                    <img 
                      src={recommendations[currentRecipeIndex].imageUrl} 
                      alt={recommendations[currentRecipeIndex].title}
                      className={styles.recipeImage}
                    />
                  ) : (
                    <span className={styles.recipeImageText}>Recipe Image</span>
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
                onClick={() => navigate(`/recipes/${encodeURIComponent(savedRecipes[currentSavedIndex].title)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.savedRecipeImagePlaceholder}>
                  {savedRecipes[currentSavedIndex].imageUrl ? (
                    <img 
                      src={savedRecipes[currentSavedIndex].imageUrl} 
                      alt={savedRecipes[currentSavedIndex].title}
                      className={styles.savedRecipeImage}
                    />
                  ) : (
                    <span className={styles.savedRecipeImageText}>Saved Recipe</span>
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

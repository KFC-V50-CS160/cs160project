// CSS Classes Organization for Recipes Page
export const styles = {
    // Layout & Container Classes
    pageContainer: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-20",
    mainContainer: "max-w-6xl mx-auto space-y-6",
    
    // Header Section
    headerSection: "flex items-center justify-between mb-6",
    backButton: "inline-flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full transition-colors duration-200 cursor-pointer",
    backIcon: "w-4 h-4",
    
    // Search Section (Simplified)
    searchSection: "mb-4",
    searchInputContainer: "relative flex items-center",
    searchIcon: "absolute left-3 w-5 h-5 text-gray-400 dark:text-gray-500",
    searchInput: "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
    
    // Filter Section (Always inline)
    filterSection: "flex gap-4 mb-6",
    filterGroup: "flex-1",
    filterLabel: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
    filterSelect: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
    
    // Recipe Grid
    recipeGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
    
    // Recipe Card Classes
    recipeCard: "bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer overflow-hidden",
    recipeImageContainer: "relative",
    recipeImage: "w-full h-32 object-cover bg-gray-200 dark:bg-gray-700",
    recipeImagePlaceholder: "w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
    recipeImageText: "text-gray-500 dark:text-gray-400 text-sm",
    
    // Recipe Rating & Favorite
    ratingContainer: "absolute top-3 left-3 flex items-center gap-2",
    ratingBadge: "flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full text-sm font-medium",
    ratingText: "text-gray-800 dark:text-white",
    ratingCount: "text-gray-500 dark:text-gray-400 text-xs",
    favoriteButton: "absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200",
    favoriteIcon: "w-5 h-5",
    favoriteIconActive: "w-5 h-5 text-red-500",
    favoriteIconInactive: "w-5 h-5 text-gray-400 dark:text-gray-500",
    
    // Recipe Content (Reduced padding for flatter look)
    recipeContent: "p-3",
    recipeTitle: "text-base font-semibold text-gray-800 dark:text-white mb-1",
    recipeStatus: "text-sm mb-1",
    recipeStatusReady: "text-green-600 dark:text-green-400",
    recipeStatusMissing: "text-orange-600 dark:text-orange-400",
    recipeInfo: "flex items-center justify-between text-sm text-gray-600 dark:text-gray-300",
    recipeTime: "flex items-center gap-1",
    recipeDifficulty: "px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs",
    
    // Status Icons
    statusIcon: "w-3 h-3 mr-1",
    statusIconReady: "text-green-500",
    statusIconMissing: "text-orange-500",
    
    // Loading and Empty States
    loadingContainer: "flex items-center justify-center py-12",
    loadingSpinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500",
    emptyState: "text-center py-12",
    emptyStateIcon: "w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4",
    emptyStateTitle: "text-lg font-medium text-gray-600 dark:text-gray-400 mb-2",
    emptyStateSubtitle: "text-gray-500 dark:text-gray-500",
    
    // Error State
    errorState: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center",
    errorTitle: "text-red-800 dark:text-red-200 font-medium mb-2",
    errorMessage: "text-red-600 dark:text-red-400 text-sm mb-4",
    retryButton: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200",
    
    // SVG Attributes
    svgFill: "none",
    svgStroke: "currentColor",
    svgViewBox: "0 0 24 24",
    svgStrokeLinecap: "round" as const,
    svgStrokeLinejoin: "round" as const,
    svgStrokeWidth: 2,
    
    // SVG Path Data
    svgPathArrowLeft: "M15 19l-7-7m0 0l7-7m-7 7h18",
    svgPathHeart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    svgPathClock: "M12 6v6l4 2",
    svgPathStar: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    svgPathCheck: "M5 13l4 4L19 7",
    svgPathX: "M18 6L6 18M6 6l12 12",
    svgPathSearch: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    svgPathChefHat: "M20 10c0-5.52-4.48-10-10-10S0 4.48 0 10c0 2.21.72 4.25 1.94 5.9L2 20h16l.06-4.1c1.22-1.65 1.94-3.69 1.94-5.9z",
};

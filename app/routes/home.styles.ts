// CSS Classes Organization for Home Page
export const styles = {
    // Layout & Container Classes
    pageContainer: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-20",
    mainContainer: "max-w-md mx-auto space-y-4",
    
    // Mobile Top Row Grid
    topRowGrid: "grid grid-cols-2 gap-3",
    
    // Card Base Classes
    cardBase: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-600",
    
    // LLM Query Section Classes (Mobile Optimized)
    llmContainer: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-200",
    llmTitle: "text-sm font-semibold text-gray-800 dark:text-white mb-2",
    llmSubtitle: "text-xs text-gray-600 dark:text-gray-300 flex items-center",
    llmPlayButton: "inline-flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full ml-2",
    llmPlayIcon: "w-3 h-3 text-white",
    
    // LLM Modal Styles
    llmModalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
    llmModalContent: "w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl border-2 border-gray-200 dark:border-gray-600",
    llmModalTitle: "text-xl font-bold text-gray-800 dark:text-white mb-4 text-center",
    llmModalInputContainer: "flex flex-col gap-4",
    llmModalInput: "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
    llmModalButtonContainer: "flex gap-3",
    llmModalButton: "flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200",
    llmModalCancelButton: "flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200",
    
    // Reminders Section Classes (Mobile Optimized)
    remindersContainer: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500 transition-colors duration-200",
    remindersTitle: "text-sm font-semibold text-gray-800 dark:text-white mb-3",
    remindersList: "space-y-2",
    reminderItem: "flex items-center justify-between",
    reminderDot: "w-2 h-2 bg-red-500 rounded-full mr-2",
    reminderName: "text-xs text-gray-800 dark:text-white font-medium flex-1",
    reminderDays: "text-xs text-gray-500 dark:text-gray-400 font-medium ml-2",
    
    // Recipe Section Base Classes (Mobile Optimized)
    recipeSection: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-gray-200 dark:border-gray-600",
    recipeSectionHeader: "flex justify-between items-center mb-4",
    recipeSectionTitle: "text-lg font-bold text-gray-800 dark:text-white",
    
    // Navigation Controls (Mobile Optimized)
    navigationControls: "flex space-x-2",
    navButton: "p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
    navIcon: "w-4 h-4 text-gray-600 dark:text-gray-300",
    
    // Refresh Button
    refreshButton: "p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mr-2",
    refreshButtonLoading: "bg-blue-400 cursor-not-allowed",
    refreshIcon: "w-4 h-4 transition-transform duration-200",
    refreshIconSpinning: "animate-spin",
    
    // Single Recipe Display Container
    recipeDisplayContainer: "relative min-h-[200px] flex items-center justify-center",
    
    // Recipe Card Classes (Mobile Optimized)
    recipeCard: "w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer",
    recipeCardAnimating: "opacity-50 transform scale-95",
    recipeCardHeader: "flex justify-between items-start mb-3",
    recipeImagePlaceholder: "bg-white dark:bg-gray-600 rounded-lg h-24 w-full flex items-center justify-center mb-3",
    recipeImageText: "text-gray-400 dark:text-gray-500 text-sm",
    recipeFavoriteButton: "p-1 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200",
    recipeFavoriteIcon: "w-4 h-4 text-gray-600 dark:text-gray-300",
    recipeTitle: "text-base font-semibold text-gray-800 dark:text-white mb-2 text-center",
    recipeStatusReady: "text-sm mb-2 text-green-600 dark:text-green-400 text-center",
    recipeStatusMissing: "text-sm mb-2 text-orange-600 dark:text-orange-400 text-center",
    recipeInfo: "text-sm text-gray-600 dark:text-gray-300 text-center",
    
    // Saved Recipe Card Classes (Mobile Optimized)
    savedRecipeCard: "w-full bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer",
    savedRecipeCardAnimating: "opacity-50 transform scale-95",
    savedRecipeCardHeader: "flex justify-between items-start mb-3",
    savedRecipeImagePlaceholder: "bg-white dark:bg-gray-600 rounded-lg h-24 w-full flex items-center justify-center mb-3",
    savedRecipeImageText: "text-gray-400 dark:text-gray-500 text-sm",
    savedRecipeFavoriteButton: "p-1 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200",
    savedRecipeFavoriteIcon: "w-4 h-4 text-gray-600 dark:text-gray-300",
    savedRecipeTitle: "text-base font-semibold text-gray-800 dark:text-white text-center",

    // Recipe Images
    recipeImage: "w-full h-24 object-cover rounded-lg",
    savedRecipeImage: "w-full h-24 object-cover rounded-lg",

    // Loading States
    loadingContainer: "flex flex-col items-center justify-center py-8",
    loadingSpinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2",
    loadingText: "text-sm text-gray-600 dark:text-gray-400",

    // Empty States
    emptyState: "flex items-center justify-center py-8",
    emptyStateText: "text-sm text-gray-500 dark:text-gray-400",
    
    // SVG Attributes
    svgFill: "none",
    svgStroke: "currentColor",
    svgViewBox: "0 0 24 24",
    svgStrokeLinecap: "round" as const,
    svgStrokeLinejoin: "round" as const,
    svgStrokeWidth: 2,
    
    // SVG Path Data
    svgPathLeftArrow: "M15 19l-7-7 7-7",
    svgPathRightArrow: "M9 5l7 7-7 7",
    svgPathHeart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    svgPathPlay: "M8 5v14l11-7z",
    svgPathRefresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

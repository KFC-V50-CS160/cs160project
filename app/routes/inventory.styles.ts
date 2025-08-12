// CSS Classes Organization
export const styles = {
    // Layout & Container Classes
    pageContainer: "min-h-screen bg-cover bg-center bg-no-repeat p-6",
    mainContainer: "max-w-5xl mx-auto pb-24",
    header: "text-center mb-12",
    headerTitle: "text-4xl font-bold text-white mb-3 tracking-tight",
    headerSubtitle: "text-xl text-white/90 font-medium",

    // Fridge Container Classes
    fridgeContainer: "w-1/2 max-w-md mx-auto bg-white/10 dark:bg-gray-800/10 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-600/20 overflow-hidden backdrop-blur-md",
    freezerSection: "bg-white/20 dark:bg-gray-800/20 border-b-2 border-gray-300/20 dark:border-gray-600/20 h-1/2 backdrop-blur-sm",
    freezerHandle: "hidden",
    freezerHandleBar: "hidden",
    freezerInterior: "p-4 pt-6 bg-gradient-to-b from-blue-50/50 to-blue-100/50 dark:from-blue-900/50 dark:to-blue-800/50 h-full cursor-pointer transition-all duration-300 hover:from-blue-100/70 hover:to-blue-200/70 dark:hover:from-blue-800/70 dark:hover:to-blue-700/70 hover:shadow-lg border border-transparent hover:border-blue-300/40 dark:hover:border-blue-500/40 rounded-xl m-2 mt-0 backdrop-blur-md",
    freezerTitle: "text-center mb-3",
    freezerTitleText: "text-sm font-bold text-blue-800 dark:text-blue-200 tracking-wide uppercase",

    // Refrigerator Section Classes
    refrigeratorSection: "bg-white/20 dark:bg-gray-800/20 h-1/2 backdrop-blur-sm",
    refrigeratorHandle: "hidden",
    refrigeratorHandleBar: "hidden",
    refrigeratorInterior: "p-4 pt-6 bg-gradient-to-b from-emerald-50/50 to-emerald-100/50 dark:from-emerald-900/50 dark:to-emerald-800/50 h-full cursor-pointer transition-all duration-300 hover:from-emerald-100/70 hover:to-emerald-200/70 dark:hover:from-emerald-800/70 dark:hover:from-emerald-700/70 hover:shadow-lg border border-transparent hover:border-emerald-300/40 dark:hover:border-emerald-500/40 rounded-xl m-2 mt-0 backdrop-blur-md",
    refrigeratorTitle: "text-center mb-3",
    refrigeratorTitleText: "text-sm font-bold text-emerald-700 dark:text-emerald-300 tracking-wide uppercase",

    // Fridge Base Classes
    fridgeBase: "bg-gray-300 dark:bg-gray-600 h-3",

    // Add Item Button Classes
    addItemContainer: "flex justify-center mt-8",
    addItemButton: "w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer border border-white/20",
    addItemIcon: "w-6 h-6 text-white",

    // Modal Overlay Classes
    modalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md",
    modalContent: "w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/20 shadow-2xl backdrop-blur-lg",
    modalPadding: "p-6",

    // Near Expiring Modal Classes
    nearExpiringModal: "bg-gradient-to-r from-blue-50/70 to-blue-100/70 dark:from-blue-900/60 dark:to-blue-800/60 border-blue-200/60 dark:border-blue-600/60 backdrop-blur-md",
    nearExpiringHeader: "text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2",
    nearExpiringBackButton: "flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200",
    nearExpiringEmptyState: "text-center py-8",
    nearExpiringEmptyIcon: "text-blue-400 dark:text-blue-500 text-4xl mb-2",
    nearExpiringEmptyTitle: "text-blue-600 dark:text-blue-400 font-medium",
    nearExpiringEmptySubtitle: "text-blue-500 dark:text-blue-500 text-sm",
    nearExpiringGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3",

    // Fresh Items Modal Classes
    freshItemsModal: "bg-gradient-to-r from-emerald-50/70 to-emerald-100/70 dark:from-emerald-900/60 dark:to-emerald-800/60 border-emerald-200/60 dark:border-emerald-600/60 backdrop-blur-md",
    freshItemsHeader: "text-xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2",
    freshItemsBackButton: "flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200",
    freshItemsEmptyState: "text-center py-8",
    freshItemsEmptyIcon: "text-emerald-400 dark:text-emerald-500 text-4xl mb-2",
    freshItemsEmptyTitle: "text-emerald-600 dark:text-emerald-400 font-medium",
    freshItemsEmptySubtitle: "text-emerald-500 dark:text-emerald-500 text-sm",
    freshItemsGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3",

    // Item Card Classes
    itemCard: "p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-white/20 dark:bg-gray-700/20 shadow-sm backdrop-blur-sm",
    itemCardSelected: "border-blue-400 dark:border-blue-400 shadow-md",
    itemCardSelectedEmerald: "border-emerald-400 dark:border-emerald-400 shadow-md",
    itemCardUnselected: "border-blue-200/20 dark:border-blue-600/20 hover:border-blue-300/20 dark:hover:border-blue-500/20",
    itemCardUnselectedEmerald: "border-emerald-200/20 dark:border-emerald-600/20 hover:border-emerald-300/20 dark:hover:border-emerald-500/20",
    itemCardFresh: "border-emerald-200/20 dark:border-emerald-600/20 hover:border-emerald-300/20 dark:hover:border-emerald-500/20",
    itemCardFreshSelected: "border-emerald-400 dark:border-emerald-400 shadow-md",

    // Item Content Classes
    itemHeader: "flex items-center justify-between mb-2",
    itemStatus: "flex items-center space-x-1",
    itemStatusDot: "w-2 h-2 rounded-full",
    itemStatusDotRed: "bg-red-500",
    itemStatusDotEmerald: "bg-emerald-500",
    itemName: "font-semibold text-gray-800 dark:text-white text-xs",
    itemSelectedBadge: "text-xs font-medium px-1 py-0.5 rounded-full",
    itemSelectedBadgeBlue: "bg-blue-600 text-white",
    itemSelectedBadgeEmerald: "bg-emerald-600 text-white",

    // Item Details Classes
    itemDetails: "space-y-1",
    itemDetailRow: "flex items-center justify-between text-xs",
    itemDetailLabel: "text-gray-600 dark:text-gray-300",
    itemDetailValue: "font-medium text-gray-800 dark:text-white",
    itemQuantityBadge: "text-xs font-medium px-1 py-0.5 rounded-full",
    itemQuantityBadgeBlue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    itemQuantityBadgeEmerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
    itemExpiryText: "text-emerald-600 dark:text-emerald-400 font-medium",

    // Selected Items Section Classes
    selectedItemsContainer: "mt-4 p-4 bg-blue-50/20 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200/20 dark:border-blue-600/20 backdrop-blur-sm",
    selectedItemsHeader: "text-lg font-semibold text-white mb-2",
    selectedItemsTags: "flex flex-wrap gap-2",
    selectedItemTag: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100/20 dark:bg-blue-800/20 text-blue-800 dark:text-blue-200",
    selectedItemRemoveButton: "ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200",
    selectedItemsActions: "flex space-x-3",
    createDishButton: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200",
    clearAllButton: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200",

    // Add Item Modal Classes
    addItemModal: "bg-white/20 dark:bg-gray-800/20 border-gray-200/20 dark:border-gray-600/20 backdrop-blur-md",
    addItemHeader: "text-xl font-bold text-white flex items-center gap-2",
    addItemModalIcon: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center",
    addItemCloseButton: "flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200",
    addItemDescription: "text-white text-center",
    addItemGrid: "grid grid-cols-2 md:grid-cols-3 gap-4",

    // Add Item Card Classes
    addItemCard: "p-5 bg-white/10 dark:bg-gray-800/10 rounded-xl border border-white/20 dark:border-gray-600/20 hover:border-blue-300/40 dark:hover:border-blue-500/40 transition-all duration-300 backdrop-blur-md hover:shadow-lg hover:scale-[1.02]",
    addItemCardContent: "text-center mb-3",
    addItemCardImage: "mb-2",
    addItemCardName: "font-semibold text-gray-800 dark:text-white text-sm",
    addItemCardDetails: "space-y-2 mb-3",
    addItemCardRow: "flex items-center justify-between text-xs",
    addItemCardLabel: "text-gray-600 dark:text-gray-300",
    addItemCardValue: "font-medium text-gray-800 dark:text-white",
    addItemCardButton: "w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg",

    // Dishes Section Classes
    dishesContainer: "mt-12",
    dishesHeader: "flex items-center justify-between mb-6",
    dishesTitle: "text-2xl font-bold text-white tracking-tight",
    clearAllDishesButton: "px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors duration-200",
    dishesEmptyState: "text-center py-8 bg-gradient-to-r from-yellow-50/20 to-orange-50/20 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200/20 dark:border-yellow-600/20 backdrop-blur-sm",
    dishesEmptyIcon: "w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600",
    dishesEmptyTitle: "text-lg font-medium text-white",
    dishesEmptySubtitle: "text-sm text-white",
    dishesList: "space-y-4",

    // Dish Card Classes
    dishCard: "p-6 bg-gradient-to-r from-yellow-50/30 to-orange-50/30 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl border border-yellow-300/30 dark:border-yellow-500/30 shadow-lg backdrop-blur-md hover:shadow-xl transition-all duration-300",
    dishHeader: "flex items-center justify-between mb-3",
    dishInfo: "flex items-center space-x-3",
    dishIcon: "w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center",
    dishIconSvg: "w-4 h-4 text-white",
    dishTitle: "text-sm font-medium text-white",
    dishActions: "flex items-center space-x-2",
    generateRecipeButton: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200",
    removeDishButton: "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200",
    dishItemsGrid: "grid grid-cols-2 md:grid-cols-4 gap-2",
    dishItemCard: "flex items-center justify-between p-2 bg-white/20 dark:bg-gray-700/20 rounded-lg border border-yellow-300/20 dark:border-yellow-500/20 backdrop-blur-sm",
    dishItemName: "text-sm text-white font-medium",
    dishItemRemoveButton: "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200",

    // Text & Content Classes
    textCenter: "text-center",
    textLarge: "text-lg",
    textMedium: "text-2xl",
    textSmall: "text-xs",
    textGray: "text-gray-600 dark:text-gray-400",
    textBlue: "text-blue-600 dark:text-blue-400",
    textEmerald: "text-emerald-600 dark:text-emerald-400",
    textRed: "text-red-600 dark:text-red-400",
    textWhite: "text-white",
    textGray800: "text-gray-800 dark:text-white",
    textGray600: "text-gray-600 dark:text-gray-300",

    // Interactive Elements
    clickable: "cursor-pointer",
    hoverScale: "hover:scale-110 transition-transform duration-200",
    hoverScaleSmall: "hover:scale-[1.02]",
    transition: "transition-all duration-200",
    transitionColors: "transition-colors duration-200",

    // Spacing & Layout
    marginTop4: "mt-4",
    marginTop8: "mt-8",
    marginBottom2: "mb-2",
    marginBottom3: "mb-3",
    marginBottom4: "mb-4",
    marginBottom6: "mb-6",
    marginBottom8: "mb-8",
    marginTop1: "mt-1",
    marginLeft2: "ml-2",
    spaceY1: "space-y-1",
    spaceY2: "space-y-2",
    spaceY4: "space-y-4",
    padding2: "p-2",
    padding3: "p-3",
    padding4: "p-4",
    padding6: "p-6",
    paddingY2: "py-2",
    paddingY4: "py-4",

    // Grid & Flexbox
    gridCols2: "grid grid-cols-2",
    gridCols2Md3: "grid grid-cols-2 md:grid-cols-3",
    gridCols2Md4: "grid grid-cols-2 md:grid-cols-4",
    gridCols2Md4Lg6: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    flexCenter: "flex items-center justify-center",
    flexBetween: "flex items-center justify-between",
    flexSpaceX3: "flex space-x-3",
    flexWrap: "flex flex-wrap",
    gap2: "gap-2",
    gap3: "gap-3",
    gap4: "gap-4",

    // Icons & Images
    iconTiny: "w-3 h-3",
    iconSmall: "w-4 h-4",
    iconMedium: "w-5 h-5",
    iconLarge: "w-6 h-6",
    iconExtraLarge: "w-8 h-8",
    iconHuge: "w-12 h-12",
    iconMassive: "w-16 h-16",
    imageInline: "inline mr-1",
    imageCentered: "mx-auto",
    imageRounded: "rounded object-cover",

    // SVG Attributes
    svgFill: "none",
    svgStroke: "currentColor",
    svgViewBox: "0 0 24 24",
    svgStrokeLinecap: "round" as const,
    svgStrokeLinejoin: "round" as const,
    svgStrokeWidth1: 1,
    svgStrokeWidth2: 2,

    // SVG Path Data
    svgPathPlus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    svgPathArrowLeft: "M10 19l-7-7m0 0l7-7m-7 7h18",
    svgPathX: "M6 18L18 6M6 6l12 12",
    svgPathShoppingCart: "M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01",
    svgPathTrash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
}; 
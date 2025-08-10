// CSS Classes Organization
export const styles = {
    // Layout & Container Classes
    pageContainer: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4",
    mainContainer: "max-w-4xl mx-auto pb-20",
    header: "text-center mb-8",
    headerTitle: "text-3xl font-bold text-gray-800 dark:text-white mb-2",
    headerSubtitle: "text-lg text-gray-600 dark:text-gray-400",

    // Fridge Container Classes
    fridgeContainer: "w-1/2 max-w-sm mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg shadow-xl border-2 border-gray-400 dark:border-gray-600 overflow-hidden",
    freezerSection: "bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 h-1/2",
    freezerHandle: "flex justify-center pt-2 pb-1",
    freezerHandleBar: "w-16 h-2 bg-gray-400 dark:bg-gray-600 rounded-full",
    freezerInterior: "p-3 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 h-full cursor-pointer transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 hover:shadow-md border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500 rounded-lg m-1",
    freezerTitle: "text-center mb-2",
    freezerTitleText: "text-sm font-semibold text-blue-800 dark:text-blue-200",

    // Refrigerator Section Classes
    refrigeratorSection: "bg-white dark:bg-gray-800 h-1/2",
    refrigeratorHandle: "flex justify-center pt-2 pb-1",
    refrigeratorHandleBar: "w-20 h-2 bg-gray-400 dark:bg-gray-600 rounded-full",
    refrigeratorInterior: "p-3 bg-gradient-to-b from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 h-full cursor-pointer transition-all duration-300 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 hover:shadow-md border-2 border-transparent hover:border-emerald-300 dark:hover:border-emerald-500 rounded-lg m-1",
    refrigeratorTitle: "text-center mb-2",
    refrigeratorTitleText: "text-sm font-semibold text-gray-700 dark:text-gray-300",

    // Fridge Base Classes
    fridgeBase: "bg-gray-300 dark:bg-gray-600 h-3",

    // Add Item Button Classes
    addItemContainer: "flex justify-end mt-4",
    addItemButton: "w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer",
    addItemIcon: "w-6 h-6 text-white",

    // Modal Overlay Classes
    modalOverlay: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
    modalContent: "w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl border-2 shadow-2xl",
    modalPadding: "p-6",

    // Near Expiring Modal Classes
    nearExpiringModal: "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-600",
    nearExpiringHeader: "text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2",
    nearExpiringBackButton: "flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200",
    nearExpiringEmptyState: "text-center py-8",
    nearExpiringEmptyIcon: "text-blue-400 dark:text-blue-500 text-4xl mb-2",
    nearExpiringEmptyTitle: "text-blue-600 dark:text-blue-400 font-medium",
    nearExpiringEmptySubtitle: "text-blue-500 dark:text-blue-500 text-sm",
    nearExpiringGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3",

    // Fresh Items Modal Classes
    freshItemsModal: "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-600",
    freshItemsHeader: "text-xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2",
    freshItemsBackButton: "flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200",
    freshItemsEmptyState: "text-center py-8",
    freshItemsEmptyIcon: "text-emerald-400 dark:text-emerald-500 text-4xl mb-2",
    freshItemsEmptyTitle: "text-emerald-600 dark:text-emerald-400 font-medium",
    freshItemsEmptySubtitle: "text-emerald-500 dark:text-emerald-500 text-sm",
    freshItemsGrid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3",

    // Item Card Classes
    itemCard: "p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] bg-white dark:bg-gray-700 shadow-sm",
    itemCardSelected: "border-blue-400 dark:border-blue-400 shadow-md",
    itemCardSelectedEmerald: "border-emerald-400 dark:border-emerald-400 shadow-md",
    itemCardUnselected: "border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500",
    itemCardUnselectedEmerald: "border-emerald-200 dark:border-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-500",
    itemCardFresh: "border-emerald-200 dark:border-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-500",
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
    itemDetailLabel: "text-gray-600 dark:text-gray-400",
    itemDetailValue: "font-medium text-gray-800 dark:text-white",
    itemQuantityBadge: "text-xs font-medium px-1 py-0.5 rounded-full",
    itemQuantityBadgeBlue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    itemQuantityBadgeEmerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
    itemExpiryText: "text-emerald-600 dark:text-emerald-400 font-medium",

    // Selected Items Section Classes
    selectedItemsContainer: "mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-600",
    selectedItemsHeader: "text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2",
    selectedItemsTags: "flex flex-wrap gap-2",
    selectedItemTag: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
    selectedItemRemoveButton: "ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200",
    selectedItemsActions: "flex space-x-3",
    createDishButton: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200",
    clearAllButton: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200",

    // Add Item Modal Classes
    addItemModal: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600",
    addItemHeader: "text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2",
    addItemModalIcon: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center",
    addItemCloseButton: "flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200",
    addItemDescription: "text-gray-600 dark:text-gray-300 text-center",
    addItemGrid: "grid grid-cols-2 md:grid-cols-3 gap-4",

    // Add Item Card Classes
    addItemCard: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200",
    addItemCardContent: "text-center mb-3",
    addItemCardImage: "mb-2",
    addItemCardName: "font-semibold text-gray-800 dark:text-white text-sm",
    addItemCardDetails: "space-y-2 mb-3",
    addItemCardRow: "flex items-center justify-between text-xs",
    addItemCardLabel: "text-gray-600 dark:text-gray-400",
    addItemCardValue: "font-medium text-gray-800 dark:text-white",
    addItemCardButton: "w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 hover:scale-105",

    // Dishes Section Classes
    dishesContainer: "mt-8",
    dishesHeader: "flex items-center justify-between mb-4",
    dishesTitle: "text-xl font-semibold text-gray-800 dark:text-white",
    clearAllDishesButton: "px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors duration-200",
    dishesEmptyState: "text-center py-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-600",
    dishesEmptyIcon: "w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600",
    dishesEmptyTitle: "text-lg font-medium text-gray-800 dark:text-white",
    dishesEmptySubtitle: "text-sm text-gray-500 dark:text-gray-400",
    dishesList: "space-y-4",

    // Dish Card Classes
    dishCard: "p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-600 shadow-sm",
    dishHeader: "flex items-center justify-between mb-3",
    dishInfo: "flex items-center space-x-3",
    dishIcon: "w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center",
    dishIconSvg: "w-4 h-4 text-white",
    dishTitle: "text-sm font-medium text-gray-600 dark:text-gray-300",
    dishActions: "flex items-center space-x-2",
    generateRecipeButton: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200",
    removeDishButton: "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200",
    dishItemsGrid: "grid grid-cols-2 md:grid-cols-4 gap-2",
    dishItemCard: "flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg border border-yellow-300 dark:border-yellow-500",
    dishItemName: "text-sm text-gray-800 dark:text-white font-medium",
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
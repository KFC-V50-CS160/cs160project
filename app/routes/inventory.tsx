import type { Route } from "./+types/inventory";
import { useState } from "react";

import { styles } from "./inventory.styles";

export function meta({ }: Route.MetaArgs) {
    return [{ title: "Inventory" }];
}

export default function Inventory() {
    const [expandedNearExpiring, setExpandedNearExpiring] = useState(false);
    const [expandedFreshItems, setExpandedFreshItems] = useState(false);
    const [expandedAddItem, setExpandedAddItem] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [dishes, setDishes] = useState<Array<{ id: string, items: string[], createdAt: Date }>>([]);

    // Add inventory state with count property
    const [inventoryItems, setInventoryItems] = useState<Array<{
        name: string;
        category: string;
        expiresIn: string;
        status: string;
        count: number;
    }>>([
        { name: "Chicken Tender Meal", category: "Meat", expiresIn: "1 day", status: "near-expiring", count: 1 }
    ]);

    const handleNearExpiringClick = () => {
        setExpandedNearExpiring(!expandedNearExpiring);
    };

    const handleFreshItemsClick = () => {
        setExpandedFreshItems(!expandedFreshItems);
    };

    const handleAddItemClick = () => {
        setExpandedAddItem(!expandedAddItem);
    };

    const handleItemSelect = (itemName: string) => {
        setSelectedItems(prev => {
            if (prev.includes(itemName)) {
                return prev.filter(name => name !== itemName);
            } else {
                return [...prev, itemName];
            }
        });
    };

    const handleAddToFridge = (itemName: string) => {
        // Check if item already exists
        const existingItemIndex = inventoryItems.findIndex(item => item.name === itemName);

        if (existingItemIndex !== -1) {
            // Item exists, increment count
            setInventoryItems(prev => prev.map((item, index) =>
                index === existingItemIndex
                    ? { ...item, count: item.count + 1 }
                    : item
            ));
            console.log(`Increased count for ${itemName} to ${inventoryItems[existingItemIndex].count + 1}`);
        } else {
            // New item, add to inventory
            const newItem = {
                name: itemName,
                category: getCategoryForItem(itemName),
                expiresIn: getDefaultExpiry(itemName),
                status: "fresh",
                count: 1
            };

            setInventoryItems(prev => [...prev, newItem]);
            console.log(`Added new item ${itemName} to fridge`);
        }
    };

    const handleAddToPlate = () => {
        if (selectedItems.length > 0) {
            const newDish = {
                id: Date.now().toString(),
                items: [...selectedItems],
                createdAt: new Date()
            };
            setDishes(prev => [...prev, newDish]);

            // Remove items from fridge inventory
            setInventoryItems(prev => prev.map(item => {
                if (selectedItems.includes(item.name)) {
                    if (item.count > 1) {
                        // Decrease count if multiple items exist
                        return { ...item, count: item.count - 1 };
                    } else {
                        // Remove item completely if count is 1
                        return null;
                    }
                }
                return item;
            }).filter(Boolean) as typeof inventoryItems);

            setSelectedItems([]);
        }
    };

    const handleRemoveDish = (dishId: string) => {
        setDishes(prev => prev.filter(dish => dish.id !== dishId));
    };

    const handleRemoveItemFromDish = (dishId: string, itemName: string) => {
        setDishes(prev => prev.map(dish =>
            dish.id === dishId
                ? { ...dish, items: dish.items.filter(item => item !== itemName) }
                : dish
        ));
    };

    const handleClearAllDishes = () => {
        setDishes([]);
    };

    const getCategoryForItem = (itemName: string) => {
        const categoryMap: { [key: string]: string } = {
            "Buns": "Bakery",
            "Lettuce": "Vegetables",
            "Chicken": "Meat",
            "Sesame": "Pantry"
        };
        return categoryMap[itemName] || "Other";
    };

    const getDefaultExpiry = (itemName: string) => {
        const expiryMap: { [key: string]: string } = {
            "Buns": "1 week",
            "Lettuce": "1 week",
            "Chicken": "5 days",
            "Sesame": "6 months"
        };
        return expiryMap[itemName] || "1 week";
    };

    const defaultItems = ["Buns", "Lettuce", "Chicken", "Sesame"];

    // Get current counts for display
    const nearExpiringCount = inventoryItems
        .filter(item => item.status === "near-expiring")
        .reduce((total, item) => total + item.count, 0);
    const freshItemsCount = inventoryItems
        .filter(item => item.status === "fresh")
        .reduce((total, item) => total + item.count, 0);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContainer}>

                <div className={styles.header}>
                    <h1 className={styles.headerTitle}>
                        Magic Fridge
                    </h1>
                    <p className={styles.textGray}>
                        Manage your food inventory
                    </p>
                </div>






                <div className={styles.fridgeContainer} style={{ aspectRatio: '1/2' }}>

                    <div className={styles.freezerSection}>

                        <div className={styles.freezerHandle}>
                            <div className={styles.freezerHandleBar}></div>
                        </div>


                        <div
                            className={styles.freezerInterior}
                            onClick={handleNearExpiringClick}
                        >
                            <div className={styles.freezerTitle}>
                                <h3 className={styles.freezerTitleText}>NEAR EXPIRING</h3>
                            </div>


                            {expandedNearExpiring ? (
                                <div className={`${styles.textCenter} ${styles.paddingY2}`}>
                                    <div className={`${styles.textBlue} ${styles.textLarge}`}>
                                        <img src="/kfc.jpg" alt="Near Expiring Items" className={`${styles.iconSmall} ${styles.imageInline}`} /> ({nearExpiringCount})
                                    </div>
                                    <div className={`${styles.textSmall} ${styles.textBlue} ${styles.marginTop1}`}>
                                        Click to see items
                                    </div>
                                </div>
                            ) : (
                                <div className={`${styles.textCenter} ${styles.paddingY4}`}>
                                    <div className={`${styles.textBlue} ${styles.textMedium} ${styles.hoverScale}`}>
                                        <img src="/kfc.jpg" alt="Near Expiring Items" className={`${styles.iconSmall} ${styles.imageInline}`} /> ({nearExpiringCount})
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className={styles.refrigeratorSection}>

                        <div className={styles.refrigeratorHandle}>
                            <div className={styles.refrigeratorHandleBar}></div>
                        </div>


                        <div
                            className={styles.refrigeratorInterior}
                            onClick={handleFreshItemsClick}
                        >
                            <div className={styles.refrigeratorTitle}>
                                <h3 className={styles.refrigeratorTitleText}>FRESH</h3>
                            </div>


                            {expandedFreshItems ? (
                                <div className={`${styles.textCenter} ${styles.paddingY2}`}>
                                    <div className={`${styles.textGray} ${styles.textLarge}`}>
                                        <img src="/kfc.jpg" alt="Fresh Items" className={`${styles.iconSmall} ${styles.imageInline}`} /> ({freshItemsCount})
                                    </div>
                                    <div className={`${styles.textSmall} ${styles.textGray} ${styles.marginTop1}`}>
                                        Click to see items
                                    </div>
                                </div>
                            ) : (
                                <div className={`${styles.textCenter} ${styles.paddingY4}`}>
                                    <div className={`${styles.textGray} ${styles.textMedium} ${styles.hoverScale}`}>
                                        <img src="/kfc.jpg" alt="Fresh Items" className={`${styles.iconSmall} ${styles.imageInline}`} /> ({freshItemsCount})
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className={styles.fridgeBase}></div>
                </div>


                <div className={styles.addItemContainer}>
                    <button
                        onClick={handleAddItemClick}
                        className={styles.addItemButton}
                        title="Add New Item"
                    >
                        <svg className={styles.addItemIcon} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                            <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathPlus} />
                        </svg>
                    </button>
                </div>



                {expandedNearExpiring && (
                    <div className={styles.modalOverlay}>
                        <div className={`${styles.modalContent} ${styles.nearExpiringModal}`}>
                            <div className={styles.modalPadding}>
                                <div className={styles.flexBetween}>
                                    <h3 className={styles.nearExpiringHeader}>
                                        <img src="/kfc.jpg" alt="Near Expiring Items" className={`${styles.iconMedium} ${styles.imageInline}`} /> NEAR EXPIRING ITEMS ({nearExpiringCount})
                                    </h3>
                                    <button
                                        onClick={handleNearExpiringClick}
                                        className={styles.nearExpiringBackButton}
                                    >
                                        <svg className={styles.iconSmall} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                            <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathArrowLeft} />
                                        </svg>
                                        Back
                                    </button>
                                </div>

                                {inventoryItems.filter(item => item.status === "near-expiring").length === 0 ? (
                                    <div className={styles.nearExpiringEmptyState}>
                                        <div className={styles.nearExpiringEmptyIcon}>
                                            <img src="/kfc.jpg" alt="Near Expiring Items" className={`${styles.iconHuge} ${styles.imageCentered}`} />
                                        </div>
                                        <p className={styles.nearExpiringEmptyTitle}>No near-expiring items</p>
                                        <p className={styles.nearExpiringEmptySubtitle}>All your items are fresh!</p>
                                    </div>
                                ) : (
                                    <div className={styles.nearExpiringGrid}>
                                        {inventoryItems
                                            .filter(item => item.status === "near-expiring")
                                            .map((item, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleItemSelect(item.name)}
                                                    className={`${styles.itemCard} ${selectedItems.includes(item.name)
                                                        ? styles.itemCardSelected
                                                        : styles.itemCardUnselected
                                                        }`}
                                                >
                                                    <div className={styles.itemHeader}>
                                                        <div className={styles.itemStatus}>
                                                            <div className={`${styles.itemStatusDot} ${styles.itemStatusDotRed}`}></div>
                                                            <span className={styles.itemName}>{item.name}</span>
                                                        </div>
                                                        {selectedItems.includes(item.name) && (
                                                            <span className={`${styles.itemSelectedBadge} ${styles.itemSelectedBadgeBlue}`}>
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.itemDetails}>
                                                        <div className={styles.itemDetailRow}>
                                                            <span className={styles.itemDetailLabel}>Cat:</span>
                                                            <span className={styles.itemDetailValue}>{item.category}</span>
                                                        </div>

                                                        <div className={styles.itemDetailRow}>
                                                            <span className={styles.itemDetailLabel}>Qty:</span>
                                                            <span className={`${styles.itemQuantityBadge} ${styles.itemQuantityBadgeBlue}`}>
                                                                ×{item.count}
                                                            </span>
                                                        </div>

                                                        <div className={styles.itemDetailRow}>
                                                            <span className={styles.itemDetailLabel}>Exp:</span>
                                                            <span className={`${styles.textRed} ${styles.textSmall}`}>{item.expiresIn}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {expandedFreshItems && (
                    <div className={styles.modalOverlay}>
                        <div className={`${styles.modalContent} ${styles.freshItemsModal}`}>
                            <div className={styles.modalPadding}>
                                <div className={styles.flexBetween}>
                                    <h3 className={styles.freshItemsHeader}>
                                        <img src="/kfc.jpg" alt="Fresh Items" className={`${styles.iconMedium} ${styles.imageInline}`} /> FRESH ITEMS ({freshItemsCount})
                                    </h3>
                                    <button
                                        onClick={handleFreshItemsClick}
                                        className={styles.freshItemsBackButton}
                                    >
                                        <svg className={styles.iconSmall} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                            <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathX} />
                                        </svg>
                                        Back
                                    </button>
                                </div>

                                {inventoryItems.filter(item => item.status === "fresh").length === 0 ? (
                                    <div className={styles.freshItemsEmptyState}>
                                        <div className={styles.freshItemsEmptyIcon}>
                                            <img src="/kfc.jpg" alt="Fresh Items" className={`${styles.iconHuge} ${styles.imageCentered}`} />
                                        </div>
                                        <p className={styles.freshItemsEmptyTitle}>No fresh items</p>
                                        <p className={styles.freshItemsEmptySubtitle}>Add some items to get started!</p>
                                    </div>
                                ) : (
                                    <div className={styles.freshItemsGrid}>
                                        {inventoryItems
                                            .filter(item => item.status === "fresh")
                                            .map((item, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleItemSelect(item.name)}
                                                    className={`${styles.itemCard} ${selectedItems.includes(item.name)
                                                        ? styles.itemCardSelectedEmerald
                                                        : styles.itemCardUnselectedEmerald
                                                        }`}
                                                >
                                                    <div className={`${styles.flexBetween} ${styles.marginBottom2}`}>
                                                        <div className={styles.itemStatus}>
                                                            <div className={`${styles.itemStatusDot} ${styles.itemStatusDotEmerald}`}></div>
                                                            <span className={`${styles.itemName} ${styles.textSmall}`}>{item.name}</span>
                                                        </div>
                                                        {selectedItems.includes(item.name) && (
                                                            <span className={`${styles.itemSelectedBadge} ${styles.itemSelectedBadgeEmerald} ${styles.textSmall}`}>
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.spaceY1}>
                                                        <div className={`${styles.flexBetween} ${styles.textSmall}`}>
                                                            <span className={styles.itemDetailLabel}>Cat:</span>
                                                            <span className={styles.itemDetailValue}>{item.category}</span>
                                                        </div>

                                                        <div className={`${styles.flexBetween} ${styles.textSmall}`}>
                                                            <span className={styles.itemDetailLabel}>Qty:</span>
                                                            <span className={`${styles.itemQuantityBadge} ${styles.itemQuantityBadgeEmerald} ${styles.textSmall}`}>
                                                                ×{item.count}
                                                            </span>
                                                        </div>

                                                        <div className={`${styles.flexBetween} ${styles.textSmall}`}>
                                                            <span className={styles.itemDetailLabel}>Good:</span>
                                                            <span className={`${styles.itemExpiryText} ${styles.textSmall}`}>{item.expiresIn}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {selectedItems.length > 0 && (
                    <div className={styles.selectedItemsContainer}>
                        <div className={styles.flexBetween}>
                            <div>
                                <h3 className={styles.selectedItemsHeader}>
                                    Selected Items ({selectedItems.length})
                                </h3>
                                <div className={`${styles.flexWrap} ${styles.gap2}`}>
                                    {selectedItems.map((itemName) => (
                                        <span
                                            key={itemName}
                                            className={styles.selectedItemTag}
                                        >
                                            {itemName}
                                            <button
                                                onClick={() => handleItemSelect(itemName)}
                                                className={styles.selectedItemRemoveButton}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.flexSpaceX3}>
                                <button
                                    onClick={handleAddToPlate}
                                    className={styles.createDishButton}
                                >
                                    Create New Dish
                                </button>
                                <button
                                    onClick={() => setSelectedItems([])}
                                    className={styles.clearAllButton}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {expandedAddItem && (
                    <div className={styles.modalOverlay}>
                        <div className={`${styles.modalContent} ${styles.addItemModal}`}>
                            <div className={styles.padding6}>
                                <div className={`${styles.flexBetween} ${styles.marginBottom6}`}>
                                    <h3 className={styles.addItemHeader}>
                                        <div className={styles.addItemModalIcon}>
                                            <svg className={`${styles.iconSmall} ${styles.textWhite}`} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                                <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathPlus} />
                                            </svg>
                                        </div>
                                        Add New Item
                                    </h3>
                                    <button
                                        onClick={handleAddItemClick}
                                        className={styles.addItemCloseButton}
                                    >
                                        <svg className={styles.iconSmall} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                            <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathX} />
                                        </svg>
                                        Close
                                    </button>
                                </div>

                                <div className={styles.marginBottom4}>
                                    <p className={`${styles.textGray} ${styles.textCenter}`}>Select items to add to your fridge:</p>
                                </div>

                                <div className={styles.gridCols2Md3}>
                                    {defaultItems.map((item) => {
                                        const existingItem = inventoryItems.find(invItem => invItem.name === item);
                                        const currentCount = existingItem ? existingItem.count : 0;

                                        return (
                                            <div key={item} className={styles.addItemCard}>
                                                <div className={`${styles.textCenter} ${styles.marginBottom3}`}>
                                                    <div className={styles.marginBottom2}>
                                                        <img src="/kfc.jpg" alt={item} className={`${styles.iconExtraLarge} ${styles.imageCentered} ${styles.imageRounded}`} />
                                                    </div>
                                                    <h4 className={`${styles.itemName} ${styles.textSmall}`}>{item}</h4>
                                                </div>

                                                <div className={`${styles.spaceY2} ${styles.marginBottom3}`}>
                                                    <div className={`${styles.flexBetween} ${styles.textSmall}`}>
                                                        <span className={styles.itemDetailLabel}>Current:</span>
                                                        <span className={styles.itemDetailValue}>{currentCount}</span>
                                                    </div>
                                                    <div className={`${styles.flexBetween} ${styles.textSmall}`}>
                                                        <span className={styles.itemDetailLabel}>Category:</span>
                                                        <span className={styles.itemDetailValue}>{getCategoryForItem(item)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleAddToFridge(item)}
                                                    className={styles.addItemCardButton}
                                                >
                                                    {currentCount > 0 ? `Add Another (${currentCount + 1})` : 'Add to Fridge'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                <div className={styles.marginTop8}>
                    <div className={`${styles.flexBetween} ${styles.marginBottom4}`}>
                        <h3 className={styles.dishesTitle}>
                            My Dishes ({dishes.length})
                        </h3>
                        {dishes.length > 0 && (
                            <button
                                onClick={handleClearAllDishes}
                                className={styles.clearAllDishesButton}
                            >
                                Clear All Dishes
                            </button>
                        )}
                    </div>

                    {dishes.length === 0 ? (
                        <div className={styles.dishesEmptyState}>
                            <svg className={`${styles.iconHuge} ${styles.imageCentered} ${styles.marginBottom4} ${styles.textGray}`} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth1} d={styles.svgPathShoppingCart} />
                            </svg>
                            <p className={`${styles.textLarge} ${styles.textGray800}`}>No dishes yet</p>
                            <p className={`${styles.textSmall} ${styles.textGray}`}>Select items and create your first dish</p>
                        </div>
                    ) : (
                        <div className={styles.spaceY4}>
                            {dishes.map((dish, dishIndex) => (
                                <div
                                    key={dish.id}
                                    className={styles.dishCard}
                                >
                                    <div className={`${styles.flexBetween} ${styles.marginBottom3}`}>
                                        <div className={styles.dishInfo}>
                                            <div className={styles.dishIcon}>
                                                <svg className={`${styles.iconSmall} ${styles.textWhite}`} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                                    <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathShoppingCart} />
                                                </svg>
                                            </div>
                                            <span className={styles.dishTitle}>
                                                Dish #{dishIndex + 1} • {dish.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={styles.dishActions}>
                                            <a
                                                href="/recipes"
                                                className={styles.generateRecipeButton}
                                            >
                                                Generate Recipe
                                            </a>
                                            <button
                                                onClick={() => handleRemoveDish(dish.id)}
                                                className={styles.removeDishButton}
                                            >
                                                <svg className={styles.iconMedium} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                                    <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathTrash} />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.gridCols2Md4}>
                                        {dish.items.map((itemName, itemIndex) => (
                                            <div
                                                key={itemIndex}
                                                className={styles.dishItemCard}
                                            >
                                                <span className={`${styles.textSmall} ${styles.textGray800}`}>{itemName}</span>
                                                <button
                                                    onClick={() => handleRemoveItemFromDish(dish.id, itemName)}
                                                    className={`${styles.dishItemRemoveButton} ${styles.marginLeft2}`}
                                                >
                                                    <svg className={styles.iconTiny} fill={styles.svgFill} stroke={styles.svgStroke} viewBox={styles.svgViewBox}>
                                                        <path strokeLinecap={styles.svgStrokeLinecap} strokeLinejoin={styles.svgStrokeLinejoin} strokeWidth={styles.svgStrokeWidth2} d={styles.svgPathX} />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

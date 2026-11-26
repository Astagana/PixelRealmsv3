// www/items.js - Malevolent Luminary Hair
const CUSTOM_ITEMS = {
    "malevolent_luminary_hair": {
        id: "malevolent_luminary_hair",
        name: "Malevolent Luminary Hair",
        category: "Rambut",
        priceType: "gems",
        priceValue: 300, // Harga dalam Gems (bisa disesuaikan)
        stats: {
            attack: 35,
            speed: 15
        },
        description: "Rambut bercahaya magis dengan aura kosmik dan animasi 12 frame.",
        isAnimatedHair: true,
        totalFrames: 12,
        spriteIndex: 0
    }
};

// Fungsi pembantu untuk mengambil daftar semua item kustom
function getAllCustomItems() {
    return Object.values(CUSTOM_ITEMS);
}

// Fungsi pembantu untuk mengambil item berdasarkan ID
function getCustomItemById(id) {
    return CUSTOM_ITEMS[id] || null;
}

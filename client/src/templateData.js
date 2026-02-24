// ── Business Type definitions ──
export const BUSINESS_TYPES = [
    { id: 'restaurants_cafes', emoji: '🍽️' },
    { id: 'beauty_fragrance', emoji: '💄' },
    { id: 'electronics', emoji: '📱' },
    { id: 'pets', emoji: '🐾' },
    { id: 'garden', emoji: '🌿' },
    { id: 'toys_kids', emoji: '🧸' },
    { id: 'fashion_accessories', emoji: '👗' },
    { id: 'other', emoji: '📦' },
];

// ── Category lists per business type ──
export const TEMPLATE_CATEGORIES = {
    restaurants_cafes: [
        'Coffee', 'Hot Drinks', 'Iced Drinks', 'Fresh Juice', 'Soft Drinks', 'Water',
        'Breakfast', 'Appetizers', 'Salads', 'Sandwiches',
        'Burgers (Beef)', 'Burgers (Chicken)', 'Pizza', 'Pasta',
        'Main Dishes', 'Desserts', 'Combo Meals', 'Other',
    ],
    beauty_fragrance: [
        'Skincare', 'Cleansers', 'Moisturizers', 'Serums', 'Sunscreen',
        'Makeup (Face)', 'Makeup (Eyes)', 'Makeup (Lips)',
        'Haircare', 'Shampoo & Conditioner', 'Hair Styling', 'Nail Care',
        'Body Care', 'Deodorant', 'Perfume', 'Oud & Bakhoor',
        'Gift Sets', 'Beauty Tools', 'Other',
    ],
    electronics: [
        'Smartphones', 'Tablets', 'Laptops', 'Desktop PCs', 'Monitors',
        'Headphones', 'Speakers', 'Wearables', 'Gaming', 'Accessories',
        'Chargers & Cables', 'Power Banks', 'Smart Home', 'TVs', 'Cameras', 'Printers', 'Other',
    ],
    pets: [
        'Dog Food', 'Cat Food', 'Treats', 'Toys', 'Grooming',
        'Shampoo & Hygiene', 'Beds & Carriers', 'Bowls & Feeders',
        'Leashes & Collars', 'Litter & Accessories',
        'Health & Supplements', 'Training', 'Aquatics', 'Other',
    ],
    garden: [
        'Plants', 'Seeds', 'Soil & Fertilizers', 'Pots & Planters',
        'Gardening Tools', 'Irrigation', 'Outdoor Decor',
        'Lighting', 'Pest Control', 'Lawn Care', 'Other',
    ],
    toys_kids: [
        'Baby Essentials', 'Diapers & Wipes', 'Feeding', 'Baby Care',
        'Toys', 'Educational', 'Outdoor Play', 'Games & Puzzles',
        'Kids Clothing', 'Shoes', 'School Supplies', 'Other',
    ],
    fashion_accessories: [
        "Men's Clothing", "Women's Clothing", 'Kids Clothing', 'Shoes',
        'Bags', 'Watches', 'Jewelry', 'Sunglasses', 'Accessories', 'Perfume', 'Other',
    ],
    other: [
        'General Items', 'Home', 'Kitchen', 'Personal Care',
        'Accessories', 'Gifts', 'Miscellaneous', 'Other',
    ],
};

// ── Add-on configuration per business type ──
export const TEMPLATE_ADDONS = {
    restaurants_cafes: {
        enabled: true,
        exampleEn: 'Extra Cheese',
        exampleAr: 'جبنة إضافية',
        examplePrice: '+3 QAR',
    },
    beauty_fragrance: {
        enabled: false,
    },
    electronics: {
        enabled: true,
        exampleEn: 'Extended Warranty',
        exampleAr: 'ضمان ممتد',
        examplePrice: '+50 QAR',
    },
    fashion_accessories: {
        enabled: true,
        exampleEn: 'Size XL',
        exampleAr: 'مقاس XL',
        examplePrice: '+0 QAR',
    },
    pets: {
        enabled: true,
        exampleEn: 'Large Size',
        exampleAr: 'حجم كبير',
        examplePrice: '+5 QAR',
    },
    garden: {
        enabled: true,
        exampleEn: 'With Pot',
        exampleAr: 'مع أصيص',
        examplePrice: '+10 QAR',
    },
    toys_kids: {
        enabled: true,
        exampleEn: 'Ages 3-5',
        exampleAr: 'أعمار ٣-٥',
        examplePrice: '+0 QAR',
    },
    other: {
        enabled: true,
        exampleEn: 'Variant A',
        exampleAr: 'النوع أ',
        examplePrice: '+0 QAR',
    },
};

// ── Example placeholder items per business type ──
export const TEMPLATE_EXAMPLES = {
    restaurants_cafes: { nameEn: 'Spanish Latte Hot', nameAr: 'لاتيه إسباني ساخن', descEn: 'Rich espresso with steamed milk and a hint of vanilla', descAr: 'إسبريسو غني مع حليب مبخر ولمسة فانيلا', price: '22' },
    beauty_fragrance: { nameEn: 'Hydrating Face Serum', nameAr: 'سيروم مرطب للوجه', descEn: 'Lightweight serum with hyaluronic acid for all skin types', descAr: 'سيروم خفيف بحمض الهيالورونيك لجميع أنواع البشرة', price: '85' },
    electronics: { nameEn: 'Wireless Earbuds', nameAr: 'سماعات لاسلكية', descEn: 'Bluetooth 5.3 with noise cancellation and 24h battery', descAr: 'بلوتوث ٥.٣ مع عزل الضوضاء وبطارية ٢٤ ساعة', price: '199' },
    fashion_accessories: { nameEn: 'Classic T-Shirt', nameAr: 'تيشيرت كلاسيك', descEn: '100% cotton, relaxed fit, available in S–XL', descAr: 'قطن ١٠٠٪، قصة مريحة، متوفر من S إلى XL', price: '120' },
    pets: { nameEn: 'Dog Food 2kg', nameAr: 'طعام كلاب ٢ كجم', descEn: 'Premium dry food with chicken and rice for adult dogs', descAr: 'طعام جاف فاخر بالدجاج والأرز للكلاب البالغة', price: '45' },
    garden: { nameEn: 'Indoor Plant', nameAr: 'نبتة داخلية', descEn: 'Low-maintenance pothos in a 15 cm ceramic pot', descAr: 'نبتة بوتس سهلة العناية في أصيص سيراميك ١٥ سم', price: '35' },
    toys_kids: { nameEn: 'Educational Puzzle', nameAr: 'بازل تعليمي', descEn: '48-piece wooden puzzle for ages 3+, develops motor skills', descAr: 'بازل خشبي ٤٨ قطعة لعمر ٣+ سنوات، يطور المهارات الحركية', price: '55' },
    other: { nameEn: 'Sample Item', nameAr: 'منتج تجريبي', descEn: 'Brief description of the item', descAr: 'وصف مختصر للمنتج', price: '10' },
};

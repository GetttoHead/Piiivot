/**
 * PIIIVOT Product Catalog Data
 * Brand: PIIIVOT — Built to Compete (Dhaka, Bangladesh)
 */

const PIIIVOT_PRODUCTS = {
  "combat-01-shorts": {
    id: "combat-01-shorts",
    sku: "PVT-CMB-SH01",
    name: "Combat 01 Shorts",
    category: "combat",
    categoryLabel: "Combat Fightwear",
    badge: "First Drop",
    tag: "Combat",
    tagType: "outline",
    price: 1490,
    priceFormatted: "৳ 1,490",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "Minimal fightwear silhouette with full-mobility construction engineered for striking, grappling, and intense mat rounds.",
    story: "Engineered in Dhaka for combat practitioners who value zero-interference performance over flashy gimmicks. The Combat 01 Shorts combine a 4-way stretch micro-weave body with reinforced side-split geometry to ensure unrestricted high kicks and explosive takedowns.",
    features: [
      "Deep split side-seams with bar-tack reinforcement for maximal hip rotation",
      "Silicone-lined inner waistband prevents slip during heavy sparring",
      "Internal flatlock drawstring with zero exterior bulk",
      "Moisture-wicking, fast-drying 180GSM technical poly-spandex",
      "Sublimated tonal PIIIVOT insignia that won't crack or peel"
    ],
    specs: {
      "Fabric Composition": "88% Polyester, 12% Spandex (4-Way Stretch)",
      "Material Weight": "180 GSM Quick-Dry Weave",
      "Inseam Length": "5.5 Inches (Above Knee)",
      "Waistband": "2-Inch Elasticated + Internal Flatcord + Grip Strip",
      "Origin": "Manufactured & Quality Checked in Dhaka, BD",
      "Recommended For": "MMA, Muay Thai, No-Gi BJJ, Wrestling, Conditioning"
    },
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Onyx Black", hex: "#0a0a0a", code: "BLK" },
      { name: "Chalk White", hex: "#f5f4ef", code: "WHT" }
    ],
    sizeGuide: {
      unit: "Inches",
      headers: ["Size", "Waist (In)", "Length (In)", "Inseam (In)", "Weight Rec. (KG)"],
      rows: [
        ["S", "28 - 30", "15.5", "5.5", "55 - 65"],
        ["M", "31 - 33", "16.0", "5.5", "65 - 75"],
        ["L", "34 - 36", "16.5", "5.7", "75 - 85"],
        ["XL", "37 - 39", "17.0", "6.0", "85 - 95"],
        ["2XL", "40 - 42", "17.5", "6.0", "95 - 105"]
      ]
    },
    care: [
      "Machine wash cold (30°C) with similar colors",
      "Hang dry inside out in shade; do NOT tumble dry",
      "Do not bleach or dry clean",
      "Do not iron directly over graphics"
    ],
    views: [
      { id: "front", label: "Front View", tag: "MAIN" },
      { id: "side", label: "Side Split Seam", tag: "MOBILITY" },
      { id: "waist", label: "Grip Waistband", tag: "DETAIL" },
      { id: "rear", label: "Back Silhouette", tag: "BACK" }
    ]
  },

  "training-tee-01": {
    id: "training-tee-01",
    sku: "PVT-APP-TEE01",
    name: "Training Tee 01",
    category: "apparel",
    categoryLabel: "Performance Apparel",
    badge: "New",
    tag: "Apparel",
    tagType: "solid",
    price: 990,
    priceFormatted: "৳ 990",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "Clean jersey-inspired training tee with a relaxed performance fit built from 220 GSM combed compact cotton.",
    story: "Designed to bridge intense strength sessions and off-duty street presence. The Training Tee 01 uses high-density combed cotton with an engineered drop-shoulder pattern that contours the upper torso while draping cleanly at the waist.",
    features: [
      "220 GSM heavyweight combed compact cotton for supreme structure",
      "Reinforced twin-needle collar ribbing that resists stretching",
      "Pre-shrunk treatment minimizing dimensional shift across washes",
      "Subtle matte silicone screen-printed brand mark at chest and spine",
      "Breathable under-arm athletic taper"
    ],
    specs: {
      "Fabric Composition": "100% Combed Compact Cotton",
      "Material Weight": "220 GSM Heavy-Jersey",
      "Fit Profile": "Relaxed Athletic Boxy Fit",
      "Collar": "1.25-Inch Ribbed Crew Neck",
      "Origin": "Knitted & Finished in Dhaka, BD",
      "Recommended For": "Strength Training, Gym, Everyday Wear"
    },
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Stealth Black", hex: "#0e0e0d", code: "BLK" },
      { name: "Bone Raw Paper", hex: "#e9e7df", code: "BNE" },
      { name: "Dark Olive", hex: "#2c2f29", code: "OLV" }
    ],
    sizeGuide: {
      unit: "Inches",
      headers: ["Size", "Chest (In)", "Length (In)", "Shoulder (In)", "Sleeve (In)"],
      rows: [
        ["S", "38 - 40", "27.5", "18.5", "8.5"],
        ["M", "41 - 43", "28.5", "19.5", "9.0"],
        ["L", "44 - 46", "29.5", "20.5", "9.5"],
        ["XL", "47 - 49", "30.5", "21.5", "10.0"],
        ["2XL", "50 - 52", "31.5", "22.5", "10.5"]
      ]
    },
    care: [
      "Wash inside out with cold water",
      "Air dry flat to preserve boxy cut and collar geometry",
      "Warm iron on reverse if desired",
      "Avoid fabric softeners to maintain natural breathability"
    ],
    views: [
      { id: "front", label: "Front Chest", tag: "MAIN" },
      { id: "back", label: "Spine Print", tag: "BACK" },
      { id: "collar", label: "Ribbed Collar", tag: "DETAIL" },
      { id: "fabric", label: "220GSM Weave", tag: "MACRO" }
    ]
  },

  "performance-hand-wraps": {
    id: "performance-hand-wraps",
    sku: "PVT-CMB-WRP01",
    name: "Performance Hand Wraps",
    category: "combat",
    categoryLabel: "Combat Essentials",
    badge: "Essential",
    tag: "Combat",
    tagType: "outline",
    price: 450,
    priceFormatted: "৳ 450",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "180\" Mexican-style semi-elastic cotton-blend training wraps with secure thumb loop and heavy-duty 2\" wrist strap.",
    story: "Wrist and knuckle support is non-negotiable. PIIIVOT Performance Hand Wraps deliver 4.5 meters (180 inches) of custom tension, blending soft breathable cotton with elastic fibers that mold snugly around carpals and metacarpals without cutting off blood circulation.",
    features: [
      "Full 180\" (4.5m) length allows full knuckle padding + wrist stabilization",
      "Mexican-style semi-elastic blend adapts cleanly to hand articulation",
      "Ergonomic starter thumb loop with reinforced inverted seam",
      "Industrial 2-inch hook-and-loop closure ensures locked-in security",
      "Woven rubberized PIIIVOT patch at wrist terminal"
    ],
    specs: {
      "Material": "Cotton / Polyester Semi-Elastic Elasticated Blend",
      "Length": "180 Inches / 4.5 Meters",
      "Width": "2.0 Inches / 5 cm",
      "Closure": "Heavy-Duty 2\" Hook & Loop + Reinforced Thumb Loop",
      "Pair": "Sold as a complete pair (Left + Right)",
      "Recommended For": "Boxing, Muay Thai, Kickboxing, Heavy Bag Work"
    },
    sizes: ["One Size (180\")"],
    colors: [
      { name: "Pitch Black", hex: "#0a0a0a", code: "BLK" },
      { name: "Combat Red", hex: "#991b1b", code: "RED" },
      { name: "Paper Off-White", hex: "#f5f4ef", code: "WHT" }
    ],
    sizeGuide: {
      unit: "Specs",
      headers: ["Specification", "Value", "Standard"],
      rows: [
        ["Total Length", "180 inches (4.5m)", "Pro Competition Spec"],
        ["Band Width", "2.0 inches (5cm)", "Standard Guard"],
        ["Elasticity", "15% Stretch Yield", "Mexican Style Flex"],
        ["Closure Width", "2.0 inches", "Reinforced Grip"]
      ]
    },
    care: [
      "Wash inside a mesh laundry bag to prevent tangling",
      "Machine wash cold; hang dry completely before rolling",
      "Do not bleach or tumble dry"
    ],
    views: [
      { id: "rolled", label: "Rolled Pair", tag: "MAIN" },
      { id: "wrist", label: "Hook & Loop Strap", tag: "LOCK" },
      { id: "thumb", label: "Thumb Loop", tag: "DETAIL" },
      { id: "unrolled", label: "4.5m Span", tag: "FULL" }
    ]
  },

  "training-shorts-01": {
    id: "training-shorts-01",
    sku: "PVT-CMB-SH02",
    name: "Training Shorts 01",
    category: "combat",
    categoryLabel: "Hybrid Performance",
    badge: "Versatile",
    tag: "Combat",
    tagType: "outline",
    price: 1190,
    priceFormatted: "৳ 1,190",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "Lightweight ripstop training shorts designed for striking, grappling, lifting, and conditioning.",
    story: "Built as the do-everything workhorse for athletes who jump straight from pad work to barbell complexes. Engineered with an ultralight stretch ripstop outer and dual stealth zippered pockets that stay completely flush during sparring.",
    features: [
      "Ultralight ripstop shell with water-repellent and sweat-shedding finish",
      "Flush-zippered side pockets that won't catch toes or fingers on the mat",
      "Laser-cut perforated crotch gusset for maximum airflow during high-output rounds",
      "Comfort-stretch waistband with silicone exterior eyelets"
    ],
    specs: {
      "Fabric Composition": "90% Ripstop Nylon, 10% Elastane",
      "Weight": "145 GSM Ultralight Microfiber",
      "Inseam": "6.0 Inches Athletic Length",
      "Pockets": "2x Concealed Auto-Lock Zip Pockets",
      "Origin": "Crafted in Dhaka, BD",
      "Recommended For": "Cross-Training, Mat Work, HIIT, Running"
    },
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Matte Black", hex: "#121212", code: "BLK" },
      { name: "Charcoal Grey", hex: "#383633", code: "CHR" }
    ],
    sizeGuide: {
      unit: "Inches",
      headers: ["Size", "Waist (In)", "Length (In)", "Inseam (In)", "Hip (In)"],
      rows: [
        ["S", "29 - 31", "16.2", "6.0", "38 - 40"],
        ["M", "32 - 34", "16.8", "6.0", "41 - 43"],
        ["L", "35 - 37", "17.4", "6.2", "44 - 46"],
        ["XL", "38 - 40", "18.0", "6.5", "47 - 49"]
      ]
    },
    care: [
      "Machine wash gentle cold",
      "Zip all pockets before washing",
      "Tumble dry low or air dry in shade",
      "Do not iron"
    ],
    views: [
      { id: "front", label: "Front Profile", tag: "MAIN" },
      { id: "pocket", label: "Flush Zipper Pocket", tag: "POCKET" },
      { id: "gusset", label: "Perforated Gusset", tag: "AIRFLOW" },
      { id: "rear", label: "Back Cut", tag: "BACK" }
    ]
  },

  "oversized-tee-01": {
    id: "oversized-tee-01",
    sku: "PVT-APP-TEE02",
    name: "Oversized Tee 01",
    category: "apparel",
    categoryLabel: "Heavyweight Street / Gym",
    badge: "Heavyweight",
    tag: "Apparel",
    tagType: "solid",
    price: 1090,
    priceFormatted: "৳ 1,090",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "Minimal heavyweight silhouette with substantial 260 GSM French Terry structure for training days and off-duty wear.",
    story: "Substantial, architectural, and built to hold its structured silhouette across relentless wear. The Oversized Tee 01 utilizes heavy 260 GSM cotton French Terry with extended sleeve drop and clean raw-look proportions designed around combat aesthetics.",
    features: [
      "260 GSM Heavyweight French Terry Cotton for commanding drape",
      "Extended sleeve drop stopping just at the elbow crook",
      "Thick 32mm rib collar maintains taut geometry without sagging",
      "Blind-stitched sleeve and hem terminals for clean minimalist lines"
    ],
    specs: {
      "Fabric Composition": "100% Combed Cotton French Terry",
      "Material Weight": "260 GSM Premium Structure",
      "Cut": "Architectural Oversized / Drop-Shoulder Fit",
      "Origin": "Knitted, Dyed & Sewn in Dhaka, BD",
      "Recommended For": "Warm-Ups, Post-Fight, Everyday Streetwear"
    },
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Washed Charcoal", hex: "#222120", code: "WCH" },
      { name: "Chalk Off-White", hex: "#f2f0e8", code: "CHK" },
      { name: "Jet Black", hex: "#080808", code: "JBK" }
    ],
    sizeGuide: {
      unit: "Inches",
      headers: ["Size", "Chest Width (In)", "Length (In)", "Shoulder Drop (In)"],
      rows: [
        ["S", "44", "29.0", "22.5"],
        ["M", "47", "30.0", "23.5"],
        ["L", "50", "31.0", "24.5"],
        ["XL", "53", "32.0", "25.5"]
      ]
    },
    care: [
      "Cold gentle machine wash inside-out",
      "Reshape while damp and dry flat",
      "Avoid direct harsh sunlight to preserve dye tone",
      "Do not bleach"
    ],
    views: [
      { id: "front", label: "Boxy Front Drape", tag: "MAIN" },
      { id: "profile", label: "Drop Shoulder Profile", tag: "SILHOUETTE" },
      { id: "collar", label: "32mm Ribbed Collar", tag: "DETAIL" },
      { id: "back", label: "Clean Spine View", tag: "BACK" }
    ]
  },

  "combat-essentials": {
    id: "combat-essentials",
    sku: "PVT-KIT-ESS01",
    name: "Combat Essentials Bundle",
    category: "combat",
    categoryLabel: "Training Kit Drop",
    badge: "Drop Bundle",
    tag: "Bundle",
    tagType: "dashed",
    price: 2450,
    priceFormatted: "৳ 2,450",
    inStock: true,
    leadTime: "Immediate Dispatch · 24h in Dhaka",
    shortDesc: "A curated 3-piece training set featuring Combat 01 Shorts, Training Tee 01, and 180\" Performance Hand Wraps.",
    story: "Everything you need to step on the mats in unified PIIIVOT gear. This bundle includes our top-tier Combat 01 Shorts, a 220 GSM Training Tee, and Mexican-style Hand Wraps at a curated kit price.",
    features: [
      "Complete 3-piece training starter bundle",
      "Includes Combat 01 Shorts (Choice of Size & Color)",
      "Includes Training Tee 01 (Choice of Size & Color)",
      "Includes 180\" Performance Hand Wraps (Pair)",
      "Comes packaged in a heavy-duty reusable PIIIVOT drawstring training bag"
    ],
    specs: {
      "Bundle Contents": "1x Shorts, 1x Performance Tee, 1x Wraps Pair, 1x Gear Bag",
      "Savings": "Save ৳ 480 vs individual item purchase",
      "Origin": "Assembled & Quality Checked in Dhaka, BD",
      "Exchange Policy": "Free size swap on apparel within 7 days in Dhaka"
    },
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Stealth All-Black Kit", hex: "#0a0a0a", code: "BLK" },
      { name: "High-Contrast Dual Kit", hex: "#e9e7df", code: "HCT" }
    ],
    sizeGuide: {
      unit: "Kit Sizing",
      headers: ["Kit Size", "Shorts Size", "Tee Size", "Wraps Spec"],
      rows: [
        ["S Kit", "S (28-30W)", "S (38-40C)", "180\" Standard"],
        ["M Kit", "M (31-33W)", "M (41-43C)", "180\" Standard"],
        ["L Kit", "L (34-36W)", "L (44-46C)", "180\" Standard"],
        ["XL Kit", "XL (37-39W)", "XL (47-49C)", "180\" Standard"],
        ["2XL Kit", "2XL (40-42W)", "2XL (50-52C)", "180\" Standard"]
      ]
    },
    care: [
      "Refer to individual garment care labels included inside package",
      "Wash garments separately before first session"
    ],
    views: [
      { id: "bundle", label: "Full Kit Flat-Lay", tag: "BUNDLE" },
      { id: "shorts", label: "Combat 01 Shorts", tag: "ITEM 1" },
      { id: "tee", label: "Training Tee 01", tag: "ITEM 2" },
      { id: "wraps", label: "180\" Wraps", tag: "ITEM 3" }
    ]
  }
};

// Export for browser script usage
if (typeof window !== 'undefined') {
  window.PIIIVOT_PRODUCTS = PIIIVOT_PRODUCTS;
}

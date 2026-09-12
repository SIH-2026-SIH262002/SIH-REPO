"""
Multilingual dictionary for UI labels + canned alert phrasing, covering
English, Hindi, and the major languages of the eight Northeast Indian
states. A production system would run generated alert text through a
translation API (or professionally pre-approved templates per language);
this dictionary demonstrates the same idea at prototype scale.

Translation confidence varies by language. Bengali, Nepali, Assamese,
Hindi and Nagamese are drafted with high confidence (closely related to
languages with strong training coverage). Bodo, Khasi, Garo, Manipuri
(Meitei), Mizo and Kokborok are best-effort machine-drafted translations
and are listed in NEEDS_NATIVE_REVIEW — because this dictionary feeds
safety-critical alert text (SOS, landslide risk), route these through a
native speaker or professional translator before relying on them in a
real incident.
"""

LANGUAGES = ["en", "hi", "as", "bn", "ne", "nag", "brx", "kha", "grt", "mni", "lus", "trp"]

# Language display names, in their own script, for UI pickers.
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "हिन्दी (Hindi)",
    "as": "অসমীয়া (Assamese)",
    "bn": "বাংলা (Bengali)",
    "ne": "नेपाली (Nepali)",
    "nag": "Nagamese",
    "brx": "बर' (Bodo)",
    "kha": "Khasi",
    "grt": "A·chik (Garo)",
    "mni": "মৈতৈলোন্ (Manipuri)",
    "lus": "Mizo ṭawng",
    "trp": "ককবরক (Kokborok)",
}

# Best-effort machine-drafted languages that should be verified by a
# native speaker before use in a real emergency alert.
NEEDS_NATIVE_REVIEW = ["brx", "kha", "grt", "mni", "lus", "trp"]

STRINGS = {
    "en": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "High landslide risk detected",
        "route_diverted": "Route automatically diverted due to risk",
        "sos_received": "SOS received, help has been notified",
        "all_clear": "Route is now clear",
    },
    "hi": {
        "app_name": "एनईआर लॉजीसेंस",
        "high_risk_alert": "भूस्खलन का उच्च खतरा पाया गया",
        "route_diverted": "जोखिम के कारण मार्ग स्वतः बदला गया",
        "sos_received": "एसओएस प्राप्त हुआ, सहायता को सूचित कर दिया गया है",
        "all_clear": "मार्ग अब सुरक्षित है",
    },
    "as": {
        "app_name": "এনইআৰ লজিছেন্স",
        "high_risk_alert": "মাটি স্খলনৰ উচ্চ বিপদ ধৰা পৰিছে",
        "route_diverted": "বিপদৰ বাবে পথ সলনি কৰা হৈছে",
        "sos_received": "এছঅ'এছ পোৱা গৈছে, সহায় জনোৱা হৈছে",
        "all_clear": "পথ এতিয়া সুৰক্ষিত",
    },
    # --- High-confidence additions ---
    "bn": {
        "app_name": "এনইআর লজিসেন্স",
        "high_risk_alert": "ভূমিধসের উচ্চ ঝুঁকি সনাক্ত হয়েছে",
        "route_diverted": "ঝুঁকির কারণে পথ স্বয়ংক্রিয়ভাবে পরিবর্তন করা হয়েছে",
        "sos_received": "এসওএস পাওয়া গেছে, সাহায্যকে জানানো হয়েছে",
        "all_clear": "পথ এখন নিরাপদ",
    },
    "ne": {
        "app_name": "एनईआर लजिसेन्स",
        "high_risk_alert": "पहिरोको उच्च जोखिम पत्ता लाग्यो",
        "route_diverted": "जोखिमको कारण मार्ग स्वतः परिवर्तन गरियो",
        "sos_received": "एसओएस प्राप्त भयो, सहायतालाई सूचित गरिएको छ",
        "all_clear": "मार्ग अब सुरक्षित छ",
    },
    "nag": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "Landslide laga bisi risk paise",
        "route_diverted": "Risk thaka karone route automatic change hoise",
        "sos_received": "SOS paise, sahayata ke jonai disele",
        "all_clear": "Route etiya safe ase",
    },
    # --- Best-effort, needs native review before real deployment ---
    "brx": {
        "app_name": "एनईआर लजिसेन्स",
        "high_risk_alert": "लेण्डस्लाइडनि गोदान रिस्क मोनदों",
        "route_diverted": "रिस्कनि थाखाय रस्ता ओटोमेटिक सोलिनाय जादों",
        "sos_received": "SOS मोननाय जादों, मदद खौ मोजां खालामदों",
        "all_clear": "रस्ता दानि सुरक्षा",
    },
    "kha": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "Ka jrong bakri ka landslide ka la iohi",
        "route_diverted": "Ka lynti ka la pynsngewthuh ha ka jrong",
        "sos_received": "Ka SOS ka la iohi, ka jingiarap ka la pynkylla",
        "all_clear": "Ka lynti la khreh mynta",
    },
    "grt": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "Landslide-ni bikkron risk gimin",
        "route_diverted": "Risk-ni uju route-ko automatic-o galsingaha",
        "sos_received": "SOS gimin, ra·anirang songjokna",
        "all_clear": "Route-ko da·o songjok",
    },
    "mni": {
        "app_name": "এনইআর লজিসেন্স",
        "high_risk_alert": "লেণ্ডস্লাইদগী অহুম য়াম্না লৈরি",
        "route_diverted": "রিস্কগী মরমদা লম্বী অতোমেটিকনা হোংখ্রে",
        "sos_received": "SOS ফংখ্রে, মতেং পীবা ইঙথোকখ্রে",
        "all_clear": "লম্বী হৌজিক ফজরি",
    },
    "lus": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "Tlang tlu (landslide) hlauhawm tak hmuh a ni",
        "route_diverted": "Hlauhawmna avangin kawng a inthlak mek",
        "sos_received": "SOS chu dawng a ni, ṭanpuina hriattir a ni tawh",
        "all_clear": "Kawng chu a fel tawh",
    },
    "trp": {
        "app_name": "এনইআর লজিসেন্স",
        "high_risk_alert": "লেণ্ডস্লাইডনি বেসিরাম রিস্ক থাংনাই",
        "route_diverted": "রিস্কনি জাগাদাসে বাথরা অটোমেটিক ফেলেংনাই",
        "sos_received": "SOS থাংনাই, মদত খুলুমানি জানাননাই",
        "all_clear": "বাথরা তইলে সেফ",
    },
}

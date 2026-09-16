"""
Multilingual dictionary for NER LogiSense covering the 6 North Eastern regional languages:
  - English (en)
  - Hindi / हिन्दी (hi)
  - Assamese / অসমীয়া (as)
  - Bengali / বাংলা (bn)
  - Manipuri / মৈতৈলোন্ (mn)
  - Mizo / Mizo ṭawng (mz)
"""

from typing import Dict, Any, List

LANGUAGES = ["en", "hi", "as", "bn", "mn", "mz"]

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
    "bn": {
        "app_name": "এনইআর লজিসেন্স",
        "high_risk_alert": "উচ্চ ভূমিধসের ঝুঁকি শনাক্ত হয়েছে",
        "route_diverted": "ঝুঁকির কারণে পথ স্বয়ংক্রিয়ভাবে পরিবর্তন করা হয়েছে",
        "sos_received": "এসওএস গৃহীত হয়েছে, সহায়তা অবহিত করা হয়েছে",
        "all_clear": "পথ এখন সম্পূর্ণ নিরাপদ",
    },
    "mn": {
        "app_name": "এনইআর লোজিজেন্স",
        "high_risk_alert": "চিং কুপ্পগী খুদোংথিবা ৱাংনা থেংনরে",
        "route_diverted": "খুদোংথিবা লৈবনা লম্বী তোঙানবা অমদা ওন্থোক্লে",
        "sos_received": "এসওএস ফংলে, মতেং পীনবা পাউ ফংহল্লে",
        "all_clear": "লম্বী হৌজিক অচুম্বা ওইরে",
    },
    "mz": {
        "app_name": "NER LogiSense",
        "high_risk_alert": "Leimin hlauhawm lutuk hmuh a ni",
        "route_diverted": "Kawng hlauhawm avangin kawng dang zawh a ni",
        "sos_received": "SOS dawn a ni, tanpuina hriattir tawh a ni",
        "all_clear": "Kawng a tluang tawh e",
    },
}

RISK_CATEGORIES = {
    "en": {"SEVERE": "Severe", "HIGH": "High", "MODERATE": "Moderate", "LOW": "Low"},
    "hi": {"SEVERE": "अत्यंत गंभीर", "HIGH": "उच्च", "MODERATE": "मध्यम", "LOW": "निम्न"},
    "as": {"SEVERE": "অতি গুৰুতৰ", "HIGH": "উচ্চ", "MODERATE": "মধ্যমীয়া", "LOW": "নিম্ন"},
    "bn": {"SEVERE": "চরম মারাত্মক", "HIGH": "উচ্চ", "MODERATE": "মাঝারি", "LOW": "স্বল্প"},
    "mn": {"SEVERE": "য়াম্না লুনা", "HIGH": "ৱাংনা", "MODERATE": "ময়াম", "LOW": "নেম্না"},
    "mz": {"SEVERE": "Hlauhawm Lutuk", "HIGH": "Hlauhawm", "MODERATE": "Vanduthei", "LOW": "Hniam"},
}

RISK_IMPACTS = {
    "en": {"CRITICAL": "Critical Impact", "HIGH": "High Impact", "MEDIUM": "Moderate Impact", "LOW": "Low Impact"},
    "hi": {"CRITICAL": "गंभीर प्रभाव", "HIGH": "उच्च प्रभाव", "MEDIUM": "मध्यम प्रभाव", "LOW": "निम्न प्रभाव"},
    "as": {"CRITICAL": "চৰম প্ৰভাৱ", "HIGH": "উচ্চ প্ৰভাৱ", "MEDIUM": "মধ্যমীয়া প্ৰভাৱ", "LOW": "নিম্ন প্ৰভাৱ"},
    "bn": {"CRITICAL": "মারাত্মক প্রভাব", "HIGH": "উচ্চ প্রভাব", "MEDIUM": "মাঝারি প্রভাব", "LOW": "স্বল্প প্রভাব"},
    "mn": {"CRITICAL": "য়াম্না লুবা প্রভাব", "HIGH": "ৱাংবা প্রভাব", "MEDIUM": "ময়াম প্রভাব", "LOW": "নেম্বা প্রভাব"},
    "mz": {"CRITICAL": "Hlauhawm Zual", "HIGH": "Hlauhawm", "MEDIUM": "Nasa Vaklo", "LOW": "Hniam"},
}

FACTOR_LABELS = {
    "en": {
        "soil_moisture_pct": "Soil Moisture Saturation",
        "rainfall_mm_last_72h": "72-Hour Cumulative Rainfall",
        "rainfall_mm_last_24h": "24-Hour Rainfall",
        "vibration_intensity": "Ground Vibration / Seismic Activity",
        "slope_angle_deg": "Topographic Slope Gradient",
        "vegetation_cover_pct": "Vegetation Canopy Cover",
        "distance_to_stream_km": "Distance to Drainage Stream",
        "historical_landslide_count": "Historical Landslide Frequency",
        "elevation_m": "Altitude Above Sea Level",
        "soil_type": "Geological Soil Classification",
    },
    "hi": {
        "soil_moisture_pct": "मृदा नमी संतृप्ति",
        "rainfall_mm_last_72h": "७२ घंटे की संचयी वर्षा",
        "rainfall_mm_last_24h": "२४ घंटे की वर्षा",
        "vibration_intensity": "भू-कंपन एवं भूकंपीय तीव्रता",
        "slope_angle_deg": "भू-भाग ढलान प्रवणता",
        "vegetation_cover_pct": "वनस्पति छतरी आवरण",
        "distance_to_stream_km": "जलधारा से दूरी",
        "historical_landslide_count": "ऐतिहासिक भूस्खलन आवृत्ति",
        "elevation_m": "समुद्र तल से ऊंचाई",
        "soil_type": "भूवैज्ञानिक मृदा वर्गीकरण",
    },
    "as": {
        "soil_moisture_pct": "মাটিৰ আৰ্দ্ৰতা সংপৃক্ততা",
        "rainfall_mm_last_72h": "৭২ ঘণ্টাৰ সঞ্চিত বৰষুণ",
        "rainfall_mm_last_24h": "২৪ ঘণ্টাৰ বৰষুণ",
        "vibration_intensity": "ভূ-কম্পন আৰু কম্পাংক",
        "slope_angle_deg": "ভৌগোলিক ঢাল প্ৰৱণতা",
        "vegetation_cover_pct": "উদ্ভিদ আৱৰণ",
        "distance_to_stream_km": "নৈ বা সুঁতিৰ পৰা দূৰত্ব",
        "historical_landslide_count": "ঐতিহাসিক মাটি স্খলনৰ সংখ্যা",
        "elevation_m": "সমুদ্ৰ পৃষ্ঠৰ পৰা উচ্চতা",
        "soil_type": "ভূতাত্ত্বিক মাটিৰ প্ৰকাৰ",
    },
    "bn": {
        "soil_moisture_pct": "মাটির আর্দ্রতা সম্পৃক্তি",
        "rainfall_mm_last_72h": "৭২ ঘণ্টার পুঞ্জীভূত বৃষ্টিপাত",
        "rainfall_mm_last_24h": "২৪ ঘণ্টার বৃষ্টিপাত",
        "vibration_intensity": "ভূমি কম্পন ও সিসমিক তীব্রতা",
        "slope_angle_deg": "ভূ-প্রাকৃতিক ঢালের প্রবণতা",
        "vegetation_cover_pct": "উদ্ভিদের আচ্ছাদন",
        "distance_to_stream_km": "নদী বা জলপ্রবাহের দূরত্ব",
        "historical_landslide_count": "ঐতিহাসিক ভূমিধসের সংখ্যা",
        "elevation_m": "সমুদ্রপৃষ্ঠ থেকে উচ্চতা",
        "soil_type": "ভূতাত্ত্বিক মাটির শ্রেণিবিভাগ",
    },
    "mn": {
        "soil_moisture_pct": "লৈপাক্কী ঈশিং চাং",
        "rainfall_mm_last_72h": "পুং ৭২ গী নোংগী চাং",
        "rainfall_mm_last_24h": "পুং ২৪ গী নোংগী চাং",
        "vibration_intensity": "লৈবাক নুংশিৎ অমসুং কুপ্পা",
        "slope_angle_deg": "চিংগী অৱাং অহেন চাং",
        "vegetation_cover_pct": "উ-ৱা য়াওবগী চাং",
        "distance_to_stream_km": "তুরেলদগী লাপ্না লৈবা",
        "historical_landslide_count": "মমাংদা চিং কুপ্পগী চাং",
        "elevation_m": "সমুদ্র লেবেলদগী অৱাংবা",
        "soil_type": "লৈপাক্কী মখল",
    },
    "mz": {
        "soil_moisture_pct": "Lei hnawn dan zat",
        "rainfall_mm_last_72h": "Darkar 72 chhung ruahsur zat",
        "rainfall_mm_last_24h": "Darkar 24 chhung ruahsur zat",
        "vibration_intensity": "Leilung nghing zat",
        "slope_angle_deg": "Chhanchhuah awm dan (Slope)",
        "vegetation_cover_pct": "Thing leh hnim awm zat",
        "distance_to_stream_km": "Luite atanga hlat zawng",
        "historical_landslide_count": "Leimin lo thleng tawh zat",
        "elevation_m": "Tuifinriat atanga a san zawng",
        "soil_type": "Lei chi hrang hrang",
    },
}

MESSAGE_TEMPLATES = {
    "en": "XGBoost + LightGBM ensemble evaluated {category} risk (score {score}/100, probability {probability}%).",
    "hi": "एक्सजीबूस्ट + लाइटजीबीएम मॉडल ने {category} जोखिम का मूल्यांकन किया (अंक {score}/100, संभावना {probability}%)।",
    "as": "XGBoost + LightGBM মডেলে {category} বিপদৰ মূল্যায়ন কৰিছে (নম্বৰ {score}/১০০, সম্ভাৱনা {probability}%)।",
    "bn": "XGBoost + LightGBM মডেল {category} ঝুঁকি নির্ণয় করেছে (স্কোর {score}/১০০, সম্ভাবনা {probability}%)।",
    "mn": "XGBoost + LightGBM মডেল অসিনা {category} খুদোংথিবা খঙদোক্লে (স্কোর {score}/১০০, থোক্পগী চাং {probability}%)।",
    "mz": "XGBoost + LightGBM model-in {category} dinhmun a chhut chhuak (score {score}/100, a thlen theihna {probability}%).",
}


def localize_prediction(
    category: str,
    score: float,
    probability: float,
    top_factors: List[Dict[str, str]],
    lang: str = "en",
) -> Dict[str, Any]:
    """Generates localized category, message, and top factor descriptions for the requested language."""
    target_lang = lang.lower().strip() if lang else "en"
    if target_lang not in LANGUAGES:
        target_lang = "en"

    categories_dict = RISK_CATEGORIES.get(target_lang, RISK_CATEGORIES["en"])
    impacts_dict = RISK_IMPACTS.get(target_lang, RISK_IMPACTS["en"])
    factors_dict = FACTOR_LABELS.get(target_lang, FACTOR_LABELS["en"])
    template = MESSAGE_TEMPLATES.get(target_lang, MESSAGE_TEMPLATES["en"])

    localized_category = categories_dict.get(category, category)
    prob_pct = round(probability * 100.0, 1)

    localized_factors = []
    for item in top_factors:
        raw_factor = item.get("factor", "")
        raw_impact = item.get("impact", "")
        localized_factors.append({
            "factor": raw_factor,
            "factor_localized": factors_dict.get(raw_factor, raw_factor),
            "impact": raw_impact,
            "impact_localized": impacts_dict.get(raw_impact, raw_impact),
        })

    localized_message = template.format(
        category=localized_category,
        score=score,
        probability=prob_pct,
    )

    return {
        "language": target_lang,
        "category_localized": localized_category,
        "top_factors_localized": localized_factors,
        "message_localized": localized_message,
    }

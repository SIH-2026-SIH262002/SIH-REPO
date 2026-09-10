package com.ner.logistics.i18n;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class I18nService {

    public List<LanguageDto> getSupportedLanguages() {
        return List.of(
                LanguageDto.builder().code("en").name("English").nativeName("English").defaultLanguage(true).build(),
                LanguageDto.builder().code("as").name("Assamese").nativeName("অসমীয়া").defaultLanguage(false).build(),
                LanguageDto.builder().code("bn").name("Bengali").nativeName("বাংলা").defaultLanguage(false).build(),
                LanguageDto.builder().code("hi").name("Hindi").nativeName("हिन्दी").defaultLanguage(false).build(),
                LanguageDto.builder().code("mn").name("Manipuri").nativeName("ꯃꯤꯇꯩꯂꯣꯟ").defaultLanguage(false).build(),
                LanguageDto.builder().code("mz").name("Mizo").nativeName("Mizo ṭawng").defaultLanguage(false).build()
        );
    }

    public Map<String, String> getTranslations(String langCode) {
        String lang = langCode != null ? langCode.toLowerCase() : "en";

        switch (lang) {
            case "as":
                return Map.of(
                        "app_title", "উত্তৰ-পূব পৰিবহণ আৰু জৰুৰীকালীন নিৰ্দেশনা",
                        "sos_button", "জৰুৰীকালীন এচ-অ-এচ (SOS)",
                        "login_phone", "মোবাইল নম্বৰৰ দ্বাৰা লগইন কৰক",
                        "enter_otp", "৬-অংকৰ অ'টিপি দিয়ক",
                        "send_otp", "অ'টিপি প্ৰেৰণ কৰক",
                        "report_incident", "দুৰ্যোগৰ খবৰ দিয়ক",
                        "landslide_warning", "ভূমিস্খলনৰ সঁহাৰি: বিকল্প পথ ব্যৱহাৰ কৰক।",
                        "risk_level", "আশংকাৰ মাত্ৰা",
                        "reroute_recommendation", "বিকল্প পথৰ পৰামৰ্শ"
                );
            case "bn":
                return Map.of(
                        "app_title", "উত্তর-পূর্ব লজিস্টিক ও জরুরি কমান্ড সেন্টার",
                        "sos_button", "জরুরি এসওএস সিগন্যাল (SOS)",
                        "login_phone", "মোবাইল নম্বর দিয়ে লগইন করুন",
                        "enter_otp", "৬-সংখ্যার ওটিপি দিন",
                        "send_otp", "ওটিপি পাঠান",
                        "report_incident", "দুর্ঘটনার রিপোর্ট করুন",
                        "landslide_warning", "ভূমিধসের সতর্কবার্তা: বিকল্প পথ ব্যবহার করুন।",
                        "risk_level", "ঝুঁকির মাত্রা",
                        "reroute_recommendation", "বিকল্প রুটের পরামর্শ"
                );
            case "hi":
                return Map.of(
                        "app_title", "उत्तर-पूर्व लॉजिस्टिक्स और आपातकालीन कमांड",
                        "sos_button", "आपातकालीन एसओएस सिग्नल (SOS)",
                        "login_phone", "मोबाइल नंबर से लॉगिन करें",
                        "enter_otp", "6-अंकों का ओटीपी दर्ज करें",
                        "send_otp", "ओटीपी भेजें",
                        "report_incident", "घटना की रिपोर्ट करें",
                        "landslide_warning", "भूस्खलन की चेतावनी: वैकल्पिक मार्ग का उपयोग करें।",
                        "risk_level", "जोखिम स्तर",
                        "reroute_recommendation", "वैकल्पिक मार्ग की सिफारिश"
                );
            case "mn":
                return Map.of(
                        "app_title", "ꯑꯋꯥꯡ ꯅꯣꯡꯄꯣꯛ ꯂꯣꯖꯤꯁ꯭ꯇꯤꯛꯁ ꯑꯃꯁꯨꯡ ꯑꯦꯃꯔꯖꯦꯟꯁꯤ ꯀꯃꯥꯟꯗ",
                        "sos_button", "ꯑꯦꯃꯔꯖꯦꯟꯁꯤ ꯑꯦꯁ.ꯑꯣ.ꯑꯦꯁ (SOS)",
                        "login_phone", "ꯃꯣꯕꯥꯏꯜ ꯅꯝꯕꯔꯅꯥ ꯂꯣꯒꯏꯟ ꯇꯧꯕꯤꯌꯨ",
                        "enter_otp", "ꯑꯣ.ꯇꯤ.ꯄꯤ ꯅꯝꯕꯔ ꯏꯕꯤꯌꯨ",
                        "send_otp", "ꯑꯣ.ꯇꯤ.ꯄꯤ ꯊꯥꯕꯤꯌꯨ",
                        "report_incident", "ꯊꯧꯗꯣꯛꯀꯤ ꯔꯤꯄꯣꯔꯠ ꯇꯧꯕꯤꯌꯨ",
                        "landslide_warning", "ꯆꯤꯡꯔꯨꯝ ꯇꯨꯕꯒꯤ ꯑꯀꯤꯕꯥ ꯂꯩ: ꯑꯇꯣꯞꯄꯥ ꯂꯝꯕꯤ ꯁꯤꯖꯤꯟꯅꯕꯤꯌꯨ।",
                        "risk_level", "ꯑꯀꯤꯕꯒꯤ ꯆꯥꯡ",
                        "reroute_recommendation", "ꯑꯇꯣꯞꯄꯥ ꯂꯝꯕꯤꯒꯤ ꯄꯥꯎꯇꯥꯛ"
                );
            case "mz":
                return Map.of(
                        "app_title", "NER Logistics & Emergency Command Sublaukawng",
                        "sos_button", "Kut-hmeh Chhanneihna SOS",
                        "login_phone", "Mobile Number hmangin lut rawh",
                        "enter_otp", "OTP thleng 6 chhuhtlut rawh",
                        "send_otp", "OTP thawn rawh",
                        "report_incident", "Chhiatrupna hriattirna",
                        "landslide_warning", "Tlaichhia hriattirna: Kawng dang hmang rawh.",
                        "risk_level", "Rilru buaina sang",
                        "reroute_recommendation", "Kawng kawhhmuhna thar"
                );
            default: // "en"
                return Map.of(
                        "app_title", "NER Logistics & Emergency Command Surface",
                        "sos_button", "Emergency SOS Signal",
                        "login_phone", "Login with Mobile Number",
                        "enter_otp", "Enter 6-Digit OTP",
                        "send_otp", "Send OTP",
                        "report_incident", "Report Incident",
                        "landslide_warning", "WARNING: Landslide risk detected. Use recommended bypass corridor.",
                        "risk_level", "Risk Level",
                        "reroute_recommendation", "Reroute Recommendation"
                );
        }
    }
}

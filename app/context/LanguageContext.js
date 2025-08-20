import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// Translation data
const translations = {
  en: {
    // Authentication
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    joinEduNepal: "Join elearn Nep today",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    adminLogin: "Admin Login",
    userLogin: "User Login",
    demoCredentials: "Demo Credentials",
    email: "Email",
    password: "Password",
    username: "Username",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    rememberMe: "Remember Me",
    forgotPassword: "Forgot Password?",
    alreadyHaveAccount: "Already have an account? Login",
    
    // Profile
    profile: "Profile",
    personalInformation: "Personal Information",
    accountDetails: "Account Details",
    emailAddress: "Email Address",
    accountRole: "Account Role",
    memberSince: "Member Since",
    location: "Location",
    editProfile: "Edit Profile",
    loadingProfile: "Loading Profile...",
    welcomeToEduNepal: "Welcome to elearn Nep",
    classes: "Classes",
    years: "Years",
    active: "Active",
    
    // Navigation
    home: "Home",
    settings: "Settings",
    language: "Language",
    downloads: "Downloads",
    theme: "Theme",
    helpSupport: "Help & Support",
    helpSupportSubtitle: "Find answers, contact us, and explore helpful resources",
    termsConditions: "Terms & Conditions",
    contactUs: "Contact Us",
    contactSubtitle: "Get in touch with our support team",
    aboutApp: "About App",
    privacyPolicy: "Privacy Policy",
    userGuides: "User Guides",
    accountSecurity: "Account Security",
    adminDashboard: "Admin Dashboard",
    systemNotifications: "System Notifications",
    systemLogs: "System Logs",
    developerTools: "Developer Tools",
    notificationSettings: "Notification Settings",
    languageRegion: "Language & Region",
    regionSettings: "Region Settings",
    privacySettings: "Privacy Settings",
    updatePassword: "Update Password",
    updateEmail: "Update Email",
    deleteAccount: "Delete Account",
    visitWebsite: "Visit Website",
    reportBug: "Report a Bug",
    phoneSupport: "Phone Support",
    officeAddress: "Office Address",
    contactFooter: "We're here to help! Reach out anytime for support, feedback, or questions about elearn Nep.",
    
    // General
    general: "General",
    supportAccount: "Support & Account",
    eduNepal: "elearn Nep",
    optional: "Optional",
    required: "Required Information",
    optionalInformation: "Optional Information",
    comingSoon: "Coming Soon",
    loading: "Loading...",
    quickActions: "Quick Actions",
    faqs: "FAQs",
    resources: "Resources",
    emailSupport: "Email Support",
    callUs: "Call Us",
    contact: "Contact",
    shareApp: "Share App",
    shareAppMessage: "Check out elearn Nep! https://www.elearn.com",
    unableToShareNow: "Unable to share right now.",
    faqResetPasswordQ: "How do I reset my password?",
    faqResetPasswordA: "Go to Settings > Account Security > Change Password to reset your password.",
    faqContactSupportQ: "How can I contact support?",
    faqContactSupportA: "Use Contact Us to email elearnnep@16gmail.com or call +977-9864158297.",
    faqPrivacyQ: "Where can I read the Privacy Policy?",
    faqPrivacyA: "Go to Settings > About > Privacy Policy or tap the Privacy Policy link below.",
    faqDeleteAccountQ: "How do I delete my account?",
    faqDeleteAccountA: "Go to Settings > Account Security > Delete Account and follow the steps.",
    // Generic errors
    error: "Error",
    unableToLoadDownloads: "Unable to load downloads",
    failedToShareFile: "Failed to share file",
    failedToDeleteFile: "Failed to delete file",
    failedToDeleteSomeFiles: "Failed to delete some files",
    failedToClearAll: "Failed to clear all files",
    
    // Class Screen
    class: "Class",
    searchBooksNotes: "Search for books, notes...",
    textbooks: "Textbooks",
    guidebooks: "Guidebooks",
    previousPapers: "Previous Papers",
    practiceQuestions: "Practice Questions",
    cdcApprovedBooks: "CDC-approved books in English & Nepali",
    chapterWiseNotes: "Chapter-wise notes, explanations, and exam",
    lastYearsExams: "Access last 3–5 years' Board/Final exam",
    expectedQuestions: "Expected questions for exams: short, long",
    recentActivity: "Recent Activity"
    ,
    // Notifications
    notifications: "Notifications",
    clearAll: "Clear All",
    noNotificationsYet: "No notifications yet",
    markAsRead: "Mark as Read",
    markAsUnread: "Mark as Unread",
    markAllAsRead: "Mark All as Read",
    markAllAsUnread: "Mark All as Unread"
    ,
    // Downloads toolbar/actions
    select: "Select",
    selectAll: "Select All",
    clear: "Clear",
    delete: "Delete",
    done: "Done",
    noDownloadsYet: "No downloads yet",
    downloadsAppearHere: "Your downloaded files will appear here.",
    cancel: "Cancel",
    clearAllConfirmTitle: "Clear All",
    clearAllConfirmMsg: "Delete all downloaded files?",
    deleteSelectedConfirmTitle: "Delete",
    deleteSelectedConfirmMsg: "Delete selected files?",
    selected: "selected",
    sharingNotAvailable: "Sharing not available on this device",
    // Terms & Conditions
    termsUpdated: "Last updated: January 2024",
    termsIntro: "Please read these Terms and Conditions carefully before using elearn Nep. These terms govern your use of our educational platform and services.",
    termsAcceptanceTitle: "Acceptance of Terms",
    termsAcceptanceContent: "By accessing and using elearn Nep, you accept and agree to be bound by the terms and provision of this agreement.",
    termsUseLicenseTitle: "Use License",
    termsUseLicenseContent: "Permission is granted to temporarily access elearn Nep for personal, non-commercial transitory viewing only.",
    termsUserAccountTitle: "User Account",
    termsUserAccountContent: "You are responsible for safeguarding your account credentials and for all activities that occur under your account.",
    termsProhibitedUsesTitle: "Prohibited Uses",
    termsProhibitedUsesContent: "You may not use our service for any illegal or unauthorized purpose or to violate any laws in your jurisdiction.",
    termsContentTitle: "Content",
    termsContentContent: "Our service allows you to access educational content. You are responsible for your use of the content and must respect intellectual property rights.",
    termsPrivacyPolicyTitle: "Privacy Policy",
    termsPrivacyPolicyContent: "Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.",
    termsTerminationTitle: "Termination",
    termsTerminationContent: "We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms.",
    termsChangesTitle: "Changes to Terms",
    termsChangesContent: "We reserve the right to modify these terms at any time. We will notify users of any material changes.",
    termsQuestionsFooter: "If you have any questions about these Terms and Conditions, please contact us at elearnnep@16gmail.com",
    termsPlaceholder: "Full text of Terms and Conditions goes here. This content describes how you may use the elearn Nep application and services, your responsibilities, and our policies."
  },
  
  ne: {
    // Authentication
    welcomeBack: "फिर्ता स्वागत छ",
    createAccount: "खाता सिर्जना गर्नुहोस्",
    joinEduNepal: "आज elearn Nep मा सामेल हुनुहोस्",
    login: "लगइन",
    signup: "साइन अप",
    logout: "लगआउट",
    adminLogin: "प्रशासक लगइन",
    userLogin: "प्रयोगकर्ता लगइन",
    demoCredentials: "डेमो प्रमाणहरू",
    email: "इमेल",
    password: "पासवर्ड",
    username: "प्रयोगकर्ता नाम",
    fullName: "पूरा नाम",
    phoneNumber: "फोन नम्बर",
    rememberMe: "मलाई सम्झनुहोस्",
    forgotPassword: "पासवर्ड बिर्सनुभयो?",
    alreadyHaveAccount: "पहिले नै खाता छ? लगइन गर्नुहोस्",
    
    // Profile
    profile: "प्रोफाइल",
    personalInformation: "व्यक्तिगत जानकारी",
    accountDetails: "खाता विवरण",
    emailAddress: "इमेल ठेगाना",
    accountRole: "खाता भूमिका",
    memberSince: "सदस्य भएदेखि",
    location: "स्थान",
    editProfile: "प्रोफाइल सम्पादन गर्नुहोस्",
    loadingProfile: "प्रोफाइल लोड गर्दै...",
    welcomeToEduNepal: "elearn Nep मा स्वागत छ",
    classes: "कक्षाहरू",
    years: "वर्षहरू",
    active: "सक्रिय",
    
    // Navigation
    home: "घर",
    settings: "सेटिङहरू",
    language: "भाषा",
    downloads: "डाउनलोडहरू",
    theme: "थिम",
    helpSupport: "मद्दत र समर्थन",
    helpSupportSubtitle: "उत्तरहरू खोज्नुहोस्, हामीलाई सम्पर्क गर्नुहोस्, र उपयोगी स्रोतहरू हेर्नुहोस्",
    termsConditions: "नियम र शर्तहरू",
    contactUs: "हामीलाई सम्पर्क गर्नुहोस्",
    contactSubtitle: "हाम्रो समर्थन टोलीसँग सम्पर्क गर्नुहोस्",
    aboutApp: "एप बारे",
    privacyPolicy: "गोपनीयता नीति",
    userGuides: "प्रयोगकर्ता मार्गदर्शन",
    accountSecurity: "खाता सुरक्षा",
    adminDashboard: "प्रशासक ड्यासबोर्ड",
    systemNotifications: "प्रणाली सूचनाहरू",
    systemLogs: "प्रणाली लगहरू",
    developerTools: "डेभलपर टुल्स",
    notificationSettings: "सूचना सेटिङ्स",
    languageRegion: "भाषा र क्षेत्र",
    phoneSupport: "फोन समर्थन",
    officeAddress: "कार्यालय ठेगाना",
    contactFooter: "हामी सहयोगका लागि यहाँ छौं! elearn Nep बारे समर्थन, प्रतिक्रिया वा प्रश्नका लागि जेकुनै समय सम्पर्क गर्नुहोस्।",
    
    // General
    general: "सामान्य",
    supportAccount: "समर्थन र खाता",
    eduNepal: "elearn Nep",
    optional: "वैकल्पिक",
    required: "आवश्यक जानकारी",
    optionalInformation: "वैकल्पिक जानकारी",
    comingSoon: "चाँडै आउँदैछ",
    loading: "लोड हुँदै...",
    quickActions: "छिटो कार्य",
    faqs: "प्रश्नोत्तर",
    resources: "स्रोतहरू",
    emailSupport: "इमेल समर्थन",
    callUs: "हामीलाई कल गर्नुहोस्",
    contact: "सम्पर्क",
    shareApp: "एप साझा गर्नुहोस्",
    shareAppMessage: "elearn Nep हेर्नुहोस्! https://www.elearn.com",
    unableToShareNow: "अहिले साझा गर्न सकिएन।",
    faqResetPasswordQ: "पासवर्ड कसरी रिसेट गर्ने?",
    faqResetPasswordA: "सेटिङ्स > खाता सुरक्षा > पासवर्ड परिवर्तनमा जानुहोस्।",
    faqContactSupportQ: "समर्थनलाई कसरी सम्पर्क गर्ने?",
    faqContactSupportA: "सम्पर्क प्रयोग गरेर elearnnep@16gmail.com मा इमेल वा +977-9864158297 मा कल गर्नुहोस्।",
    faqPrivacyQ: "गोपनीयता नीति कहाँ पढ्न सक्छु?",
    faqPrivacyA: "सेटिङ्स > अबाउट > गोपनीयता नीतिमा जानुहोस् वा तलको लिंक थिच्नुहोस्।",
    faqDeleteAccountQ: "खाता कसरी मेटाउने?",
    faqDeleteAccountA: "सेटिङ्स > खाता सुरक्षा > खाता मेटाउन जानुहोस् र निर्देशनहरू पालना गर्नुहोस्।",
    // Generic errors
    error: "त्रुटि",
    unableToLoadDownloads: "डाउनलोडहरू लोड गर्न सकिएन",
    failedToShareFile: "फाइल सेयर गर्न असफल भयो",
    failedToDeleteFile: "फाइल मेटाउन असफल भयो",
    failedToDeleteSomeFiles: "केही फाइलहरू मेटाउन असफल भयो",
    failedToClearAll: "सबै फाइलहरू हटाउन असफल भयो",
    
    // Class Screen
    class: "कक्षा",
    searchBooksNotes: "पुस्तकहरू, नोटहरू खोज्नुहोस्...",
    textbooks: "पाठ्यपुस्तकहरू",
    guidebooks: "गाइडबुकहरू",
    previousPapers: "अघिल्लो पेपरहरू",
    practiceQuestions: "अभ्यास प्रश्नहरू",
    cdcApprovedBooks: "CDC अनुमोदित पुस्तकहरू अंग्रेजी र नेपालीमा",
    chapterWiseNotes: "अध्यायवार नोटहरू, व्याख्या र परीक्षा",
    lastYearsExams: "पछिल्लो ३-५ वर्षको बोर्ड/फाइनल परीक्षा पहुँच",
    expectedQuestions: "परीक्षाका लागि अपेक्षित प्रश्नहरू: छोटो, लामो",
    recentActivity: "हालैका गतिविधिहरू",
    // Notifications
    notifications: "सूचनाहरू",
    clearAll: "सबै हटाउनुहोस्",
    noNotificationsYet: "अहिलेसम्म कुनै सूचना छैन",
    markAsRead: "पढिएको रूपमा चिन्हित गर्नुहोस्",
    markAsUnread: "नपढिएको रूपमा चिन्हित गर्नुहोस्",
    markAllAsRead: "सबैलाई पढिएको बनाउनुहोस्",
    markAllAsUnread: "सबैलाई नपढिएको बनाउनुहोस्",
    // Downloads toolbar/actions
    select: "छान्नुहोस्",
    selectAll: "सबै छान्नुहोस्",
    clear: "खाली",
    delete: "मेटाउनुहोस्",
    done: "भयो",
    noDownloadsYet: "अहिलेसम्म कुनै डाउनलोड छैन",
    downloadsAppearHere: "तपाईंका डाउनलोड गरिएका फाइलहरू यहाँ देखिन्छन्।",
    cancel: "रद्द",
    clearAllConfirmTitle: "सबै हटाउनुहोस्",
    clearAllConfirmMsg: "सबै डाउनलोड गरिएका फाइलहरू मेटाउने?",
    deleteSelectedConfirmTitle: "मेटाउनुहोस्",
    deleteSelectedConfirmMsg: "छानिएका फाइलहरू मेटाउने?",
    selected: "छानिएको",
    sharingNotAvailable: "यो उपकरणमा सेयरिङ उपलब्ध छैन",
    // Terms & Conditions
    termsUpdated: "अन्तिम अद्यावधिक: जनवरी २०२४",
    termsIntro: "कृपया elearn Nep प्रयोग गर्नु अघि यी नियम र सर्तहरू ध्यानपूर्वक पढ्नुहोस्। यी सर्तहरूले हाम्रो शैक्षिक प्लेटफर्म र सेवाहरूको तपाईंको प्रयोगलाई निर्देशित गर्छन्।",
    termsAcceptanceTitle: "नियमहरूको स्वीकृति",
    termsAcceptanceContent: "elearn Nep प्रयोग गरेर, तपाईं यस सम्झौताका नियम र प्रावधानहरू पालना गर्न सहमत हुनुहुन्छ।",
    termsUseLicenseTitle: "प्रयोग लाइसेन्स",
    termsUseLicenseContent: "elearn Nep लाई व्यक्तिगत, गैर-व्यावसायिक तात्कालिक हेर्नका लागि अस्थायी रूपमा पहुँच अनुमति दिइएको छ।",
    termsUserAccountTitle: "प्रयोगकर्ता खाता",
    termsUserAccountContent: "तपाईं आफ्नो खाता प्रमाणहरू सुरक्षित राख्न र आफ्नो खातामा हुने सबै गतिविधिहरूको लागि जिम्मेवार हुनुहुन्छ।",
    termsProhibitedUsesTitle: "प्रतिबन्धित प्रयोग",
    termsProhibitedUsesContent: "तपाईं हाम्रो सेवालाई कुनै गैरकानुनी वा अनधिकृत उद्देश्यका लागि प्रयोग गर्न सक्नुहुन्न, वा आफ्नो क्षेत्राधिकारका कुनै पनि कानूनहरू उल्लङ्घन गर्न सक्नुहुन्न।",
    termsContentTitle: "सामग्री",
    termsContentContent: "हाम्रो सेवाले शैक्षिक सामग्री पहुँच गर्न अनुमति दिन्छ। तपाईं सामग्रीको प्रयोगको लागि जिम्मेवार हुनुहुन्छ र बौद्धिक सम्पत्ति अधिकारको सम्मान गर्नुपर्छ।",
    termsPrivacyPolicyTitle: "गोपनीयता नीति",
    termsPrivacyPolicyContent: "तपाईंको गोपनीयता हामीलाई महत्त्वपूर्ण छ। कृपया हाम्रो गोपनीयता नीति समीक्षा गर्नुहोस्, जसले सेवाको तपाईंको प्रयोगलाई पनि निर्देशित गर्छ।",
    termsTerminationTitle: "समाप्ति",
    termsTerminationContent: "हामी यी नियमहरूको उल्लङ्घन भएको विश्वास हुने व्यवहारका लागि पूर्वसूचना बिना नै तपाईंको खाता र सेवामा पहुँच तुरुन्त निलम्बन वा समाप्त गर्न सक्छौं।",
    termsChangesTitle: "नियमहरूमा परिवर्तन",
    termsChangesContent: "हामी कुनै पनि समयमा यी नियमहरू परिमार्जन गर्ने अधिकार राख्छौं। कुनै महत्वपूर्ण परिवर्तनबारे प्रयोगकर्तालाई सूचित गरिनेछ।",
    termsQuestionsFooter: "यी नियम र सर्तहरूबारे कुनै प्रश्न भएमा, कृपया elearnnep@16gmail.com मा सम्पर्क गर्नुहोस्",
    termsPlaceholder: "नियम र सर्तहरूको पूर्ण पाठ यहाँ जान्छ। यस सामग्रीले elearn Nep एप र सेवाहरू कसरी प्रयोग गर्न सकिन्छ, तपाईंको जिम्मेवारीहरू, र हाम्रा नीतिहरू वर्णन गर्दछ।"
  },
  
  hi: {
    // Authentication
    welcomeBack: "वापस स्वागत है",
    createAccount: "खाता बनाएं",
    joinEduNepal: "आज elearn Nep से जुड़ें",
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "लॉगआउट",
    adminLogin: "एडमिन लॉगिन",
    userLogin: "यूजर लॉगिन",
    demoCredentials: "डेमो क्रेडेंशियल्स",
    email: "ईमेल",
    password: "पासवर्ड",
    username: "यूजरनेम",
    fullName: "पूरा नाम",
    phoneNumber: "फोन नंबर",
    rememberMe: "मुझे याद रखें",
    forgotPassword: "पासवर्ड भूल गए?",
    alreadyHaveAccount: "पहले से खाता है? लॉगिन करें",
    
    // Profile
    profile: "प्रोफाइल",
    personalInformation: "व्यक्तिगत जानकारी",
    accountDetails: "खाता विवरण",
    emailAddress: "ईमेल पता",
    accountRole: "खाता भूमिका",
    memberSince: "सदस्य बने",
    location: "स्थान",
    editProfile: "प्रोफाइल संपादित करें",
    loadingProfile: "प्रोफाइल लोड हो रहा है...",
    welcomeToEduNepal: "elearn Nep में आपका स्वागत है",
    classes: "कक्षाएं",
    years: "साल",
    active: "सक्रिय",
    
    // Navigation
    home: "होम",
    settings: "सेटिंग्स",
    language: "भाषा",
    downloads: "डाउनलोड",
    theme: "थीम",
    helpSupport: "मदद और समर्थन",
    helpSupportSubtitle: "उत्तर खोजें, हमसे संपर्क करें, और उपयोगी संसाधन देखें",
    termsConditions: "नियम और शर्तें",
    contactUs: "संपर्क करें",
    contactSubtitle: "हमारी सपोर्ट टीम से संपर्क करें",
    aboutApp: "ऐप के बारे में",
    privacyPolicy: "गोपनीयता नीति",
    userGuides: "यूज़र गाइड्स",
    accountSecurity: "खाता सुरक्षा",
    adminDashboard: "एडमिन डैशबोर्ड",
    systemNotifications: "सिस्टम सूचनाएँ",
    systemLogs: "सिस्टम लॉग्स",
    developerTools: "डेवलपर टूल्स",
    notificationSettings: "सूचना सेटिंग्स",
    languageRegion: "भाषा और क्षेत्र",
    regionSettings: "क्षेत्र सेटिंग्स",
    privacySettings: "गोपनीयता सेटिंग्स",
    updatePassword: "पासवर्ड अपडेट",
    updateEmail: "ईमेल अपडेट",
    deleteAccount: "खाता हटाएँ",
    
    // General
    general: "सामान्य",
    supportAccount: "समर्थन और खाता",
    eduNepal: "elearn Nep",
    optional: "वैकल्पिक",
    required: "आवश्यक जानकारी",
    optionalInformation: "वैकल्पिक जानकारी",
    comingSoon: "जल्द आ रहा है",
    loading: "लोड हो रहा है...",
    quickActions: "त्वरित क्रियाएँ",
    faqs: "सामान्य प्रश्न",
    resources: "संसाधन",
    emailSupport: "ईमेल समर्थन",
    callUs: "हमें कॉल करें",
    contact: "संपर्क",
    shareApp: "ऐप साझा करें",
    shareAppMessage: "elearn Nep देखें! https://www.elearn.com",
    unableToShareNow: "अभी साझा नहीं कर सकते।",
    faqResetPasswordQ: "मैं अपना पासवर्ड कैसे रीसेट करूं?",
    faqResetPasswordA: "पासवर्ड रीसेट करने के लिए सेटिंग्स > खाता सुरक्षा > पासवर्ड बदलें पर जाएँ।",
    faqContactSupportQ: "मैं समर्थन से कैसे संपर्क कर सकता/सकती हूँ?",
    faqContactSupportA: "संपर्क का उपयोग करके elearnnep@16gmail.com पर ईमेल करें या +977-9864158297 पर कॉल करें।",
    faqPrivacyQ: "मैं गोपनीयता नीति कहाँ पढ़ सकता/सकती हूँ?",
    faqPrivacyA: "सेटिंग्स > अबाउट > गोपनीयता नीति पर जाएँ या नीचे दिए लिंक पर टैप करें।",
    faqDeleteAccountQ: "मैं अपना खाता कैसे हटाऊं?",
    faqDeleteAccountA: "सेटिंग्स > खाता सुरक्षा > खाता हटाएँ पर जाएँ और चरणों का पालन करें।",
    // Generic errors
    error: "त्रुटि",
    unableToLoadDownloads: "डाउनलोड लोड नहीं हो सके",
    failedToShareFile: "फ़ाइल साझा करने में विफल",
    failedToDeleteFile: "फ़ाइल हटाने में विफल",
    failedToDeleteSomeFiles: "कुछ फ़ाइलें हटाने में विफल",
    failedToClearAll: "सभी फ़ाइलें हटाने में विफल",
    
    // Class Screen
    class: "कक्षा",
    searchBooksNotes: "किताबें, नोट्स खोजें...",
    textbooks: "पाठ्यपुस्तकें",
    guidebooks: "गाइडबुक्स",
    previousPapers: "पिछले पेपर्स",
    practiceQuestions: "अभ्यास प्रश्न",
    cdcApprovedBooks: "CDC अनुमोदित पुस्तकें अंग्रेजी और नेपाली में",
    chapterWiseNotes: "अध्यायवार नोट्स, व्याख्या और परीक्षा",
    lastYearsExams: "पिछले 3-5 साल के बोर्ड/फाइनल परीक्षा एक्सेस",
    expectedQuestions: "परीक्षा के लिए अपेक्षित प्रश्न: छोटे, लंबे",
    recentActivity: "हाल की गतिविधि",
    // Notifications
    notifications: "सूचनाएँ",
    clearAll: "सभी हटाएँ",
    noNotificationsYet: "अभी कोई सूचना नहीं",
    markAsRead: "पढ़ा हुआ करें",
    markAsUnread: "अपठित करें",
    markAllAsRead: "सभी को पढ़ा हुआ करें",
    markAllAsUnread: "सभी को अपठित करें",
    // Downloads toolbar/actions
    select: "चुनें",
    selectAll: "सभी चुनें",
    clear: "साफ़",
    delete: "हटाएँ",
    done: "हो गया",
    noDownloadsYet: "अभी कोई डाउनलोड नहीं",
    downloadsAppearHere: "आपकी डाउनलोड की गई फाइलें यहाँ दिखेंगी।",
    cancel: "रद्द",
    clearAllConfirmTitle: "सभी हटाएँ",
    clearAllConfirmMsg: "सभी डाउनलोड फाइलें हटाएँ?",
    deleteSelectedConfirmTitle: "हटाएँ",
    deleteSelectedConfirmMsg: "चयनित फाइलें हटाएँ?",
    selected: "चुना हुआ",
    sharingNotAvailable: "इस डिवाइस पर शेयरिंग उपलब्ध नहीं है",
    // Terms & Conditions
    termsUpdated: "अंतिम अपडेट: जनवरी 2024",
    termsIntro: "कृपया elearn Nep का उपयोग करने से पहले इन नियम और शर्तों को ध्यान से पढ़ें। ये शर्तें हमारे शैक्षणिक प्लेटफ़ॉर्म और सेवाओं के आपके उपयोग को नियंत्रित करती हैं।",
    termsAcceptanceTitle: "नियमों की स्वीकृति",
    termsAcceptanceContent: "elearn Nep का उपयोग करके, आप इस अनुबंध की शर्तों और प्रावधानों का पालन करने के लिए सहमत होते हैं।",
    termsUseLicenseTitle: "उपयोग लाइसेंस",
    termsUseLicenseContent: "elearn Nep तक अस्थायी रूप से व्यक्तिगत, गैर-व्यावसायिक अस्थाई देखने के लिए पहुँच की अनुमति दी जाती है।",
    termsUserAccountTitle: "यूजर खाता",
    termsUserAccountContent: "आप अपने खाते के क्रेडेंशियल्स की सुरक्षा और अपने खाते के अंतर्गत होने वाली सभी गतिविधियों के लिए जिम्मेदार हैं।",
    termsProhibitedUsesTitle: "प्रतिबंधित उपयोग",
    termsProhibitedUsesContent: "आप हमारी सेवा का उपयोग किसी भी गैरकानूनी या अनधिकृत उद्देश्य के लिए नहीं कर सकते, या अपने क्षेत्राधिकार के किसी भी कानून का उल्लंघन नहीं कर सकते।",
    termsContentTitle: "सामग्री",
    termsContentContent: "हमारी सेवा आपको शैक्षणिक सामग्री तक पहुँच प्रदान करती है। आपको सामग्री के उपयोग के लिए जिम्मेदार होना चाहिए और बौद्धिक संपदा अधिकारों का सम्मान करना चाहिए।",
    termsPrivacyPolicyTitle: "गोपनीयता नीति",
    termsPrivacyPolicyContent: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। कृपया हमारी गोपनीयता नीति की समीक्षा करें, जो आपकी सेवा के उपयोग को भी नियंत्रित करती है।",
    termsTerminationTitle: "समापन",
    termsTerminationContent: "हम इन नियमों का उल्लंघन करने वाले आचरण के लिए बिना किसी पूर्व सूचना के, तुरंत आपके खाते और सेवा तक पहुँच को निलंबित या समाप्त कर सकते हैं।",
    termsChangesTitle: "नियमों में परिवर्तन",
    termsChangesContent: "हम किसी भी समय इन शर्तों में संशोधन करने का अधिकार रखते हैं। किसी भी महत्वपूर्ण परिवर्तन के बारे में उपयोगकर्ताओं को सूचित किया जाएगा।",
    termsQuestionsFooter: "यदि आपको इन नियम और शर्तों के बारे में कोई प्रश्न हैं, तो कृपया हमसे elearnnep@16gmail.com पर संपर्क करें",
    termsPlaceholder: "नियम और शर्तों का पूर्ण पाठ यहाँ होगा। यह सामग्री बताती है कि आप elearn Nep एप और सेवाओं का उपयोग कैसे कर सकते हैं, आपकी जिम्मेदारियाँ, और हमारी नीतियाँ।"
  }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default English

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang && translations[storedLang]) {
          setLanguage(storedLang);
        }
      } catch (error) {
        console.log('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
      try {
        await AsyncStorage.setItem('appLanguage', langCode);
      } catch (error) {
        console.log('Error saving language:', error);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const getAvailableLanguages = () => [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
  ];

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      t, 
      getAvailableLanguages 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

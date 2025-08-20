import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// Translation data
const translations = {
  en: {
    // Authentication
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    joinEduNepal: "Join EduNepal today",
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
    welcomeToEduNepal: "Welcome to EduNepal",
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
    termsConditions: "Terms & Conditions",
    contactUs: "Contact Us",
    
    // General
    general: "General",
    supportAccount: "Support & Account",
    eduNepal: "Edu Nepal",
    optional: "Optional",
    required: "Required Information",
    optionalInformation: "Optional Information",
    comingSoon: "Coming Soon",
    
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
  },
  
  ne: {
    // Authentication
    welcomeBack: "फिर्ता स्वागत छ",
    createAccount: "खाता सिर्जना गर्नुहोस्",
    joinEduNepal: "आज EduNepal मा सामेल हुनुहोस्",
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
    welcomeToEduNepal: "EduNepal मा स्वागत छ",
    classes: "कक्षाहरू",
    years: "वर्षहरू",
    active: "सक्रिय",
    
    // Navigation
    home: "घर",
    settings: "सेटिङहरू",
    language: "भाषा",
    downloads: "डाउनलोडहरू",
    theme: "थिम",
    helpSupport: "सहायता र समर्थन",
    termsConditions: "नियम र शर्तहरू",
    contactUs: "हामीलाई सम्पर्क गर्नुहोस्",
    
    // General
    general: "सामान्य",
    supportAccount: "समर्थन र खाता",
    eduNepal: "शिक्षा नेपाल",
    optional: "वैकल्पिक",
    required: "आवश्यक जानकारी",
    optionalInformation: "वैकल्पिक जानकारी",
    comingSoon: "चाँडै आउँदैछ",
    
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
    markAllAsUnread: "सबैलाई नपढिएको बनाउनुहोस्"
  },
  
  hi: {
    // Authentication
    welcomeBack: "वापस स्वागत है",
    createAccount: "खाता बनाएं",
    joinEduNepal: "आज EduNepal से जुड़ें",
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
    welcomeToEduNepal: "EduNepal में आपका स्वागत है",
    classes: "कक्षाएं",
    years: "साल",
    active: "सक्रिय",
    
    // Navigation
    home: "होम",
    settings: "सेटिंग्स",
    language: "भाषा",
    downloads: "डाउनलोड",
    theme: "थीम",
    helpSupport: "सहायता और समर्थन",
    termsConditions: "नियम और शर्तें",
    contactUs: "संपर्क करें",
    
    // General
    general: "सामान्य",
    supportAccount: "समर्थन और खाता",
    eduNepal: "एडु नेपाल",
    optional: "वैकल्पिक",
    required: "आवश्यक जानकारी",
    optionalInformation: "वैकल्पिक जानकारी",
    comingSoon: "जल्द आ रहा है",
    
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
    markAllAsUnread: "सभी को अपठित करें"
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

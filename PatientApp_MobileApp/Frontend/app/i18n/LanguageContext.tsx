import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations, pluralRules, Translations, PluralForm } from './translations';

type PluralKey = 'one' | 'other';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof typeof translations.en) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  isRTL: boolean;
  plural: (key: keyof Translations, count: number) => string;
  isLanguageLoaded: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  // Initialize language from storage
  React.useEffect(() => {
    const initLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('language');
        if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ms')) {
          setLanguageState(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
      setIsLanguageLoaded(true);
    };
    initLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: keyof typeof translations.en): string => {
    const translation = translations[language][key];
    
    // If it's a string, return it directly
    if (typeof translation === 'string') {
      return translation;
    }
    
    // If it's a plural form object, return the 'other' form as default
    if (translation && typeof translation === 'object') {
      return translation.other;
    }
    
    // Fallback to English translation
    const enTranslation = translations.en[key];
    if (typeof enTranslation === 'string') {
      return enTranslation;
    }
    if (enTranslation && typeof enTranslation === 'object') {
      return enTranslation.other;
    }
    
    // If all else fails, return the key as string
    return String(key);
  }, [language]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    const locale = language === 'ms' ? 'ms-MY' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(num);
  }, [language]);

  const plural = useCallback((key: keyof Translations, count: number): string => {
    const translation = translations[language][key];
    
    // If it's a string, use it as a simple template
    if (typeof translation === 'string') {
      return `${formatNumber(count)} ${translation}`;
    }
    
    // If it's a plural form object, use the appropriate form
    if (translation && typeof translation === 'object') {
      const pluralKey: PluralKey = count === 1 ? 'one' : 'other';
      const form = translation[pluralKey];
      if (form) {
        return form.replace('{{count}}', formatNumber(count));
      }
    }
    
    // Fallback to English translation
    const enTranslation = translations.en[key];
    if (enTranslation && typeof enTranslation === 'object') {
      const pluralKey: PluralKey = count === 1 ? 'one' : 'other';
      const form = enTranslation[pluralKey];
      if (form) {
        return form.replace('{{count}}', formatNumber(count));
      }
    }
    
    // If all else fails, return a simple formatted string
    return `${formatNumber(count)} ${String(key)}`;
  }, [language, formatNumber]);

  const isRTL = false; // Neither English nor Malay are RTL languages

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber, isRTL, plural, isLanguageLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

export interface CrowdFavorite {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  action: 'add' | 'arrow';
}

export interface FooterSettings {
  locationUrl: string;
  whatsappUrl: string;
  instagramUrl: string;
  facebookUrl: string;
}

export interface HomepageSettings {
  logoImage: string;
  heroImage: string;
  crowdFavorites: CrowdFavorite[];
  aboutHeading: string;
  aboutSubheading: string;
  footer: FooterSettings;
}

const defaultCrowdFavorites: CrowdFavorite[] = [
  {
    id: 1,
    title: "SIGNATURE CHARCOAL CHICKEN",
    subtitle: "Original or Spicy Bone-in",
    image: "/images/signature_chicken.jpeg",
    action: "add",
  },
  {
    id: 2,
    title: "TENDERS",
    subtitle: "Hand-breaded strips",
    image: "/images/tenders.png",
    action: "add",
  },
  {
    id: 3,
    title: "THE SANDWICH",
    subtitle: "The cultural icon",
    image: "/images/sandwich.png",
    action: "add",
  },
  {
    id: 4,
    title: "SIGNATURE SIDES",
    subtitle: "Cajun fries & more",
    image: "/images/sides.png",
    action: "arrow",
  },
];

export const defaultHomepageSettings: HomepageSettings = {
  logoImage: '/images/logo.png', // Or /images/Logo.jpeg, but Logo.png is used in App.tsx
  heroImage: '/images/hero.jpeg',
  crowdFavorites: defaultCrowdFavorites,
  aboutHeading: "Our Story",
  aboutSubheading: "We started with a simple passion for incredible flavor...",
  footer: {
    locationUrl: "https://maps.google.com/?q=Tasty+Hot+Ajman",
    whatsappUrl: "https://wa.me/971505012081",
    instagramUrl: "https://instagram.com/tastyhot",
    facebookUrl: "https://facebook.com/tastyhot",
  }
};

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultHomepageSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(db, 'settings/homepage');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Merge with defaults to ensure all fields are present, especially if 
        // the admin hasn't saved all parts of the settings yet.
        setSettings({
          logoImage: data.logoImage || defaultHomepageSettings.logoImage,
          heroImage: data.heroImage || defaultHomepageSettings.heroImage,
          crowdFavorites: data.crowdFavorites || defaultHomepageSettings.crowdFavorites,
          aboutHeading: data.aboutHeading !== undefined ? data.aboutHeading : defaultHomepageSettings.aboutHeading,
          aboutSubheading: data.aboutSubheading !== undefined ? data.aboutSubheading : defaultHomepageSettings.aboutSubheading,
          footer: data.footer || defaultHomepageSettings.footer,
        });
      } else {
        setSettings(defaultHomepageSettings);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}

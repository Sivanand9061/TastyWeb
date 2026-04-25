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
  restaurantName: string;
  logoImage: string;
  heroImage: string;
  splashScreenImage?: string;
  faviconImage?: string;
  ogImage?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  crowdFavorites: CrowdFavorite[];
  aboutHeading: string;
  aboutSubheading: string;
  footer: FooterSettings;
  deliveryRadiusKm: number;
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
  restaurantName: "Burger Street",
  logoImage: "/images/custom_logo.png",
  heroImage: "/images/hero_banner.jpeg",
  splashScreenImage: "",
  faviconImage: "",
  ogImage: "",
  primaryColor: "#f51c27",
  secondaryColor: "#1caa00",
  currency: "AED",
  crowdFavorites: defaultCrowdFavorites,
  aboutHeading: "Our Journey Started Deep In the Details",
  aboutSubheading: "We started with a simple passion for incredible flavor...",
  footer: {
    locationUrl: "https://maps.google.com/?q=Burger+Street",
    whatsappUrl: "https://wa.me/971505012081",
    instagramUrl: "https://instagram.com/burgerstreet",
    facebookUrl: "https://facebook.com/burgerstreet",
  },
  deliveryRadiusKm: 20
};

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultHomepageSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(db, 'settings/homepage');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Firebase RTDB may return arrays as objects with numeric keys — normalise
        let crowdFavs = data.crowdFavorites || defaultHomepageSettings.crowdFavorites;
        if (crowdFavs && !Array.isArray(crowdFavs)) {
          crowdFavs = Object.values(crowdFavs);
        }

        setSettings({
          restaurantName: data.restaurantName || defaultHomepageSettings.restaurantName,
          logoImage: data.logoImage || defaultHomepageSettings.logoImage,
          heroImage: data.heroImage || defaultHomepageSettings.heroImage,
          // Image assets — use ?? so empty string from admin is respected
          splashScreenImage: data.splashScreenImage ?? defaultHomepageSettings.splashScreenImage,
          faviconImage: data.faviconImage ?? defaultHomepageSettings.faviconImage,
          ogImage: data.ogImage ?? defaultHomepageSettings.ogImage,
          primaryColor: data.primaryColor || defaultHomepageSettings.primaryColor,
          secondaryColor: data.secondaryColor || defaultHomepageSettings.secondaryColor,
          currency: data.currency || defaultHomepageSettings.currency,
          crowdFavorites: crowdFavs,
          aboutHeading: data.aboutHeading !== undefined ? data.aboutHeading : defaultHomepageSettings.aboutHeading,
          aboutSubheading: data.aboutSubheading !== undefined ? data.aboutSubheading : defaultHomepageSettings.aboutSubheading,
          footer: data.footer || defaultHomepageSettings.footer,
          deliveryRadiusKm: data.deliveryRadiusKm || defaultHomepageSettings.deliveryRadiusKm,
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

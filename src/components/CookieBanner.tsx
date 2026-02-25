'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './cookie-banner.css';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences, acceptAll: boolean = false) => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    if (acceptAll || prefs.analytics || prefs.marketing) {
      enableCookies(prefs);
    }
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const enableCookies = (prefs: CookiePreferences) => {
    if (prefs.analytics) {
      console.log('Analytics cookies enabled');
    }
    if (prefs.marketing) {
      console.log('Marketing cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allPrefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allPrefs);
    savePreferences(allPrefs, true);
  };

  const handleRejectNonEssential = () => {
    const minimalPrefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(minimalPrefs);
    savePreferences(minimalPrefs);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner-overlay">
      <div className="cookie-banner">
        {!showSettings ? (
          <>
            <div className="cookie-banner-content">
              <h3>Utilizamos cookies</h3>
              <p>
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência 
                em nossa plataforma. Alguns cookies são essenciais para o funcionamento 
                adequado do site, enquanto outros nos ajudam a entender como você interage 
                com nossos serviços.
              </p>
              <p className="cookie-banner-link">
                <Link href="/politica-cookies">Saiba mais sobre como utilizamos cookies</Link>
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button 
                onClick={() => setShowSettings(true)}
                className="cookie-btn cookie-btn--secondary"
              >
                Personalizar
              </button>
              <button 
                onClick={handleRejectNonEssential}
                className="cookie-btn cookie-btn--outline"
              >
                Recusar
              </button>
              <button 
                onClick={handleAcceptAll}
                className="cookie-btn cookie-btn--primary"
              >
                Aceitar todos
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookie-banner-content">
              <h3>Preferências de Cookies</h3>
              <p>
                Escolha quais cookies deseja aceitar. Os cookies essenciais são 
                necessários para o funcionamento básico da plataforma.
              </p>
              
              <div className="cookie-settings">
                <div className="cookie-option">
                  <div className="cookie-option-header">
                    <span className="cookie-option-title">Cookies Essenciais</span>
                    <span className="cookie-option-badge">Sempre ativo</span>
                  </div>
                  <p>Necessários para o funcionamento básico do site, incluindo autenticação e segurança.</p>
                  <label className="cookie-toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.essential}
                      onChange={() => setPreferences({...preferences, essential: true})}
                      disabled 
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>

                <div className="cookie-option">
                  <div className="cookie-option-header">
                    <span className="cookie-option-title">Cookies de Análise</span>
                  </div>
                  <p>Nos ajudam a entender como os usuários interagem com nossa plataforma.</p>
                  <label className="cookie-toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.analytics}
                      onChange={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>

                <div className="cookie-option">
                  <div className="cookie-option-header">
                    <span className="cookie-option-title">Cookies de Marketing</span>
                  </div>
                  <p>Utilizados para apresentar anúncios relevantes e medir a eficácia de campanhas.</p>
                  <label className="cookie-toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.marketing}
                      onChange={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <div className="cookie-banner-actions">
              <button 
                onClick={() => setShowSettings(false)}
                className="cookie-btn cookie-btn--outline"
              >
                Voltar
              </button>
              <button 
                onClick={handleSaveSettings}
                className="cookie-btn cookie-btn--primary"
              >
                Salvar preferências
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

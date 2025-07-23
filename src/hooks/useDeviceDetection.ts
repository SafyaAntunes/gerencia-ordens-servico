
import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isTizen: boolean;
  isTizenTV: boolean;
  isLegacyBrowser: boolean;
  userAgent: string;
  browserVersion: string;
  needsPolyfills: boolean;
  supportsModernCSS: boolean;
  supportsModernJS: boolean;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isTizen: false,
    isTizenTV: false,
    isLegacyBrowser: false,
    userAgent: '',
    browserVersion: '',
    needsPolyfills: false,
    supportsModernCSS: false,
    supportsModernJS: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isTizen = /Tizen/i.test(userAgent);
    const isTizenTV = /SamsungBrowser/i.test(userAgent) && /TV/i.test(userAgent);
    
    // Detect Chrome version for Tizen compatibility
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : 0;
    
    // Tizen 4.0 and below use Chrome 69 or older
    const isLegacyBrowser = chromeVersion > 0 && chromeVersion < 80;
    
    // Check for modern features
    const supportsModernCSS = 'CSS' in window && 'supports' in CSS;
    const supportsModernJS = 'Promise' in window && 'fetch' in window;
    
    const needsPolyfills = isTizen || isLegacyBrowser || !supportsModernJS;

    console.log('Device Detection:', {
      userAgent,
      isTizen,
      isTizenTV,
      chromeVersion,
      isLegacyBrowser,
      needsPolyfills,
      supportsModernCSS,
      supportsModernJS,
    });

    setDeviceInfo({
      isTizen,
      isTizenTV,
      isLegacyBrowser,
      userAgent,
      browserVersion: chromeVersion.toString(),
      needsPolyfills,
      supportsModernCSS,
      supportsModernJS,
    });
  }, []);

  return deviceInfo;
};

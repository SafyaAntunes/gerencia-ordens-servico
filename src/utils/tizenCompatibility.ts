
import { DeviceInfo } from '@/hooks/useDeviceDetection';

export const getTizenCompatibleStyles = (deviceInfo: DeviceInfo) => {
  if (!deviceInfo.isTizen && !deviceInfo.isLegacyBrowser) {
    return {};
  }

  // Simplified styles for Tizen
  return {
    // Remove complex animations
    transition: 'none',
    transform: 'none',
    animation: 'none',
    
    // Use basic flexbox instead of CSS Grid
    display: 'flex',
    flexDirection: 'column' as const,
    
    // Simplified shadows
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    
    // Basic border radius
    borderRadius: '4px',
  };
};

export const shouldUseSimplifiedComponents = (deviceInfo: DeviceInfo): boolean => {
  return deviceInfo.isTizen || deviceInfo.isLegacyBrowser || !deviceInfo.supportsModernJS;
};

export const getOptimizedQueryConfig = (deviceInfo: DeviceInfo) => {
  if (shouldUseSimplifiedComponents(deviceInfo)) {
    return {
      staleTime: 1000 * 60 * 10, // 10 minutes (longer for slower devices)
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      retry: 1, // Fewer retries
    };
  }
  
  return {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  };
};

export const logTizenInfo = (deviceInfo: DeviceInfo) => {
  console.log('=== TIZEN COMPATIBILITY INFO ===');
  console.log('Device Info:', deviceInfo);
  console.log('Using simplified components:', shouldUseSimplifiedComponents(deviceInfo));
  console.log('Polyfills needed:', deviceInfo.needsPolyfills);
  console.log('================================');
};

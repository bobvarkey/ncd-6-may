/**
 * src/lib/wrapper/index.ts
 * -----------------------------------------------------------------------
 * AppBuildWrapper SDK abstraction.
 * -----------------------------------------------------------------------
 */

export interface AppInfo {
  platform: 'ios' | 'android';
  appVersion: string;
  bundleId: string;
  environment: 'development' | 'production';
  isMock?: boolean;
}

export interface Capabilities {
  push: boolean;
  purchases: boolean;
  haptics: boolean;
}

export interface BridgeInfo {
  appInfo: AppInfo;
  capabilities: Capabilities;
}

export interface AppbuildWrapper {
  ready: Promise<BridgeInfo>;
  plugin(name: string): any;
}

declare global {
  interface Window {
    AppbuildWrapper?: AppbuildWrapper;
  }
}

export const getWrapper = (): AppbuildWrapper | null => {
  if (typeof window === 'undefined') return null;
  return window.AppbuildWrapper || null;
};

export const isWrapperAvailable = (): boolean => {
  return !!getWrapper();
};

export const getAppInfo = async (): Promise<BridgeInfo | null> => {
  const wrapper = getWrapper();
  if (!wrapper) return null;
  try {
    return await wrapper.ready;
  } catch (err) {
    console.error('[Wrapper] Error waiting for ready state', err);
    return null;
  }
};

export const getPlugin = <T>(name: string): T | null => {
  const wrapper = getWrapper();
  if (!wrapper) return null;
  return wrapper.plugin(name) as T;
};

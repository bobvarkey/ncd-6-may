import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWrapper, getAppInfo, getPlugin } from '@/lib/wrapper';

describe('Wrapper Core', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { AppbuildWrapper: undefined });
  });

  it('should return null if window.AppbuildWrapper is missing', () => {
    expect(getWrapper()).toBeNull();
  });

  it('should return the wrapper if present', () => {
    const mockWrapper = { ready: Promise.resolve({}), plugin: vi.fn() };
    vi.stubGlobal('window', { AppbuildWrapper: mockWrapper });
    expect(getWrapper()).toBe(mockWrapper);
  });

  it('should wait for app info', async () => {
    const mockInfo = { appInfo: { platform: 'ios', environment: 'development' } };
    const mockWrapper = { ready: Promise.resolve(mockInfo), plugin: vi.fn() };
    vi.stubGlobal('window', { AppbuildWrapper: mockWrapper });
    
    const info = await getAppInfo();
    expect(info).toEqual(mockInfo);
  });

  it('should get a plugin by name', () => {
    const mockPlugin = { someMethod: vi.fn() };
    const mockWrapper = { 
      ready: Promise.resolve({}), 
      plugin: vi.fn().mockReturnValue(mockPlugin) 
    };
    vi.stubGlobal('window', { AppbuildWrapper: mockWrapper });

    const plugin = getPlugin('TestPlugin');
    expect(plugin).toBe(mockPlugin);
    expect(mockWrapper.plugin).toHaveBeenCalledWith('TestPlugin');
  });
});

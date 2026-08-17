/**
 * appbuild-wrapper-sdk.mock.js
 * -----------------------------------------------------------------------
 * DEVELOPMENT-ONLY AppBuildWrapper mock.
 *
 * Purpose:
 * - Lets a web app run in a normal browser where window.AppbuildWrapper
 *   is otherwise unavailable.
 * - Simulates RevenueCat-style purchases, restore purchases, entitlement
 *   state, and push events.
 *
 * Important:
 * - This is not AppBuild.diy's real SDK.
 * - Do NOT include this file in a production web build or native release.
 * - This does NOT test StoreKit, Google Play Billing, receipts, RevenueCat
 *   server state, subscription renewal, restore behavior, or compliance.
 * -----------------------------------------------------------------------
 */

(function installAppbuildMock(global) {
  "use strict";

  if (!global || !global.window) return;

  const windowRef = global.window;

  const isProduction =
    windowRef.__APP_ENV__ === "production" ||
    windowRef.__APPBUILD_PRODUCTION__ === true ||
    windowRef.location?.hostname?.includes("appbuild.diy") ||
    windowRef.location?.protocol === "appbuild:" ||
    windowRef.Capacitor?.isNativePlatform?.() === true;

  if (isProduction) {
    console.warn(
      "[AppbuildMock] Installation blocked. This mock must never run in production/native builds."
    );
    return;
  }

  if (windowRef.AppbuildWrapper) {
    console.warn(
      "[AppbuildMock] window.AppbuildWrapper already exists. Mock was not installed."
    );
    return;
  }

  const MOCK_CONFIG = Object.seal({
    platform: "ios",
    readyDelayMs: 150,
    startPremium: false,
    allowMockPurchases: true,
    logPrefix: "[AppbuildMock]",

    bundleId: "com.example.app",
    appVersion: "1.0.0-mock",

    entitlementId: "premium",

    products: {
      monthly: {
        identifier: "com.example.app.premium.monthly",
        title: "Premium Monthly",
        description: "Monthly premium subscription",
        price: 9.99,
        priceString: "$9.99",
        currencyCode: "USD",
        subscriptionPeriod: "P1M"
      },
      annual: {
        identifier: "com.example.app.premium.annual",
        title: "Premium Annual",
        description: "Annual premium subscription",
        price: 79.99,
        priceString: "$79.99",
        currencyCode: "USD",
        subscriptionPeriod: "P1Y"
      }
    }
  });

  const ENTITLEMENTS_STORAGE_KEY = "__appbuild_mock_entitlements_v2__";
  const USER_ID_STORAGE_KEY = "__appbuild_mock_user_id_v2__";
  const CONFIG_OVERRIDE_KEY = "__appbuild_mock_config_overrides__";
  const PRESET_STORAGE_KEY = "__appbuild_mock_preset__";

  function log(...args) {
    console.info(MOCK_CONFIG.logPrefix, ...args);
  }

  function warning(...args) {
    console.warn(MOCK_CONFIG.logPrefix, ...args);
  }

  function createBridgeError(message, code = "APPBUILD_MOCK_ERROR") {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function safeJsonParse(value, fallback = {}) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function safeGetItem(key) {
    try {
      return windowRef.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      windowRef.localStorage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function safeRemoveItem(key) {
    try {
      windowRef.localStorage?.removeItem(key);
    } catch {
      // Ignore development storage failures.
    }
  }

  // Load overrides if any
  const overrides = safeJsonParse(safeGetItem(CONFIG_OVERRIDE_KEY), {});
  if (overrides.platform) MOCK_CONFIG.platform = overrides.platform;

  function generateId(prefix = "mock") {
    const randomId =
      typeof global.crypto?.randomUUID === "function"
        ? global.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return `${prefix}-${randomId}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function delay(milliseconds) {
    return new Promise((resolve) => {
      windowRef.setTimeout(resolve, milliseconds);
    });
  }

  function getMockUserId() {
    const existing = safeGetItem(USER_ID_STORAGE_KEY);

    if (existing) return existing;

    const userId = generateId("mock-user");
    safeSetItem(USER_ID_STORAGE_KEY, userId);

    return userId;
  }

  function setMockUserId(userId) {
    if (!userId || typeof userId !== "string") {
      throw createBridgeError(
        "Mock user ID must be a non-empty string.",
        "INVALID_APP_USER_ID"
      );
    }

    safeSetItem(USER_ID_STORAGE_KEY, userId);

    return userId;
  }

  function loadEntitlements() {
    return safeJsonParse(safeGetItem(ENTITLEMENTS_STORAGE_KEY) || "{}", {});
  }

  function saveEntitlements(entitlements) {
    const saved = safeSetItem(
      ENTITLEMENTS_STORAGE_KEY,
      JSON.stringify(entitlements)
    );

    if (!saved) {
      warning("Unable to persist mock entitlement state.");
    }

    return saved;
  }

  function createPremiumEntitlement(productIdentifier) {
    return {
      identifier: MOCK_CONFIG.entitlementId,
      isActive: true,
      willRenew: true,
      productIdentifier,
      latestPurchaseDate: nowIso(),
      expirationDate: null,
      ownershipType: "PURCHASED",
      store: MOCK_CONFIG.platform === "ios" ? "APP_STORE" : "PLAY_STORE"
    };
  }

  function getActiveEntitlements(entitlements) {
    return Object.fromEntries(
      Object.entries(entitlements).filter(
        ([, entitlement]) => entitlement?.isActive === true
      )
    );
  }

  function buildCustomerInfo() {
    const entitlements = loadEntitlements();

    return {
      entitlements: {
        active: getActiveEntitlements(entitlements),
        all: entitlements
      },
      originalAppUserId: getMockUserId(),
      requestDate: nowIso(),
      firstSeen: null,
      managementURL: null
    };
  }

  function grantPremium(productIdentifier) {
    const entitlements = loadEntitlements();

    entitlements[MOCK_CONFIG.entitlementId] =
      createPremiumEntitlement(productIdentifier);

    saveEntitlements(entitlements);

    return buildCustomerInfo();
  }

  function expirePremium() {
    const entitlements = loadEntitlements();

    delete entitlements[MOCK_CONFIG.entitlementId];

    saveEntitlements(entitlements);

    return buildCustomerInfo();
  }

  if (MOCK_CONFIG.startPremium) {
    const entitlements = loadEntitlements();

    if (!entitlements[MOCK_CONFIG.entitlementId]?.isActive) {
      entitlements[MOCK_CONFIG.entitlementId] = createPremiumEntitlement(
        MOCK_CONFIG.products.monthly.identifier
      );

      saveEntitlements(entitlements);
    }
  }

  const MOCK_OFFERINGS = Object.freeze({
    current: {
      identifier: "default",
      serverDescription: "Default mock offering",
      availablePackages: [
        {
          identifier: "$rc_monthly",
          packageType: "MONTHLY",
          product: MOCK_CONFIG.products.monthly
        },
        {
          identifier: "$rc_annual",
          packageType: "ANNUAL",
          product: MOCK_CONFIG.products.annual
        }
      ]
    },
    all: {
      default: {
        identifier: "default",
        serverDescription: "Default mock offering",
        availablePackages: [
          {
            identifier: "$rc_monthly",
            packageType: "MONTHLY",
            product: MOCK_CONFIG.products.monthly
          },
          {
            identifier: "$rc_annual",
            packageType: "ANNUAL",
            product: MOCK_CONFIG.products.annual
          }
        ]
      }
    }
  });

  function isValidPackage(packageObject) {
    return Boolean(
      packageObject &&
        typeof packageObject === "object" &&
        packageObject.identifier &&
        packageObject.product?.identifier
    );
  }

  function createPurchasesPlugin() {
    let isConfigured = false;
    let configuredApiKey = null;
    let configuredAppUserId = null;

    function requireConfigured() {
      if (!isConfigured) {
        throw createBridgeError(
          "Purchases is not configured. Call Purchases.configure() first.",
          "PURCHASES_NOT_CONFIGURED"
        );
      }
    }

    return Object.freeze({
      async configure({ apiKey, appUserID } = {}) {
        if (!apiKey || typeof apiKey !== "string") {
          throw createBridgeError(
            "A RevenueCat API key is required.",
            "INVALID_CONFIGURATION"
          );
        }

        isConfigured = true;
        configuredApiKey = apiKey;
        configuredAppUserId = appUserID || getMockUserId();

        if (appUserID) {
          setMockUserId(appUserID);
        }

        log("Purchases.configure", {
          apiKeyPresent: Boolean(configuredApiKey),
          appUserID: configuredAppUserId
        });

        return {
          success: true,
          appUserID: configuredAppUserId
        };
      },

      async getOfferings() {
        requireConfigured();

        log("Purchases.getOfferings");

        return {
          current: MOCK_OFFERINGS.current,
          offerings: MOCK_OFFERINGS
        };
      },

      async getCustomerInfo() {
        requireConfigured();

        log("Purchases.getCustomerInfo");

        return {
          customerInfo: buildCustomerInfo()
        };
      },

      async purchasePackage({ aPackage } = {}) {
        requireConfigured();

        if (!MOCK_CONFIG.allowMockPurchases) {
          throw createBridgeError(
            "Mock purchases are disabled.",
            "PURCHASES_DISABLED"
          );
        }

        if (!isValidPackage(aPackage)) {
          throw createBridgeError(
            "A valid RevenueCat package is required.",
            "INVALID_PACKAGE"
          );
        }

        log("Purchases.purchasePackage", {
          packageIdentifier: aPackage.identifier,
          productIdentifier: aPackage.product.identifier,
          appUserID: configuredAppUserId
        });

        await delay(400);

        const customerInfo = grantPremium(aPackage.product.identifier);

        return {
          customerInfo,
          productIdentifier: aPackage.product.identifier,
          userCancelled: false,
          pending: false
        };
      },

      async restorePurchases() {
        requireConfigured();

        const customerInfo = buildCustomerInfo();

        log("Purchases.restorePurchases", {
          activeEntitlements: Object.keys(customerInfo.entitlements.active)
        });

        return {
          customerInfo
        };
      },

      async logIn({ appUserID } = {}) {
        requireConfigured();

        if (!appUserID || typeof appUserID !== "string") {
          throw createBridgeError(
            "A non-empty appUserID is required.",
            "INVALID_APP_USER_ID"
          );
        }

        configuredAppUserId = setMockUserId(appUserID);

        return {
          customerInfo: buildCustomerInfo(),
          created: false
        };
      },

      async logOut() {
        requireConfigured();

        configuredAppUserId = setMockUserId(generateId("mock-anonymous"));

        return {
          customerInfo: buildCustomerInfo()
        };
      },

      __mockGrantPremium(
        productIdentifier = MOCK_CONFIG.products.monthly.identifier
      ) {
        const customerInfo = grantPremium(productIdentifier);

        log("Mock premium entitlement granted.", { productIdentifier });

        return { customerInfo };
      },

      __mockExpirePremium() {
        const customerInfo = expirePremium();

        log("Mock premium entitlement expired.");

        return { customerInfo };
      },

      __mockReset() {
        safeRemoveItem(ENTITLEMENTS_STORAGE_KEY);
        safeRemoveItem(USER_ID_STORAGE_KEY);
        safeRemoveItem(CONFIG_OVERRIDE_KEY);
        safeRemoveItem(PRESET_STORAGE_KEY);

        isConfigured = false;
        configuredApiKey = null;
        configuredAppUserId = null;

        log("Mock Purchases state reset.");

        return { success: true };
      }
    });
  }

  function createPushPlugin() {
    const listeners = new Map();

    function getListeners(eventName) {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
      }

      return listeners.get(eventName);
    }

    return Object.freeze({
      async register() {
        const token = generateId("mock-push");

        log("Push.register", { token });

        return { token };
      },

      addListener(eventName, callback) {
        if (!eventName || typeof eventName !== "string") {
          throw createBridgeError(
            "Push event name must be a non-empty string.",
            "INVALID_PUSH_EVENT"
          );
        }

        if (typeof callback !== "function") {
          throw createBridgeError(
            "Push listener must be a function.",
            "INVALID_PUSH_LISTENER"
          );
        }

        const eventListeners = getListeners(eventName);
        eventListeners.add(callback);

        return {
          remove() {
            eventListeners.delete(callback);

            if (eventListeners.size === 0) {
              listeners.delete(eventName);
            }
          }
        };
      },

      __mockReceive(eventName, payload) {
        const eventListeners = listeners.get(eventName);

        if (!eventListeners || eventListeners.size === 0) {
          log("No push listeners registered for event.", eventName);
          return;
        }

        eventListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (error) {
            console.error(
              `${MOCK_CONFIG.logPrefix} Push listener failed for ${eventName}`,
              error
            );
          }
        });
      }
    });
  }

  const plugins = Object.freeze({
    Purchases: createPurchasesPlugin(),
    Push: createPushPlugin()
  });

  const readyPromise = new Promise((resolve) => {
    windowRef.setTimeout(() => {
      const bridgeInfo = {
        appInfo: {
          platform: MOCK_CONFIG.platform,
          appVersion: MOCK_CONFIG.appVersion,
          bundleId: MOCK_CONFIG.bundleId,
          environment: "development",
          isMock: true
        },
        capabilities: {
          push: true,
          purchases: true,
          haptics: false
        }
      };

      log("ready", bridgeInfo);

      resolve(bridgeInfo);
    }, MOCK_CONFIG.readyDelayMs);
  });

  Object.defineProperty(windowRef, "AppbuildWrapper", {
    value: Object.freeze({
      ready: readyPromise,

      plugin(name) {
        const plugin = plugins[name];

        if (!plugin) {
          warning(`Unknown plugin requested: ${String(name)}`);
          return null;
        }

        return plugin;
      },
      
      // Helper for dev tools to update mock config
      __updateConfig(newOverrides) {
        const current = safeJsonParse(safeGetItem(CONFIG_OVERRIDE_KEY), {});
        const updated = { ...current, ...newOverrides };
        safeSetItem(CONFIG_OVERRIDE_KEY, JSON.stringify(updated));
        log("Config updated. Reload required for some changes to take effect.", updated);
      }
    }),
    configurable: true,
    enumerable: false,
    writable: false
  });

  log("Development mock installed successfully.");
})(globalThis);

/**
 * src/pages/dev/DevTools.tsx
 * -----------------------------------------------------------------------
 * DEVELOPMENT-ONLY in-app panel to manage AppBuildWrapper mock state.
 * Accessible at /dev/tools in development.
 * -----------------------------------------------------------------------
 */
import React, { useState, useEffect } from "react";
import { getAppInfo, BridgeInfo } from "@/lib/wrapper";
import { getPurchases, CustomerInfo, checkPremium, Offerings } from "@/lib/wrapper/revenuecat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Smartphone, ShieldCheck, RefreshCw, Trash2, Globe, Database, AlertCircle, CheckCircle2 } from "lucide-react";

const DevTools = () => {
  const [appInfo, setAppInfo] = useState<BridgeInfo | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(localStorage.getItem("__appbuild_mock_preset__"));

  useEffect(() => {
    // If a preset was saved but not applied in this session (e.g. fresh reload), 
    // we just want the UI to reflect what's in localStorage.
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const info = await getAppInfo();
      setAppInfo(info);

      const purchases = getPurchases();
      if (purchases) {
        const { customerInfo: cInfo } = await purchases.getCustomerInfo();
        setCustomerInfo(cInfo);
        setIsPremium(await checkPremium());
        
        const offeringsData = await purchases.getOfferings();
        setOfferings(offeringsData.offerings as any);
      }
    } catch (err) {
      console.error("Error refreshing dev tools data", err);
      toast.error("Failed to refresh mock state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Expose for E2E tests
    (window as any).__REFRESH_DEV_TOOLS__ = refreshData;
    return () => {
      delete (window as any).__REFRESH_DEV_TOOLS__;
    };
  }, []);

  const togglePremium = async () => {
    const purchases = getPurchases();
    if (!purchases || !purchases.__mockGrantPremium || !purchases.__mockExpirePremium) {
      toast.error("Mock plugin not available or missing dev methods");
      return;
    }

    try {
      if (isPremium) {
        await purchases.__mockExpirePremium();
        toast.success("Premium status expired (mock)");
      } else {
        await purchases.__mockGrantPremium();
        toast.success("Premium status granted (mock)");
      }
      refreshData();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const resetMock = async () => {
    const purchases = getPurchases();
    if (purchases?.__mockReset) {
      await purchases.__mockReset();
      toast.success("Mock state reset successfully");
      window.location.reload();
    }
  };

  const changePlatform = (platform: 'ios' | 'android') => {
    if (window.AppbuildWrapper && (window.AppbuildWrapper as any).__updateConfig) {
      (window.AppbuildWrapper as any).__updateConfig({ platform });
      toast.info(`Platform set to ${platform}. Reloading...`);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const applyPreset = async (presetId: string) => {
    const p = getPurchases();
    if (!p) return;

    try {
      setLoading(true);
      await p.__mockReset?.();
      
      switch (presetId) {
        case 'active-sub':
          await p.__mockGrantPremium?.();
          break;
        case 'lapsed':
          // Just reset
          break;
        case 'ios-premium':
          if (window.AppbuildWrapper && (window.AppbuildWrapper as any).__updateConfig) {
            (window.AppbuildWrapper as any).__updateConfig({ platform: 'ios' });
          }
          await p.__mockGrantPremium?.();
          break;
        case 'android-premium':
          if (window.AppbuildWrapper && (window.AppbuildWrapper as any).__updateConfig) {
            (window.AppbuildWrapper as any).__updateConfig({ platform: 'android' });
          }
          await p.__mockGrantPremium?.();
          break;
      }
      
      localStorage.setItem("__appbuild_mock_preset__", presetId);
      setActivePreset(presetId);
      toast.success(`Preset "${presetId}" applied`);
      
      // Reload to ensure platform changes and SDK re-init take effect
      if (presetId.includes('ios') || presetId.includes('android')) {
        setTimeout(() => window.location.reload(), 1000);
      } else {
        await refreshData();
      }
    } catch (err) {
      toast.error("Failed to apply preset");
    } finally {
      setLoading(false);
    }
  };

  const getValidationReport = () => {
    if (!customerInfo || !offerings) return null;
    
    const reports: { type: 'success' | 'error' | 'warning', message: string }[] = [];
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    
    // Check if entitlements match products in offerings
    activeEntitlements.forEach(entId => {
      const entitlement = customerInfo.entitlements.active[entId];
      const productIdentifier = entitlement.productIdentifier;
      
      // Flatten all products from all offerings
      const allProductIds = Object.values(offerings.all).flatMap(offering => 
        offering.availablePackages.map(pkg => pkg.product.identifier)
      );
      
      if (!allProductIds.includes(productIdentifier)) {
        reports.push({
          type: 'error',
          message: `Entitlement "${entId}" points to product "${productIdentifier}" which is missing from offerings.`
        });
      } else {
        reports.push({
          type: 'success',
          message: `Entitlement "${entId}" correctly mapped to product "${productIdentifier}".`
        });
      }
    });

    if (activeEntitlements.length === 0) {
      reports.push({
        type: 'warning',
        message: "No active entitlements found."
      });
    }

    return reports;
  };

  if (!appInfo && !loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <ShieldCheck className="h-6 w-6" />
              <CardTitle>Mock SDK Not Found</CardTitle>
            </div>
            <CardDescription>
              The AppBuildWrapper mock is not active. This page only works when the mock is injected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Current Host: <code className="bg-muted px-1 rounded">{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</code>
            </p>
            <p className="text-sm">
              window.AppbuildWrapper status: <Badge variant="outline">{typeof window !== 'undefined' && window.AppbuildWrapper ? "Present" : "Missing"}</Badge>
            </p>
            <Button onClick={refreshData} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Reconnecting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-muted-foreground">Manage AppBuildWrapper mock state and entitlements.</p>
        </div>
        <Button variant="outline" size="icon" onClick={refreshData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bridge Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Bridge Status</CardTitle>
            </div>
            <CardDescription>Current SDK connection info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Environment</span>
              <Badge variant={appInfo?.appInfo.environment === 'development' ? 'secondary' : 'default'}>
                {appInfo?.appInfo.environment || 'Unknown'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Platform</span>
              <div className="flex gap-2">
                <Button 
                  variant={appInfo?.appInfo.platform === 'ios' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => changePlatform('ios')}
                >
                  iOS
                </Button>
                <Button 
                  variant={appInfo?.appInfo.platform === 'android' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => changePlatform('android')}
                >
                  Android
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Is Mock</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {appInfo?.appInfo.isMock ? 'YES' : 'NO'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Premium Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Entitlements</CardTitle>
            </div>
            <CardDescription>Toggle premium status instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="premium-toggle">Premium Status</Label>
                <p className="text-xs text-muted-foreground">Active for "premium" entitlement ID</p>
              </div>
              <Switch 
                id="premium-toggle" 
                checked={isPremium} 
                onCheckedChange={togglePremium}
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Scenarios</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={activePreset === 'active-sub' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => applyPreset('active-sub')}
                >
                  Active Sub
                </Button>
                <Button 
                  variant={activePreset === 'lapsed' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => applyPreset('lapsed')}
                >
                  Lapsed
                </Button>
                <Button 
                  variant={activePreset === 'ios-premium' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => applyPreset('ios-premium')}
                >
                  iOS Premium
                </Button>
                <Button 
                  variant={activePreset === 'android-premium' ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => applyPreset('android-premium')}
                >
                  Android Prem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Report */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <CardTitle>Validation Report</CardTitle>
            </div>
            <CardDescription>Checks for mismatches between offerings and entitlements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {getValidationReport()?.map((report, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-md border ${
                report.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-600' :
                report.type === 'error' ? 'bg-destructive/5 border-destructive/20 text-destructive' :
                'bg-amber-500/5 border-amber-500/20 text-amber-600'
              }`}>
                {report.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                <span className="text-sm font-medium">{report.message}</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">No data to validate.</p>}
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Customer Info Payload</CardTitle>
            </div>
            <CardDescription>Raw JSON returned by the Purchases plugin</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/50 font-mono text-[10px]">
              <pre>{JSON.stringify(customerInfo, null, 2)}</pre>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="md:col-span-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Clear all local storage associated with the mock SDK (entitlements, user IDs).
            </p>
            <Button variant="destructive" size="sm" onClick={resetMock}>
              <Trash2 className="mr-2 h-4 w-4" />
              Reset All Mock Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevTools;

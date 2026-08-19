import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const CsdhRiskCalculator = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>({});

  const update = (key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Chronic Subdural Hematoma Risk Assessment</span>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" /> Copy Data
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simplified preview of the schema structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Patient Age</Label>
            <Input type="number" value={data.age_years || ""} onChange={(e) => update("age_years", parseInt(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>GCS Total</Label>
            <Input type="number" value={data.gcs_total || ""} onChange={(e) => update("gcs_total", parseInt(e.target.value))} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Clinical decision-support tool for structured assessment of chronic SDH.
        </p>
      </CardContent>
    </Card>
  );
};

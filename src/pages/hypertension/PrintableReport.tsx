import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";

interface PrintableReportProps {
  title?: string;
  children?: React.ReactNode;
}

export default function PrintableReport({ title = "Clinical Report", children }: PrintableReportProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="border-2 border-primary/20 no-print">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {children || (
          <p className="text-sm text-muted-foreground">
            Select options from the evaluation and treatment tabs to generate a printable clinical summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

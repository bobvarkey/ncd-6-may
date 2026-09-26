import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { boneHealthApp } from "@/data/bone-health-app";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AppState = {
  group: "younger" | "older" | null;
  secondary: boolean;
  treated: boolean;
  initial: "low" | "high" | "very_high" | null;
};

const initialState: AppState = {
  group: null,
  secondary: false,
  treated: false,
  initial: null,
};

type HistoryEntry = {
  nodeId: string;
  state: AppState;
};

export default function BoneHealthGuidedApp() {
  const [currentNodeId, setCurrentNodeId] = useState(boneHealthApp.start_node_id || "start");
  const [state, setState] = useState<AppState>(initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const currentNode = boneHealthApp.nodes.find((n) => n.id === currentNodeId);

  const handleSelect = useCallback((option: any) => {
    // Push current to history
    setHistory((prev) => [...prev, { nodeId: currentNodeId, state: { ...state } }]);
    // Merge new state
    const newState = { ...state, ...option.set };
    setState(newState);
    // Navigate
    setCurrentNodeId(option.next);
  }, [currentNodeId, state]);

  const handleBack = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentNodeId(last.nodeId);
    setState(last.state);
  }, [history]);

  const handleRestart = useCallback(() => {
    setCurrentNodeId(boneHealthApp.start_node_id || "start");
    setState(initialState);
    setHistory([]);
  }, []);

  if (!currentNode) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Assessment data not loaded.</p>
          <Button variant="outline" onClick={handleRestart} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" /> Restart
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {boneHealthApp.title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={history.length === 0}
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRestart} title="Restart">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Guided assessment • v{boneHealthApp.algorithm_version} • {boneHealthApp.exported_on}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{currentNode.title}</h3>
          {currentNode.body && (
            <div className="text-sm text-muted-foreground space-y-2">
              {currentNode.body.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>

        {currentNode.options && currentNode.options.length > 0 && (
          <div className="flex flex-col gap-2">
            {currentNode.options.map((opt: any, idx: number) => (
              <Button
                key={opt.id || idx}
                variant="outline"
                className={cn(
                  "justify-between text-left h-auto py-3 px-4",
                  "hover:bg-primary/5 hover:border-primary/30"
                )}
                onClick={() => handleSelect(opt)}
              >
                <span>{opt.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}

        {/* State indicator */}
        {(state.group || state.secondary || state.treated || state.initial) && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <span className="font-medium">State:</span>{" "}
            {[
              state.group && `group: ${state.group}`,
              state.secondary && "secondary",
              state.treated && "treated",
              state.initial && `risk: ${state.initial}`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

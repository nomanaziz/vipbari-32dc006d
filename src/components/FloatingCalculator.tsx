import { useState, useRef, useCallback, useEffect } from "react";
import { X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingCalculatorProps {
  onClose: () => void;
}

export function FloatingCalculator({ onClose }: FloatingCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [operand, setOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // Drag state
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 140, y: 80 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const inputDigit = (d: string) => {
    if (waitingForNext) {
      setDisplay(d);
      setWaitingForNext(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  };

  const inputDot = () => {
    if (waitingForNext) { setDisplay("0."); setWaitingForNext(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const calculate = (a: number, op: string, b: number): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (operand !== null && operator && !waitingForNext) {
      const result = calculate(operand, operator, current);
      setDisplay(String(result));
      setOperand(result);
    } else {
      setOperand(current);
    }
    setOperator(op);
    setWaitingForNext(true);
  };

  const handleEquals = () => {
    if (operand === null || !operator) return;
    const current = parseFloat(display);
    const result = calculate(operand, operator, current);
    setDisplay(String(result));
    setOperand(null);
    setOperator(null);
    setWaitingForNext(true);
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    if (operand !== null) {
      setDisplay(String(operand * current / 100));
    } else {
      setDisplay(String(current / 100));
    }
    setWaitingForNext(true);
  };

  const clear = () => { setDisplay("0"); setOperand(null); setOperator(null); setWaitingForNext(false); };
  const backspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : "0");

  const btn = (label: string, onClick: () => void, className = "") => (
    <button
      key={label}
      onClick={onClick}
      className={`h-10 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[9999] w-[280px] rounded-xl border bg-card shadow-2xl select-none"
    >
      {/* Title bar — draggable */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing bg-muted rounded-t-xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-xs font-semibold text-muted-foreground">ক্যালকুলেটর</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Display */}
      <div className="px-3 py-2">
        <div className="text-right text-2xl font-mono font-bold truncate bg-background rounded-lg px-3 py-2 border">
          {display}
        </div>
        {operator && (
          <div className="text-right text-xs text-muted-foreground pr-1 mt-0.5">
            {operand} {operator}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {btn("C", clear, "bg-destructive/15 text-destructive hover:bg-destructive/25")}
        {btn("⌫", backspace, "bg-muted hover:bg-muted/80 text-foreground")}
        {btn("%", handlePercent, "bg-muted hover:bg-muted/80 text-foreground")}
        {btn("÷", () => handleOperator("÷"), `bg-primary/15 text-primary hover:bg-primary/25 ${operator === "÷" && waitingForNext ? "ring-2 ring-primary" : ""}`)}

        {btn("7", () => inputDigit("7"), "bg-background hover:bg-accent text-foreground border")}
        {btn("8", () => inputDigit("8"), "bg-background hover:bg-accent text-foreground border")}
        {btn("9", () => inputDigit("9"), "bg-background hover:bg-accent text-foreground border")}
        {btn("×", () => handleOperator("×"), `bg-primary/15 text-primary hover:bg-primary/25 ${operator === "×" && waitingForNext ? "ring-2 ring-primary" : ""}`)}

        {btn("4", () => inputDigit("4"), "bg-background hover:bg-accent text-foreground border")}
        {btn("5", () => inputDigit("5"), "bg-background hover:bg-accent text-foreground border")}
        {btn("6", () => inputDigit("6"), "bg-background hover:bg-accent text-foreground border")}
        {btn("-", () => handleOperator("-"), `bg-primary/15 text-primary hover:bg-primary/25 ${operator === "-" && waitingForNext ? "ring-2 ring-primary" : ""}`)}

        {btn("1", () => inputDigit("1"), "bg-background hover:bg-accent text-foreground border")}
        {btn("2", () => inputDigit("2"), "bg-background hover:bg-accent text-foreground border")}
        {btn("3", () => inputDigit("3"), "bg-background hover:bg-accent text-foreground border")}
        {btn("+", () => handleOperator("+"), `bg-primary/15 text-primary hover:bg-primary/25 ${operator === "+" && waitingForNext ? "ring-2 ring-primary" : ""}`)}

        {btn("0", () => inputDigit("0"), "col-span-2 bg-background hover:bg-accent text-foreground border")}
        {btn(".", inputDot, "bg-background hover:bg-accent text-foreground border")}
        {btn("=", handleEquals, "bg-primary text-primary-foreground hover:bg-primary/90")}
      </div>
    </div>
  );
}

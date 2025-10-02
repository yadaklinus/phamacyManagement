// ShadCalc.tsx
// A full-featured calculator library built with shadcn/ui for Next.js App Router
// Features
// - Expression engine (safe, no eval) supporting + - * / ^ % parentheses and unary +/-
// - Memory keys (MC, MR, M+, M-)
// - History with recall
// - Keyboard support
// - Discount & tax helpers (±%, VAT add/remove)
// - QuickCalc popover for inputs and a Dialog calculator
// - Fully typed with TypeScript
// - Headless hook API + UI components

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { X, History, Percent, Divide, Plus, Minus, Equal, Delete, LucideIcon, Calculator, Save, DollarSign } from "lucide-react";

// -----------------------------
// Expression Engine (Shunting-yard)
// -----------------------------

type TokenType = "num" | "op" | "lparen" | "rparen";

type Token = { t: TokenType; v?: string };

type Assoc = "L" | "R";

const OPS: Record<string, { p: number; a: Assoc; u?: boolean; fn: (...xs: number[]) => number }> = {
  "+": { p: 1, a: "L", fn: (a, b) => a + b },
  "-": { p: 1, a: "L", fn: (a, b) => a - b },
  "*": { p: 2, a: "L", fn: (a, b) => a * b },
  "/": { p: 2, a: "L", fn: (a, b) => a / b },
  "%": { p: 3, a: "L", fn: (a, b) => a % b },
  "^": { p: 4, a: "R", fn: (a, b) => Math.pow(a, b) },
  "u+": { p: 5, a: "R", u: true, fn: (a) => +a },
  "u-": { p: 5, a: "R", u: true, fn: (a) => -a },
};

function tokenize(src: string): Token[] {
  const s = src.replace(/\s+/g, "");
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: "num", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === "(") { out.push({ t: "lparen" }); i++; continue; }
    if (ch === ")") { out.push({ t: "rparen" }); i++; continue; }
    if (/[+\-*/%^]/.test(ch)) { out.push({ t: "op", v: ch }); i++; continue; }
    throw new Error(`Invalid character: ${ch}`);
  }
  return out;
}

function toRPN(tokens: Token[]): (Token & { t: "num" | "op" })[] {
  const out: (Token & { t: "num" | "op" })[] = [];
  const stack: Token[] = [];
  let prev: Token | null = null;
  for (const tok of tokens) {
    if (tok.t === "num") {
      out.push(tok as any);
      prev = tok; continue;
    }
    if (tok.t === "op") {
      const isUnary = !prev || (prev.t !== "num" && prev.t !== "rparen");
      const key = isUnary && (tok.v === "+" || tok.v === "-") ? ("u" + tok.v) : tok.v!;
      const o1 = OPS[key!];
      if (!o1) throw new Error("Unknown operator");
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.t === "op") {
          const o2 = OPS[(top.v as string)];
          if (
            (o1.a === "L" && o1.p <= o2.p) ||
            (o1.a === "R" && o1.p < o2.p)
          ) {
            out.push(stack.pop() as any);
            continue;
          }
        }
        break;
      }
      stack.push({ t: "op", v: key! });
      prev = tok; continue;
    }
    if (tok.t === "lparen") { stack.push(tok); prev = tok; continue; }
    if (tok.t === "rparen") {
      while (stack.length && stack[stack.length - 1].t !== "lparen") {
        out.push(stack.pop() as any);
      }
      if (!stack.length) throw new Error("Mismatched parentheses");
      stack.pop();
      prev = tok; continue;
    }
  }
  while (stack.length) {
    const t = stack.pop()!;
    if (t.t === "lparen" || t.t === "rparen") throw new Error("Mismatched parentheses");
    out.push(t as any);
  }
  return out;
}

function evalRPN(rpn: (Token & { t: "num" | "op" })[]): number {
  const st: number[] = [];
  for (const t of rpn) {
    if (t.t === "num") st.push(parseFloat(t.v!));
    else if (t.t === "op") {
      const op = OPS[t.v!];
      if (!op) throw new Error("Unknown operator");
      if (op.u) {
        const a = st.pop();
        if (a === undefined) throw new Error("Bad expression");
        st.push(op.fn(a));
      } else {
        const b = st.pop();
        const a = st.pop();
        if (a === undefined || b === undefined) throw new Error("Bad expression");
        st.push(op.fn(a, b));
      }
    }
  }
  if (st.length !== 1) throw new Error("Bad expression");
  const v = st[0];
  if (!Number.isFinite(v)) throw new Error("Result not finite");
  return v;
}

export function safeEval(expr: string): number {
  if (!expr.trim()) return 0;
  const tokens = tokenize(expr);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}

// -----------------------------
// Hook API
// -----------------------------

export type CalcHistoryItem = { id: string; expr: string; result: number; at: number };

export function useCalculator(initial: string = "") {
  const [expr, setExpr] = useState<string>(initial);
  const [display, setDisplay] = useState<string>(initial);
  const [memory, setMemory] = useState<number>(0);
  const [history, setHistory] = useState<CalcHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    try {
      const res = safeEval(display);
      const item: CalcHistoryItem = { id: crypto.randomUUID(), expr: display, result: res, at: Date.now() };
      setHistory((h) => [item, ...h].slice(0, 100));
      setExpr(String(res));
      setDisplay(String(res));
      setError(null);
      return res;
    } catch (e: any) {
      setError(e.message || "Invalid expression");
      return NaN;
    }
  }, [display]);

  const clear = useCallback(() => { setExpr(""); setDisplay(""); setError(null); }, []);

  const input = useCallback((s: string) => {
    setDisplay((d) => (d === "0" ? s : d + s));
  }, []);

  const backspace = useCallback(() => { setDisplay((d) => d.slice(0, -1) || ""); }, []);

  const memAdd = useCallback((v?: number) => setMemory((m) => m + (v ?? Number(expr || 0))), [expr]);
  const memSub = useCallback((v?: number) => setMemory((m) => m - (v ?? Number(expr || 0))), [expr]);
  const memClr = useCallback(() => setMemory(0), []);
  const memRecall = useCallback(() => setDisplay((d) => d + String(memory)), [memory]);

  // Helpers: discount %, add VAT %, remove VAT % (reverse tax)
  const applyPercent = useCallback((pct: number, base?: number) => {
    const b = base ?? Number(expr || 0);
    const res = b * (pct / 100);
    setDisplay(String(res));
    setExpr(String(res));
    return res;
  }, [expr]);

  const applyDiscount = useCallback((pct: number, base?: number) => {
    const b = base ?? Number(expr || 0);
    const res = b * (1 - pct / 100);
    setDisplay(String(res)); setExpr(String(res)); return res;
  }, [expr]);

  const addVAT = useCallback((pct: number, base?: number) => {
    const b = base ?? Number(expr || 0);
    const res = b * (1 + pct / 100);
    setDisplay(String(res)); setExpr(String(res)); return res;
  }, [expr]);

  const removeVAT = useCallback((pct: number, gross?: number) => {
    const g = gross ?? Number(expr || 0);
    const res = g / (1 + pct / 100);
    setDisplay(String(res)); setExpr(String(res)); return res;
  }, [expr]);

  return {
    state: { expr, display, error, memory, history },
    actions: { setDisplay, input, clear, backspace, compute, memAdd, memSub, memClr, memRecall, applyPercent, applyDiscount, addVAT, removeVAT }
  } as const;
}

// -----------------------------
// UI Building Blocks
// -----------------------------

type KeyDef = { label: React.ReactNode; onPress: () => void; aria?: string; wide?: boolean };

function Key({ label, onPress, aria, wide }: KeyDef) {
  return (
    <Button
      variant="secondary"
      className={`h-12 rounded-2xl ${wide ? "col-span-2" : ""}`}
      onClick={onPress}
      aria-label={aria || (typeof label === "string" ? label : "key")}
    >
      {label}
    </Button>
  );
}

export function CalculatorCard({ className = "" }: { className?: string }) {
  const { state, actions } = useCalculator("0");
  const { display, error, memory, history } = state;
  const { input, clear, backspace, compute, memAdd, memSub, memClr, memRecall, applyDiscount, addVAT, removeVAT } = actions;

  // keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/[0-9.+\-*/%^()]/.test(e.key)) { e.preventDefault(); input(e.key); }
      else if (e.key === "Enter") { e.preventDefault(); compute(); }
      else if (e.key === "Backspace") { e.preventDefault(); backspace(); }
      else if (e.key.toLowerCase() === "c") { e.preventDefault(); clear(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, compute, backspace, clear]);

  const numKey = (n: string) => () => input(n);

  const keys: KeyDef[] = [
    { label: <Percent className="w-4 h-4" />, onPress: () => input("%"), aria: "percent" },
    { label: "(", onPress: numKey("(") },
    { label: ")", onPress: numKey(")") },
    { label: <Delete className="w-4 h-4" />, onPress: backspace, aria: "backspace" },

    { label: "7", onPress: numKey("7") },
    { label: "8", onPress: numKey("8") },
    { label: "9", onPress: numKey("9") },
    { label: <Divide className="w-4 h-4" />, onPress: numKey("/") },

    { label: "4", onPress: numKey("4") },
    { label: "5", onPress: numKey("5") },
    { label: "6", onPress: numKey("6") },
    { label: <X className="w-4 h-4" />, onPress: numKey("*") },

    { label: "1", onPress: numKey("1") },
    { label: "2", onPress: numKey("2") },
    { label: "3", onPress: numKey("3") },
    { label: <Minus className="w-4 h-4" />, onPress: numKey("-") },

    { label: "0", onPress: numKey("0") },
    { label: ".", onPress: numKey(".") },
    { label: <Plus className="w-4 h-4" />, onPress: numKey("+") },
    { label: <Equal className="w-4 h-4" />, onPress: compute, wide: false },
  ];

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg rounded-2xl ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2"><Calculator className="w-5 h-5"/>Calculator</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={memory !== 0 ? "default" : "secondary"}>M: {memory}</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => memClr()} aria-label="clear memory">
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>MC</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={display} onChange={(e) => actions.setDisplay(e.target.value)} className="text-right text-2xl h-12"/>
        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="grid grid-cols-4 gap-2">
          {keys.map((k, i) => (
            <Key key={i} {...k} />
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => memAdd()}>M+</Button>
          <Button variant="outline" onClick={() => memSub()}>M-</Button>
          <Button variant="outline" onClick={() => memRecall()}>MR</Button>
          <Button variant="destructive" onClick={() => clear()}>C</Button>
        </div>

        <Separator/>
        

        <div>
          <div className="text-sm font-medium mb-1 flex items-center gap-2"><History className="w-4 h-4"/>History</div>
          <ScrollArea className="h-24 rounded-md border p-2">
            {history.length === 0 && <div className="text-xs text-muted-foreground">No history yet</div>}
            <div className="space-y-1">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <button className="text-left hover:underline" onClick={() => actions.setDisplay(h.expr)}>{h.expr}</button>
                  <span className="font-semibold">= {h.result}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------
// QuickCalc for Inputs (Popover)
// -----------------------------

export function QuickCalcInput({ value, onChange, placeholder = "", label }: { value?: string | number; onChange?: (v: number) => void; placeholder?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const { state, actions } = useCalculator(String(value ?? ""));

  const apply = useCallback(() => {
    const v = actions.compute();
    if (Number.isFinite(v)) onChange?.(v);
    setOpen(false);
  }, [actions, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full">
          {label && <div className="text-sm mb-1">{label}</div>}
          <Input readOnly value={state.display} placeholder={placeholder} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-3">
        <CalculatorCard />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={apply}>Use Value</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// -----------------------------
// Dialog Calculator (global)
// -----------------------------

export function CalculatorDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2"><Calculator className="w-4 h-4"/>Open Calculator</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <CalculatorCard />
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------
// Example Showcase (default export for easy preview). Remove in production.
// -----------------------------

export default function ShadCalcDemo() {
  const [price, setPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => { setTotal(price * qty); }, [price, qty]);

  return (
    <div className="p-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2"><DollarSign className="w-5 h-5"/>Line Item Calculator</h2>
        <QuickCalcInput label="Unit Price" value={price} onChange={setPrice} placeholder="Tap to calculate" />
        <QuickCalcInput label="Quantity" value={qty} onChange={(v) => setQty(Math.max(0, Math.round(v)))} placeholder="Tap to calculate" />
        <div className="text-xl font-semibold">Total: {Number.isFinite(total) ? total.toFixed(2) : "-"}</div>
        <div className="flex gap-2">
          <CalculatorDialog />
        </div>
      </div>
      <div>
        <CalculatorCard />
      </div>
    </div>
  );
}

// -----------------------------
// Usage Notes
// -----------------------------
// 1) Save this file as app/components/ShadCalc.tsx (or similar)
// 2) Ensure shadcn/ui is installed and these components are generated: button, card, input, dialog, popover, badge, scroll-area, separator, tooltip, sheet (optional)
// 3) Import and use:
//    import ShadCalcDemo, { CalculatorCard, CalculatorDialog, QuickCalcInput, useCalculator, safeEval } from "@/components/ShadCalc";
// 4) In forms, wrap numeric fields with <QuickCalcInput/> to get tap-to-calc behavior.
// 5) Access the engine directly with safeEval("12 + 3*(4-1)").
// 6) Tailwind + shadcn required. No eval used; expression engine is internal.

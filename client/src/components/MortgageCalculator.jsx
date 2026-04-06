/**
 * components/MortgageCalculator.jsx
 *
 * Repayment mortgage calculator matching the design reference (s3-property-detail.png).
 *
 * Inputs (matching the design):
 *   Deposit %  — percentage of property price (default 20%)
 *   Rate %     — annual interest rate (default 4.5%)
 *   Term (yrs) — mortgage term in years (default 25)
 *
 * The property price comes from the listing and is not editable here.
 * Monthly payment is calculated using the standard annuity formula.
 * All fields are editable inline with a pencil icon on each row.
 *
 * Props:
 *   defaultPrice — the listing price pre-filled from the property document
 */
import { useState } from 'react';

function calcMonthly(principal, annualRate, termYears) {
  if (!principal || !annualRate || !termYears) return null;
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
  </svg>
);

export default function MortgageCalculator({ defaultPrice = 0 }) {
  const [deposit, setDeposit] = useState(20);   // percentage
  const [rate, setRate]       = useState(4.5);
  const [term, setTerm]       = useState(25);

  const price     = Number(defaultPrice) || 0;
  const principal = price * (1 - deposit / 100);
  const monthly   = calcMonthly(principal, rate, term);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <h3 className="font-bold text-slate-800 text-sm">Mortgage Calculator</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Fields row */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          {/* Deposit % */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Deposit %</p>
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
              <input
                type="number"
                min={0}
                max={99}
                step={1}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full text-slate-800 font-semibold focus:outline-none bg-transparent text-sm"
              />
              <PencilIcon />
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Rate %</p>
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
              <input
                type="number"
                min={0}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full text-slate-800 font-semibold focus:outline-none bg-transparent text-sm"
              />
              <PencilIcon />
            </div>
          </div>

          {/* Term */}
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Term (yrs)</p>
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
              <input
                type="number"
                min={1}
                max={40}
                step={1}
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full text-slate-800 font-semibold focus:outline-none bg-transparent text-sm"
              />
              <PencilIcon />
            </div>
          </div>
        </div>

        {/* Result */}
        {monthly !== null && price > 0 && (
          <div className="flex items-baseline justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Est. monthly payment</span>
            <span className="text-xl font-bold text-slate-900">
              £{Math.round(monthly).toLocaleString()}
              <span className="text-sm font-medium text-slate-400"> / mo</span>
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-400">For illustration only. Speak to a mortgage adviser.</p>
      </div>
    </div>
  );
}

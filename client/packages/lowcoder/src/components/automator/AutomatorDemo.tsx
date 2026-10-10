import { trans } from "i18n";
import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const reveal = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;
const Demo = styled.div<{ $compact: boolean }>`
  border: 1px solid #ded9ef; border-radius: 16px; overflow: hidden;
  background: #fff; box-shadow: 0 16px 42px #38305b0b; color: #25243b;
  width: 100%; min-width: 0;
  .demo-bar { display: flex; justify-content: space-between; gap: 12px; padding: 12px 16px;
    background: #faf9fd; border-bottom: 1px solid #eeeaf5; font-size: 11px; color: #777086; }
  .demo-stage { padding: ${p => p.$compact ? '16px' : '24px'}; min-height: ${p => p.$compact ? '160px' : '230px'}; }
  .demo-prompt { padding: 10px 14px; border-radius: 12px 12px 3px 12px; background: #eee9fb;
    margin: 0 0 18px auto; max-width: 340px; font-size: 13px; }
  .demo-app { border: 1px solid #e8e5ef; border-radius: 9px; padding: 14px; animation: ${reveal} .5s ease both; }
  .demo-app h4 { margin: 0 0 12px; font-size: 15px; }
  .demo-form { display: flex; gap: 8px; font-size: 11px; margin-bottom: 12px; }
  .demo-input { border: 1px solid #ddd; border-radius: 5px; padding: 6px 9px; flex: 1; color: #847f90; }
  .demo-add { border-radius: 5px; background: #7860ba; padding: 6px 12px; color: white; }
  .demo-row { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; padding: 8px 0; border-top: 1px solid #eee; }
  .demo-status { color: #46755e; }
  .demo-placeholder { height: 113px; border: 1px dashed #d8d2e6; border-radius: 9px; display: grid; place-items: center; color: #91879f; font-size: 13px; }
  .demo-footer { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; padding: 10px 14px; border-top: 1px solid #eeeaf5; }
  button { cursor: pointer; border: 0; border-radius: 6px; background: transparent; color: #777086; padding: 6px 8px; font: inherit; font-size: 11px; }
  button[aria-current="step"] { background: #eee9fb; color: #59418f; }
  button:focus-visible { outline: 2px solid #7860ba; outline-offset: 2px; }
  .demo-play { margin-left: auto; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

/** Illustrative UI only: never runs a query or changes the user's app. */
export function AutomatorDemo({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(2);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!preference.matches) { setStep(0); setPlaying(true); }
    const stop = () => { if (preference.matches) { setPlaying(false); setStep(2); } };
    preference.addEventListener?.('change', stop);
    return () => preference.removeEventListener?.('change', stop);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step === 2) setPlaying(false);
      else setStep(step + 1);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [step, playing]);
  return <Demo $compact={compact} aria-label={trans("automator.demo.label")}>
    <div className="demo-bar"><strong>LOWCODER AUTOMATOR</strong><span>{trans("automator.demo.illustrative")}</span></div>
    <div className="demo-stage">
      <p className="demo-prompt">{step === 2 ? trans("automator.demo.refinePrompt") : trans("automator.demo.buildPrompt")}</p>
      {step === 0 ? <div className="demo-placeholder">{trans("automator.demo.placeholder")}</div> : <div className="demo-app">
        <h4>{trans("automator.demo.appTitle")}</h4>
        <div className="demo-form"><span className="demo-input">{trans("automator.demo.newTask")}</span><span className="demo-add">{trans("automator.demo.addTask")}</span></div>
        {step === 2 && <div className="demo-form"><span className="demo-input">{trans("automator.demo.statusFilter")}</span></div>}
        <div className="demo-row"><span>{trans("automator.demo.groceries")}</span><span className="demo-status">{trans("automator.demo.pending")}</span></div>
        {!compact && <div className="demo-row"><span>{trans("automator.demo.dentist")}</span><span className="demo-status">{trans("automator.demo.pending")}</span></div>}
      </div>}
    </div>
    <div className="demo-footer">
      {[trans("automator.demo.describe"), trans("automator.demo.build"), trans("automator.demo.refine")].map((label, index) => <button key={label} aria-current={step === index ? 'step' : undefined}
        onClick={() => { setPlaying(false); setStep(index); }}>{index + 1}. {label}</button>)}
      <button className="demo-play" onClick={() => { if (playing) setPlaying(false); else { setStep(0); setPlaying(true); } }}>{playing ? trans("automator.demo.pause") : trans("automator.demo.replay")}</button>
    </div>
  </Demo>;
}

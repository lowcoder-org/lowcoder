import { ReactNode, useEffect, useRef } from "react";
import styled from "styled-components";
import { AutomatorDemo } from "components/automator/AutomatorDemo";

const Story = styled.section`
  color: #26243b; margin: 24px 0; container-type: inline-size;
  .story-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; align-items: center;
    padding: clamp(24px, 3vw, 40px); border: 1px solid #e7e2f0; border-radius: 20px;
    background: linear-gradient(125deg, #faf8ff, #f5f8fc 65%, #eef6f4); }
  .story-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .14em; color: #746091; text-transform: uppercase; }
  h1 { font-size: clamp(28px, 2.8vw, 40px); line-height: 1.12; letter-spacing: -.035em; margin: 16px 0; color: #252137; }
  .story-lead { color: #615c71; font-size: 16px; line-height: 1.75; max-width: 510px; }
  .story-action { margin-top: 24px; }
  .story-action .ant-btn { white-space: normal; height: auto; min-height: 40px; max-width: 100%; padding: 8px 16px; }
  .story-note { color: #777182; font-size: 12px; line-height: 1.6; margin: 12px 0 0; }
  .story-benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 32px 8px 8px; }
  .story-benefits article { padding: 0 16px; border-left: 2px solid #e8e0f4; }
  h3 { font-size: 16px; margin: 0 0 8px; }
  .story-benefits p { color: #777182; line-height: 1.65; margin: 0; font-size: 13px; }
  .support-journey { background: #fff; border: 1px solid #e7e2f0; border-radius: 16px; padding: 28px; box-shadow: 0 16px 42px #38305b0b; }
  .support-step { display: flex; gap: 16px; padding: 18px 0; }
  .support-step + .support-step { border-top: 1px solid #f0edf5; }
  .support-number { flex: 0 0 30px; height: 30px; border-radius: 50%; background: #eee9f7; color: #7659a9; display: grid; place-items: center; font-size: 12px; }
  .support-step strong { font-size: 14px; }
  .support-step p { color: #777182; font-size: 12px; line-height: 1.6; margin: 6px 0 0; }
  details { margin-top: 24px; border: 1px solid #e7e2f0; border-radius: 12px; padding: 16px 20px; }
  summary { cursor: pointer; font-weight: 600; }
  video { display: block; width: 100%; max-height: 620px; margin-top: 18px; border-radius: 8px; background: #f7f7fa; }
  @container (max-width: 620px) { .story-hero { grid-template-columns: 1fr; gap: 28px; } .story-benefits { grid-template-columns: 1fr; } }
  @media (max-width: 900px) { .story-hero { grid-template-columns: 1fr; gap: 28px; } }
  @media (max-width: 640px) { .story-benefits { grid-template-columns: 1fr; gap: 20px; } }
`;

export function SubscriptionStory({ ai, action }: { ai: boolean; action: ReactNode }) {
  const demoRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ai && window.location.hash === '#demo' && demoRef.current) {
      demoRef.current.open = true;
      demoRef.current.scrollIntoView({ block: 'start' });
    }
  }, [ai]);
  const benefits = ai ? [
    ['Skip the blank canvas', 'Turn a description into tables, forms and layouts you can keep working on.'],
    ['Make the next change in words', 'Ask for a filter, adjust a layout or refine component properties while you build.'],
    ['Keep control of your app', 'Work with native Lowcoder components. Choose your model and continue editing by hand.'],
  ] : [
    ['Spend less time stuck', 'Bring your Lowcoder questions to the team when an issue interrupts your work.'],
    ['Keep the context together', 'Descriptions, screenshots, attachments and replies stay with the ticket inside Lowcoder.'],
    ['Give your builders a direct line', 'One workspace subscription gives every admin and editor access to the Support Center.'],
  ];
  return <Story>
    <div className="story-hero">
      <div>
        <span className="story-eyebrow">{ai ? 'AI Robot · Powered by Lowcoder Automator' : 'Lowcoder Support · Built into your workspace'}</span>
        <h1>{ai ? <>Less setup work.<br />More app.</> : <>Keep building.<br />We’re here when you get stuck.</>}</h1>
        <p className="story-lead">{ai
          ? 'Describe what you need. Watch Automator turn it into editable components, then refine it together—right inside the Lowcoder editor.'
          : 'A difficult issue shouldn’t bring your next release to a standstill. Give your team a direct path to Lowcoder support, with every question and next step in one place.'}</p>
        <div className="story-action">{action}</div>
        <p className="story-note">{ai ? 'For workspace admins and editors. Viewers are not billed. Bring your own model; provider usage is separate.' : 'For all admins and editors in your workspace. App viewers are not billed.'}</p>
      </div>
      {ai ? <AutomatorDemo /> : <div className="support-journey" aria-label="How Lowcoder support works">
        <span className="story-eyebrow">From blocked to a clear next step</span>
        {[
          ['Share what’s in the way', 'Open a ticket in Lowcoder. Add the details and screenshots that tell the story.'],
          ['Work through it with us', 'Follow replies and the assigned support contact. Deeper technical issues can be escalated.'],
          ['Keep your team moving', 'Track the status and keep the conversation available as your work progresses.'],
        ].map(([title, text], i) => <div className="support-step" key={title}><span className="support-number">{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></div>)}
      </div>}
    </div>
    <div className="story-benefits">{benefits.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    {ai && <details id="demo" ref={demoRef}><summary>Watch Automator build a real to-do app</summary>
      <p className="story-note">Recorded in the Lowcoder editor. Results and response time depend on your model and request.</p>
      <video controls playsInline preload="none" poster={`${import.meta.env.BASE_URL}automator/todo-app.png`} aria-label="Automator building a to-do app">
        <source src={`${import.meta.env.BASE_URL}automator/todo-app.mp4`} type="video/mp4" />
        <track kind="captions" src={`${import.meta.env.BASE_URL}automator/todo-app.vtt`} srcLang="en" label="Demo guide" />
        Your browser does not support this video.
      </video>
    </details>}
  </Story>;
}

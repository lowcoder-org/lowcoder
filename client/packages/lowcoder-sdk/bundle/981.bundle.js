"use strict";(self.webpackChunklowcoder_sdk=self.webpackChunklowcoder_sdk||[]).push([[981],{68981:(e,t,o)=>{o.r(t),o.d(t,{DateMobileUIView:()=>m,DateRangeMobileUIView:()=>w});var s=o(31085),n=o(64008),a=o(84373),i=o(23464),d=o.n(i),l=o(87741),r=o(36983),c=o(30729),u=(o(41594),o(50010));const f=async e=>{const t=(await Promise.all([o.e(556),o.e(139),o.e(895)]).then(o.bind(o,68895))).default,s=d()(e.minDate,l.ih),n=d()(e.maxDate,l.ih),{disabledHours:a,disabledMinutes:i,disabledSeconds:c}=e.disabledTime();t.prompt({getContainer:()=>document.querySelector(`#${r.J}`)||document.body,mouseWheel:!0,destroyOnClose:!0,closeOnMaskClick:!0,min:s.isValid()?s.toDate():void 0,max:n.isValid()?n.toDate():void 0,precision:e.showTime?"second":"day",defaultValue:e.value?e.value.toDate():void 0,filter:{hour:e=>!a().includes(e),minute:(e,{date:t})=>!i(t.getHours()).includes(e),second:(e,{date:t})=>!c(t.getHours(),t.getMinutes()).includes(e)},onConfirm:t=>{const o=d()(t);e.onChange(o)},onClose:e.onBlur}),e.onFocus()},h=n.default.div`
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #d7d9e0;
  ${e=>e.$style&&(0,a.mR)(e.$style)}
`,p=n.default.div`
  overflow: hidden;
  white-space: nowrap;
  flex-grow: 1;
  display: flex;
  justify-content: center;
`,m=e=>(0,s.jsxs)(h,{ref:e.viewRef,$style:e.$style,onClick:()=>f(e),children:[(0,s.jsx)(p,{children:e.value?e.value.format(e.format||(e.showTime?l.Bp:l.DX)):(0,c.pw)("date.placeholder")}),e.suffixIcon]}),w=e=>(0,s.jsxs)(h,{ref:e.viewRef,$style:e.$style,children:[(0,s.jsx)(p,{onClick:()=>f({...e,value:e.start,onChange:t=>e.onChange(t,e.end)}),children:e.start?e.start.format(e.format||(e.showTime?l.Bp:l.DX)):(0,c.pw)("date.startDate")}),(0,s.jsx)(u.A,{}),(0,s.jsx)(p,{onClick:()=>f({...e,value:e.end,onChange:t=>e.onChange(e.start,t)}),children:e.end?e.end.format(e.format||(e.showTime?l.Bp:l.DX)):(0,c.pw)("date.endDate")}),e.suffixIcon]})}}]);
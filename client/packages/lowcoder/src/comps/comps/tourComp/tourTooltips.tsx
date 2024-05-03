import { trans } from "i18n";

const indicatorsRenderExample = `(current, total) => (
  <span>
    {current + 1} / {total}
  </span>
)`;
export const IndicatorsRenderTooltip = (
  <div>
    {trans("tour.indicatorsRender.tooltip")}
    <br />
    <br />
    {trans("tour.indicatorsRender.tooltipValidTypes")}
    <br />
    <br />
    <h4>{trans("tour.tooltipSignatureHeader")}</h4>
    <code>
      {trans("tour.indicatorsRender.tooltipFunctionSignature")}
    </code>
    <br />
    <br />
    <h4>{trans("tour.tooltipExampleHeader")}</h4>
    <code>
      {indicatorsRenderExample}
    </code>
  </div>
);

let styleExample = {
  "style": { "boxShadow": "inset 0 0 15px #fff" },
  "color": "rgba(40, 0, 255, .4)"
};

export const TourStepMaskTooltip = (
  <div>
    {trans("tour.options.mask.tooltip")}
    <br />
    <br />
    {trans("tour.options.mask.tooltipValidTypes")}
    <br />
    <br />
    <h3>Example:</h3>
    <code>
      {JSON.stringify(styleExample, null, 1)}
    </code>
  </div>
);

export const TourMaskTooltip = (
  <div>
    {trans("tour.mask.tooltip")}
    <br />
    <br />
    {trans("tour.mask.tooltipValidTypes")}
    <br />
    <br />
    <h4>Example:</h4>
    <code>
      {JSON.stringify(styleExample, null, 1)}
    </code>
  </div>
);

export const TourPlacementTooltip = (
  <div>
    {trans("tour.placement.tooltip")}
    <br />
    <br />
    <h4>{trans("tour.placement.tooltipValidOptions")}</h4>
    <h5>{trans("tour.placement.tooltipValidOptionsAbove")}</h5>
    <ul>
      <li><code>topLeft</code></li>
      <li><code>top</code></li>
      <li><code>topRight</code></li>
    </ul>
    <h5>{trans("tour.placement.tooltipValidOptionsLeft")}</h5>
    <ul>
      <li><code>leftTop</code></li>
      <li><code>left</code></li>
      <li><code>leftBottom</code></li>
    </ul>
    <h5>{trans("tour.placement.tooltipValidOptionsRight")}</h5>
    <ul>
      <li><code>rightTop</code></li>
      <li><code>right</code></li>
      <li><code>rightBottom</code></li>
    </ul>
    <h5>{trans("tour.placement.tooltipValidOptionsBelow")}</h5>
    <ul>
      <li><code>bottomLeft</code></li>
      <li><code>bottom</code></li>
      <li><code>bottomRight</code></li>
    </ul>
    <h5>{trans("tour.placement.tooltipValidOptionsOnTop")}</h5>
    <ul>
      <li>center</li>
    </ul>
  </div>
);

const arrowTooltipSignature = `boolean | { pointAtCenter: boolean }`;
export const TourStepArrowTooltip = (
  <div>
    {trans("tour.options.arrow.tooltip")}
    <br />
    <br />
    <h4>{trans("tour.tooltipSignatureHeader")}</h4>
    <code>{arrowTooltipSignature}</code>
  </div>
);
export const TourArrowTooltip = (
  <div>
    {trans("tour.arrow.tooltip")}
    <br />
    <br />
    <h4>{trans("tour.tooltipSignatureHeader")}</h4>
    <code>{arrowTooltipSignature}</code>
  </div>
);

export {};
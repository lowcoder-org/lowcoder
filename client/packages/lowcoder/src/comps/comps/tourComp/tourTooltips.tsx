import { trans } from "@lowcoder-ee/i18n";

const indicatorsRenderExample = `(current, total) => (
  <span>
    {current + 1} / {total}
  </span>
)`
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
    {trans("tour.options.mask.tooltip")}:
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
    {trans("tour.mask.tooltip")}:
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
    {trans("tour.placement.tooltip")}:
    <br />
    <br />
    <h4>Valid options</h4>
    <h5>Above the component:</h5>
    <ul>
      <li><code>topLeft</code></li>
      <li><code>top</code></li>
      <li><code>topRight</code></li>
    </ul>
    <h5>To the left of the component:</h5>
    <ul>
      <li><code>leftTop</code></li>
      <li><code>left</code></li>
      <li><code>leftBottom</code></li>
    </ul>
    <h5>To the right of the component:</h5>
    <ul>
      <li><code>rightTop</code></li>
      <li><code>right</code></li>
      <li><code>rightBottom</code></li>
    </ul>
    <h5>Below the component:</h5>
    <ul>
      <li><code>bottomLeft</code></li>
      <li><code>bottom</code></li>
      <li><code>bottomRight</code></li>
    </ul>
    <h5>On top of the component:</h5>
    <ul>
      <li>center</li>
    </ul>
  </div>
);

export {};
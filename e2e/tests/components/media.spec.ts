import type { Locator } from "@playwright/test";
import {
  appDsl,
  button,
  component,
  eventHandler,
  runScript,
  setTempState,
  stackItems,
  tempState,
  text,
  type DslItem,
} from "../../src/dsl/builders";
import { recordedItem } from "../../src/dsl/recorded";
import { expect, test } from "../../src/fixtures";
import { MP4, PDF, PNG_BLUE, PNG_RED, WAV, WEBM } from "../../src/media";
import { openSeededApp } from "../../src/simple-components/seed";

/**
 * S12 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `image`, `carousel`, `avatarGroup`, `comment`, `card`,
 * `audio`, `video` and `fileViewer`, one test each, seeded with the data: URIs of src/media.ts (the network guard blocks
 * every default source). Probe: probes/s12-media.spec.ts.
 */
const COMPONENT_ID = "e2e-component";
const STATE_TEXT_ID = "e2e-state";
const STATE = "state1";
/** The text of the recorded `"null"` state renders empty, not `null` (probe). */
const STATE_TEXT = `s={{${STATE}.value}}`;
const STATE_NULL = tempState({ id: "s1", name: STATE, value: "null" });
const PNG_SIDE_PX = 8;
const AUDIO_ENDED_TIMEOUT_MS = 10_000;
const VIDEO_DURATION_S = 1;
const VIDEO_HAVE_ENOUGH_DATA = 4;
const PDF_DATA_URI_PREFIX = "data:application/pdf;base64,";
const FILE_VIEWER_ERROR = "Please Enter a Valid URL or Base64 String";
const FIRST_COMMENT = "Has anyone tried using Lowcode for our new internal tool yet?";
const STATE_TEXT_ITEM: DslItem = text({ id: "t0", name: "tState", testId: STATE_TEXT_ID, text: STATE_TEXT });

/** Waits until the browser has decoded the image: its natural width is the 8 px of the PNG fixtures. */
async function expectDecodedPng(image: Locator, message: string): Promise<void> {
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { message })
    .toBe(PNG_SIDE_PX);
}

/** The state text first (it is the view's readiness signal), then the component items, each in its own rows. */
function mediaApp(items: DslItem[]): object {
  return appDsl(stackItems([STATE_TEXT_ITEM, ...items]), { tempStates: [STATE_NULL] });
}

test.describe("S12 media components", () => {
  test("image shows its data: URI and its click event sets the state", async ({ page, apiUser }) => {
    const dsl = mediaApp([
      component("image", {
        id: "c1",
        testId: COMPONENT_ID,
        comp: { src: PNG_RED },
        onEvent: [eventHandler("click", setTempState(STATE, "image-clicked"))],
      }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-image", dsl });
    const image = view.byTestId(COMPONENT_ID).locator("img");
    await expect(image, "the image is shown").toBeVisible();
    await expectDecodedPng(image, "the data: URI decoded to the 8x8 PNG");
    await expect(view.byTestId(STATE_TEXT_ID), "no click yet").toHaveText("s=");

    // `.ant-image` intercepts pointer events on the img (p2 section 2.3): click with force.
    await image.click({ force: true });

    await expect(view.byTestId(STATE_TEXT_ID), "the click event set the state").toHaveText("s=image-clicked");
  });

  test("carousel shows its two slides and the second dot fires change", async ({ page, apiUser }) => {
    const dsl = mediaApp([
      component("carousel", {
        id: "c1",
        testId: COMPONENT_ID,
        comp: { autoPlay: false, data: JSON.stringify([PNG_RED, PNG_BLUE]) },
        onEvent: [eventHandler("change", setTempState(STATE, "carousel-changed"))],
      }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-carousel", dsl });
    const carousel = view.byTestId(COMPONENT_ID);
    await expect(carousel.locator(".slick-slide:not(.slick-cloned)"), "one slide per image").toHaveCount(2);
    await expect(carousel.locator(".slick-slide.slick-current"), "the first slide is current").toHaveAttribute("data-index", "0");

    await carousel.locator(".slick-dots li").nth(1).locator("button").click();

    await expect(view.byTestId(STATE_TEXT_ID), "the change event fired").toHaveText("s=carousel-changed");
    await expect(carousel.locator(".slick-slide.slick-current"), "the second slide is current").toHaveAttribute("data-index", "1");
  });

  test("avatarGroup shows D and +1 for its four avatars with maxCount 3, and one image", async ({ page, apiUser }) => {
    const avatars = recordedItem("avatarGroup").comp.avatars as { manual: { manual: Record<string, unknown>[] } };
    avatars.manual.manual[0]!.src = PNG_RED;
    const dsl = mediaApp([component("avatarGroup", { id: "c1", testId: COMPONENT_ID, comp: { avatars } })]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-avatars", dsl });
    const group = view.byTestId(COMPONENT_ID);

    await expect(group.getByText("D", { exact: true }), "the third avatar's label is shown").toBeVisible();
    await expect(group.getByText("+1", { exact: true }), "the overflow counter shows the one hidden avatar").toBeVisible();
    await expect(group.getByText("W", { exact: true }), "the fourth avatar is hidden behind the counter").toHaveCount(0);
    await expect(group.locator("img"), "one avatar has a picture").toHaveCount(1);
    await expectDecodedPng(group.locator("img"), "its data: URI decoded");
  });

  test("comment shows the commenter and the comment text, with a data: URI avatar", async ({ page, apiUser }) => {
    const value = JSON.stringify([
      { user: { name: "John Doe", avatar: PNG_RED }, value: FIRST_COMMENT, createdAt: "2024-09-20T10:15:41.658Z" },
      { user: { name: "Jane Smith", avatar: PNG_BLUE }, value: "Yes, I have.", createdAt: "2024-09-20T10:17:12.658Z" },
    ]);
    const dsl = mediaApp([component("comment", { id: "c1", testId: COMPONENT_ID, comp: { value } })]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-comment", dsl });
    const comment = view.byTestId(COMPONENT_ID);

    await expect(comment.getByText("John Doe").first(), "the first commenter is shown").toBeVisible();
    await expect(comment.getByText(FIRST_COMMENT), "the first comment is shown").toBeVisible();
    // not asserted: the relative time (`2 years ago`), which depends on today's date
    await expectDecodedPng(comment.locator("img").first(), "the avatar's data: URI decoded");
  });

  test("card shows its texts and a cover image from a data: URI", async ({ page, apiUser }) => {
    const dsl = mediaApp([component("card", { id: "c1", testId: COMPONENT_ID, comp: { imgSrc: PNG_BLUE } })]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-card", dsl });
    const card = view.byTestId(COMPONENT_ID);

    await expect(card.getByText("Title", { exact: true }), "the title").toBeVisible();
    await expect(card.getByText("Content Title", { exact: true }), "the meta title").toBeVisible();
    await expect(card.getByText("Content Description", { exact: true }), "the meta description").toBeVisible();
    const cover = card.locator("img").first();
    await expect(cover, "the cover is the seeded data: URI").toHaveAttribute("src", PNG_BLUE);
    await expectDecodedPng(cover, "the cover decoded");
  });

  test("audio plays from a button and fires ended", async ({ page, apiUser }) => {
    const dsl = mediaApp([
      component("audio", {
        id: "c1",
        testId: COMPONENT_ID,
        comp: { src: WAV },
        onEvent: [eventHandler("ended", setTempState(STATE, "audio-ended"))],
      }),
      button({
        id: "b1",
        name: "bPlay",
        text: "Play",
        testId: "e2e-play",
        onEvent: [eventHandler("click", runScript("audio1.play()"))],
      }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-audio", dsl });
    await expect(view.byTestId(COMPONENT_ID).locator("audio"), "one audio element").toHaveCount(1);
    await expect(view.byTestId(STATE_TEXT_ID), "not ended before Play").toHaveText("s=");

    await view.buttonByTestId("e2e-play").click();

    await expect(view.byTestId(STATE_TEXT_ID), "the 1 s clip ended").toHaveText("s=audio-ended", { timeout: AUDIO_ENDED_TIMEOUT_MS });
  });

  test("video loads a 1 s clip from a data: URI (webm, mp4 and a WAV)", async ({ page, apiUser }) => {
    const sources = [
      { label: "webm", src: WEBM, testId: "e2e-video-webm" },
      { label: "mp4", src: MP4, testId: "e2e-video-mp4" },
      { label: "wav", src: WAV, testId: "e2e-video-wav" },
    ];
    const dsl = mediaApp(
      sources.map((source, index) =>
        component("video", {
          id: `v${index}`,
          testId: source.testId,
          name: `video${index + 1}`,
          comp: { src: source.src, poster: "" },
        }),
      ),
    );
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-video", dsl });

    for (const source of sources) {
      const video = view.byTestId(source.testId).locator("video");
      await expect(video, `exactly one video element for ${source.label}`).toHaveCount(1);
      await expect
        .poll(() => video.evaluate((element) => (element as HTMLVideoElement).readyState), {
          message: `the ${source.label} clip is loaded (readyState HAVE_ENOUGH_DATA)`,
        })
        .toBe(VIDEO_HAVE_ENOUGH_DATA);
      const duration = await video.evaluate((element) => (element as HTMLVideoElement).duration);
      expect(duration, `the ${source.label} clip lasts 1 s`).toBeCloseTo(VIDEO_DURATION_S, 0);
    }
  });

  test("fileViewer frames a PDF data: URI, and an empty src shows its error text", async ({ page, apiUser }) => {
    const dsl = mediaApp([
      component("fileViewer", { id: "f1", testId: "e2e-pdf", name: "fileViewer1", comp: { src: PDF } }),
      component("fileViewer", { id: "f2", testId: "e2e-pdf-empty", name: "fileViewer2" }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s12-fileviewer", dsl });

    const framed = view.byTestId("e2e-pdf");
    await expect(framed.locator("iframe"), "the PDF is framed").toHaveCount(1);
    await expect(framed.locator("iframe"), "the frame's src is the data: URI").toHaveAttribute(
      "src",
      new RegExp(`^${PDF_DATA_URI_PREFIX}`),
    );
    await expect(framed.getByText(FILE_VIEWER_ERROR), "no error text for a valid PDF").toHaveCount(0);
    // not asserted: the PDF's own text (headless Chromium does not draw it into the frame)

    const empty = view.byTestId("e2e-pdf-empty");
    await expect(empty.getByText(FILE_VIEWER_ERROR), "an empty src shows the error text").toBeVisible();
    await expect(empty.locator("iframe"), "an empty src frames nothing").toHaveCount(0);
  });
});

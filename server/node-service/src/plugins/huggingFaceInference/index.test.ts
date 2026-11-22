import huggingFaceInferencePlugin from "./index";

/**
 * huggingFaceInference plugin. The host is hard-coded HTTPS, so global fetch is spied on (only the
 * network is replaced) and the exact request it was given is asserted.
 */
const TOKEN = "hf_token";
const MODEL = "deepset/roberta-base-squad2";
const CTX = { languages: ["en"] } as any;
const BODY = { inputs: { question: "q?", context: "c" } };

afterEach(() => {
  jest.restoreAllMocks();
});

describe("run", () => {
  test("POSTs JSON.stringify(body) to the model URL with the Bearer token and returns the parsed JSON", async () => {
    const answer = { answer: "c", score: 0.9 };
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(answer), { status: 200 }));
    const result = await huggingFaceInferencePlugin.run!(
      { actionName: "InvokeInferenceApi", model: MODEL, body: BODY } as any,
      { token: TOKEN, specVersion: "" } as any,
      CTX
    );
    expect(result).toEqual(answer);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api-inference.huggingface.co/models/${MODEL}`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
    expect(init.body).toBe(JSON.stringify(BODY));
  });

  test("a response that is not JSON rejects", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("<html>", { status: 502 }));
    await expect(
      huggingFaceInferencePlugin.run!({ actionName: "InvokeInferenceApi", model: MODEL, body: BODY } as any, { token: TOKEN } as any, CTX)
    ).rejects.toMatchObject({ name: "SyntaxError" });
  });

  test("a network failure is rejected unchanged", async () => {
    const failure = new TypeError("fetch failed");
    jest.spyOn(global, "fetch").mockRejectedValue(failure);
    await expect(
      huggingFaceInferencePlugin.run!({ actionName: "InvokeInferenceApi", model: MODEL, body: BODY } as any, { token: TOKEN } as any, CTX)
    ).rejects.toBe(failure);
  });
});

describe("queryConfig", () => {
  test("queryConfig({}) is the v1.0 config", async () => {
    const config: any = await (huggingFaceInferencePlugin.queryConfig as any)({});
    expect(config.type).toBe("query");
    expect(config.actions.map((a: any) => a.actionName)).toEqual(["InvokeInferenceApi"]);
    expect(config.actions[0].params.map((p: any) => p.key)).toEqual(["model", "body"]);
  });

  test("specVersion v1.0 gives the same config as an empty one; an unknown version gives none", async () => {
    const queryConfig = huggingFaceInferencePlugin.queryConfig as any;
    expect(await queryConfig({ specVersion: "v1.0" })).toBe(await queryConfig({}));
    expect(await queryConfig({ specVersion: "v9.9" })).toBeUndefined();
  });
});

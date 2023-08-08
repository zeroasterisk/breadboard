/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InputValues, OutputValues } from "@google-labs/graph-runner";
import {
  GenerateTextResponse,
  SafetySetting,
  Text,
  palm,
} from "@google-labs/palm-lite";

type generateTextInputs = {
  /**
   * Prompt for text completion.
   */
  text: string;
  /**
   * The Google Cloud Platform API key
   */
  PALM_KEY: string;
  /**
   * Stop sequences
   */
  stopSequences: string[];
  /**
   * Safety settings
   */
  safetySettings: SafetySetting[];
};

export const prepareRequest = (inputs: InputValues) => {
  const values = inputs as generateTextInputs;
  if (!values.PALM_KEY)
    throw new Error("Text completion requires `PALM_KEY` input");
  if (!values.text) throw new Error("Text completion requires `text` input");

  const prompt = new Text().text(values.text);
  const stopSequences = values.stopSequences || [];
  stopSequences.forEach((stopSequence) => prompt.addStopSequence(stopSequence));
  const safetySettings = values.safetySettings || [];
  safetySettings.forEach((safetySetting) =>
    prompt.addSafetySetting(safetySetting.category, safetySetting.threshold)
  );
  return palm(values.PALM_KEY).text(prompt);
};

export const prepareResponse = async (
  data: Response
): Promise<OutputValues> => {
  const response = (await data.json()) as GenerateTextResponse;

  const completion = response?.candidates?.[0]?.output as string;
  if (completion) return { completion, ...response };
  return response as OutputValues;
};

export default async (inputs: InputValues) => {
  return await prepareResponse(await fetch(prepareRequest(inputs)));
};
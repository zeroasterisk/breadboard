/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InputValues } from "@google-labs/graph-runner";
import {
  XmlCdata,
  XmlComment,
  XmlDocument,
  XmlElement,
  XmlText,
  parseXml,
} from "@rgrove/parse-xml";

export type XmlToJsonOutputs = {
  json: unknown;
};

type XmlToJsonInputValues = {
  /**
   * The string that contains the XML to convert to JSON
   * @example `<foo><bar>baz</bar></foo>`
   */
  xml: string;
};

const properName = (name: string) => {
  return name.replace(/:/g, "$");
};

/**
 * Converts to alt-json format, as outlined in:
 * https://developers.google.com/gdata/docs/json
 * @param node
 * @returns
 */
const toAltJson = (
  node: XmlElement | XmlDocument | XmlText | XmlCdata | XmlComment
): [string, unknown] => {
  if (node.type === "document") {
    const doc = node as XmlDocument;
    const element = doc.children[0] as XmlElement;
    const [name, value] = toAltJson(element);
    return ["$doc", element ? { [name]: value } : ""];
  }
  if (node.type === "element") {
    const element = node as XmlElement;
    const childEntries = element.children.map(toAltJson) as [string, unknown][];
    const children = Object.fromEntries(
      childEntries.reduce((map, [name, value]) => {
        map.has(name) ? map.get(name).push(value) : map.set(name, [value]);
        return map;
      }, new Map())
    );
    return [properName(element.name), { ...children, ...element.attributes }];
  }
  if (node.type === "text") {
    const text = node as XmlText;
    return ["$t", text.text];
  }
  return ["$c", ""];
};

export default async (inputs: InputValues) => {
  const { xml } = inputs as XmlToJsonInputValues;
  if (!xml) throw new Error("XmlToJson requires `xml` input");
  const json = toAltJson(parseXml(xml));
  return { json };
};

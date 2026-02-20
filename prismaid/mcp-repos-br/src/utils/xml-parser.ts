/**
 * OAI-PMH XML response parser.
 * Converts XML responses from OAI-PMH endpoints into typed objects.
 */

import { XMLParser } from "fast-xml-parser";
import type {
    OaiIdentifyResponse,
    OaiRecord,
    OaiListRecordsResponse,
    OaiSetInfo,
    MetadataFormat,
    DublinCoreMetadata,
} from "../types.js";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => {
        // These elements can appear multiple times in DC
        const arrayElements = [
            "dc:title", "dc:creator", "dc:subject", "dc:description",
            "dc:date", "dc:type", "dc:format", "dc:identifier",
            "dc:language", "dc:rights", "dc:publisher", "dc:source",
            "dc:relation", "dc:coverage", "dc:contributor",
            "record", "set", "metadataFormat", "adminEmail",
        ];
        return arrayElements.includes(name);
    },
    removeNSPrefix: false,
    textNodeName: "#text",
});

/**
 * Ensure a value is always an array.
 */
function asArray(val: unknown): string[] {
    if (val === undefined || val === null) return [];
    if (Array.isArray(val)) return val.map(String);
    return [String(val)];
}

/**
 * Extract text from a potentially complex XML node.
 */
function extractText(node: unknown): string {
    if (node === undefined || node === null) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (typeof node === "object" && node !== null && "#text" in node) {
        return String((node as Record<string, unknown>)["#text"]);
    }
    return String(node);
}

function asTextArray(val: unknown): string[] {
    if (val === undefined || val === null) return [];
    if (Array.isArray(val)) return val.map(extractText);
    return [extractText(val)];
}

/**
 * Parse OAI-PMH Identify response.
 */
export function parseIdentifyResponse(xml: string): OaiIdentifyResponse {
    const parsed = parser.parse(xml);
    const identify = parsed?.["OAI-PMH"]?.Identify;
    if (!identify) {
        throw new Error("Invalid OAI-PMH Identify response");
    }
    return {
        repositoryName: extractText(identify.repositoryName),
        baseURL: extractText(identify.baseURL),
        protocolVersion: extractText(identify.protocolVersion),
        earliestDatestamp: extractText(identify.earliestDatestamp),
        deletedRecord: extractText(identify.deletedRecord),
        granularity: extractText(identify.granularity),
        adminEmail: asArray(identify.adminEmail),
    };
}

/**
 * Extract Dublin Core metadata from an OAI-PMH record.
 */
function extractDublinCore(metadataNode: unknown): DublinCoreMetadata {
    const dc = (metadataNode as Record<string, unknown>)?.["oai_dc:dc"]
        ?? (metadataNode as Record<string, unknown>)?.["dc"]
        ?? metadataNode;

    const m = dc as Record<string, unknown>;

    return {
        title: asTextArray(m["dc:title"]),
        creator: asTextArray(m["dc:creator"]),
        subject: asTextArray(m["dc:subject"]),
        description: asTextArray(m["dc:description"]),
        date: asTextArray(m["dc:date"]),
        type: asTextArray(m["dc:type"]),
        format: asTextArray(m["dc:format"]),
        identifier: asTextArray(m["dc:identifier"]),
        language: asTextArray(m["dc:language"]),
        rights: asTextArray(m["dc:rights"]),
        publisher: asTextArray(m["dc:publisher"]),
        source: asTextArray(m["dc:source"]),
        relation: asTextArray(m["dc:relation"]),
        coverage: asTextArray(m["dc:coverage"]),
        contributor: asTextArray(m["dc:contributor"]),
    };
}

/**
 * Parse a single OAI-PMH record node.
 */
function parseRecord(recordNode: unknown): OaiRecord | null {
    const r = recordNode as Record<string, unknown>;
    const header = r?.header as Record<string, unknown>;
    if (!header) return null;

    // Skip deleted records
    if (header["@_status"] === "deleted") return null;

    return {
        identifier: extractText(header.identifier),
        datestamp: extractText(header.datestamp),
        sets: asArray(header.setSpec),
        metadata: r.metadata ? extractDublinCore(r.metadata) : {
            title: [], creator: [], subject: [], description: [],
            date: [], type: [], format: [], identifier: [],
            language: [], rights: [], publisher: [], source: [],
            relation: [], coverage: [], contributor: [],
        },
    };
}

/**
 * Parse OAI-PMH ListRecords response.
 */
export function parseListRecordsResponse(xml: string): OaiListRecordsResponse {
    const parsed = parser.parse(xml);
    const oaiPmh = parsed?.["OAI-PMH"];

    // Check for errors
    const error = oaiPmh?.error;
    if (error) {
        const code = (error as Record<string, unknown>)?.["@_code"] ?? "unknown";
        const msg = extractText(error);
        throw new Error(`OAI-PMH error [${code}]: ${msg}`);
    }

    const listRecords = oaiPmh?.ListRecords;
    if (!listRecords) {
        return { records: [], resumptionToken: null, completeListSize: null };
    }

    const rawRecords = listRecords.record;
    const records: OaiRecord[] = [];

    if (rawRecords) {
        const recordArray = Array.isArray(rawRecords) ? rawRecords : [rawRecords];
        for (const r of recordArray) {
            const parsed = parseRecord(r);
            if (parsed) records.push(parsed);
        }
    }

    // Resumption token
    let resumptionToken: string | null = null;
    let completeListSize: number | null = null;
    const rt = listRecords.resumptionToken;
    if (rt !== undefined && rt !== null) {
        if (typeof rt === "string") {
            resumptionToken = rt || null;
        } else if (typeof rt === "object") {
            const rtObj = rt as Record<string, unknown>;
            resumptionToken = extractText(rtObj["#text"]) || null;
            if (rtObj["@_completeListSize"]) {
                completeListSize = parseInt(String(rtObj["@_completeListSize"]), 10);
            }
        }
    }

    return { records, resumptionToken, completeListSize };
}

/**
 * Parse OAI-PMH GetRecord response.
 */
export function parseGetRecordResponse(xml: string): OaiRecord {
    const parsed = parser.parse(xml);
    const oaiPmh = parsed?.["OAI-PMH"];

    const error = oaiPmh?.error;
    if (error) {
        const code = (error as Record<string, unknown>)?.["@_code"] ?? "unknown";
        throw new Error(`OAI-PMH error [${code}]: ${extractText(error)}`);
    }

    const record = oaiPmh?.GetRecord?.record;
    if (!record) {
        throw new Error("No record found in GetRecord response");
    }

    const result = parseRecord(record);
    if (!result) {
        throw new Error("Record is deleted or invalid");
    }
    return result;
}

/**
 * Parse OAI-PMH ListSets response.
 */
export function parseListSetsResponse(xml: string): OaiSetInfo[] {
    const parsed = parser.parse(xml);
    const listSets = parsed?.["OAI-PMH"]?.ListSets;
    if (!listSets?.set) return [];

    const sets = Array.isArray(listSets.set) ? listSets.set : [listSets.set];
    return sets.map((s: Record<string, unknown>) => ({
        setSpec: extractText(s.setSpec),
        setName: extractText(s.setName),
    }));
}

/**
 * Parse OAI-PMH ListMetadataFormats response.
 */
export function parseListMetadataFormatsResponse(xml: string): MetadataFormat[] {
    const parsed = parser.parse(xml);
    const listFormats = parsed?.["OAI-PMH"]?.ListMetadataFormats;
    if (!listFormats?.metadataFormat) return [];

    const formats = Array.isArray(listFormats.metadataFormat)
        ? listFormats.metadataFormat
        : [listFormats.metadataFormat];

    return formats.map((f: Record<string, unknown>) => ({
        metadataPrefix: extractText(f.metadataPrefix),
        schema: extractText(f.schema),
        metadataNamespace: extractText(f.metadataNamespace),
    }));
}

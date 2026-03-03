import { z } from "zod";

// ─── Registry Types ───────────────────────────────────────────

export const InstitutionTypeSchema = z.string();
export type InstitutionType = z.infer<typeof InstitutionTypeSchema>;

export const PlatformSchema = z.string();
export type Platform = z.infer<typeof PlatformSchema>;

export const ContentTypeSchema = z.string();
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const RepoStatusSchema = z.string();
export type RepoStatus = z.infer<typeof RepoStatusSchema>;


const accessSchema = z.object({
    oaiPmh: z.object({
        available: z.boolean(),
        endpoint: z.string().nullable().optional(),
        verified: z.boolean(),
        lastVerified: z.string().nullable().optional(),
    }).passthrough(),
    restApi: z.object({
        available: z.boolean().optional(),
        endpoint: z.string().nullable().optional(),
        version: z.number().nullable().optional(),
    }).passthrough().optional(),
    searchEndpoints: z.array(z.string()).optional(),
    // International REST API Mapping Extensions
    baseUrl: z.string().optional(),
    endpoints: z.record(z.string(), z.string()).optional(),
    mapping: z.record(z.string(), z.string()).optional(),
}).passthrough();

export const RepositoryEntrySchema = z.object({
    id: z.string(),
    institution: z.object({
        name: z.string(),
        acronym: z.string(),
        type: InstitutionTypeSchema,
        state: z.string(),
        city: z.string(),
    }).passthrough(),
    repository: z.object({
        name: z.string(),
        url: z.string(),
        platform: PlatformSchema,
        contentType: ContentTypeSchema,
    }).passthrough(),
    access: accessSchema,
    status: RepoStatusSchema,

    layer: z.string().optional(),
}).passthrough();

export type RepositoryEntry = z.infer<typeof RepositoryEntrySchema>;

// ─── OAI-PMH Types ───────────────────────────────────────────

export interface OaiIdentifyResponse {
    repositoryName: string;
    baseURL: string;
    protocolVersion: string;
    earliestDatestamp: string;
    deletedRecord: string;
    granularity: string;
    adminEmail: string[];
}

export interface OaiRecord {
    identifier: string;
    datestamp: string;
    sets: string[];
    metadata: DublinCoreMetadata;
}

export interface DublinCoreMetadata {
    title: string[];
    creator: string[];
    subject: string[];
    description: string[];
    date: string[];
    type: string[];
    format: string[];
    identifier: string[];
    language: string[];
    rights: string[];
    publisher: string[];
    source: string[];
    relation: string[];
    coverage: string[];
    contributor: string[];
}

export interface OaiListRecordsResponse {
    records: OaiRecord[];
    resumptionToken: string | null;
    completeListSize: number | null;
}

export interface OaiSetInfo {
    setSpec: string;
    setName: string;
}

export interface MetadataFormat {
    metadataPrefix: string;
    schema: string;
    metadataNamespace: string;
}

// ─── Methodology & Audit Protocols ────────────────────────────

export const SupportedMethodologySchema = z.enum([
    "PRISMA_2020",
    "PRISMA_ScR", // Scoping Reviews
    "COCHRANE",
    "CUSTOM"
]);
export type SupportedMethodology = z.infer<typeof SupportedMethodologySchema>;

export interface ProcessAuditMetadata {
    /** The strictly enforced scientific protocol this record is bound to */
    methodology: SupportedMethodology;

    /** MUST exist: The exact query execution that yielded this record */
    searchQueryUsed: string;

    /** MUST exist: The date of the extraction from the primary source */
    extractionDate: string;

    /** MUST exist: The specific endpoint or human that generated the record */
    provenanceSource: string;

    /** Optional flags used by active auditors */
    validationFlags?: {
        isMethodologyCompliant: boolean;
        missingCompliantFields: string[];
    };
}

// ─── Search Result Types ──────────────────────────────────────

export interface SearchResult {
    repositoryId: string;
    repositoryName: string;
    identifier: string;
    title: string;
    creators: string[];
    description: string;
    date: string;
    type: string;
    url: string;
    doi?: string;
    pdfUrl?: string;
    degreeType?: string;
    institution?: string;
    state?: string;
    journal?: string;
    issn?: string;
    subjectAreas?: string[];
    language?: string;
    tldr?: string;
    /** País de origem do artigo (afiliação, journal, etc.). 'desconhecida' se não disponível. */
    originCountry?: string;
    accessMethod: "oai-pmh" | "dspace-rest" | "html-scraper" | "bdtd-vufind" | "scielo-articlemeta" | "usp-custom" | "manual_import" | "bvs_import" | "api";
    /** Timestamp of when the record was first imported into the systemic review system. */
    importedAt?: string;
    /** Detailed status of full-text retrieval (success, error message, etc). */
    fulltextStatus?: string;

    /** 
     * STRICT METADATA REQUIREMENT 
     * Any agent, scraper or ingestor MUST provide this block to satisfy PRISMA/Cochrane rules.
     */
    audit: ProcessAuditMetadata;
}

export interface SearchOptions {
    query?: string;
    title?: string;
    author?: string;
    dateFrom?: string;
    dateUntil?: string;
    degreeType?: "graduacao" | "mestrado" | "doutorado" | "pos-doutorado" | "livre-docencia";
    institution?: string;
    state?: string;
    subjectArea?: string;
    issn?: string;
    contentType?: string[];
    maxResults?: number;
    set?: string;
}

// ─── DSpace REST Types ────────────────────────────────────────

export interface DSpaceSearchResult {
    totalElements: number;
    page: { size: number; totalElements: number; totalPages: number; number: number };
    items: DSpaceItem[];
}

export interface DSpaceItem {
    uuid: string;
    name: string;
    handle: string;
    metadata: Record<string, DSpaceMetadataValue[]>;
    type: string;
}

export interface DSpaceMetadataValue {
    value: string;
    language: string | null;
    authority: string | null;
    confidence: number;
    place: number;
}

export interface Bitstream {
    uuid: string;
    name: string;
    sizeBytes: number;
    mimeType: string;
    retrieveLink: string;
}

// ─── Validation Types ─────────────────────────────────────────

export interface ValidationResult {
    repositoryId: string;
    repositoryName: string;
    timestamp: string;
    checks: ValidationCheck[];
    overallStatus: "healthy" | "degraded" | "unreachable";
}

export interface ValidationCheck {
    type: "connectivity" | "oai_pmh" | "rest_api" | "search";
    status: "pass" | "fail" | "skip";
    latencyMs: number | null;
    details: string;
}

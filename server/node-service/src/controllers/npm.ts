import "../common/logger";
import fs from "fs/promises";
import { spawn } from "child_process";
import { Request as ServerRequest, Response as ServerResponse } from "express";
import { NpmRegistryService, NpmRegistryConfigEntry, NpmRegistryConfig } from "../services/npmRegistry";
import {default as pathlib} from 'path';

type RequestConfig = {
    workspaceId: string;
    npmRegistries: NpmRegistryConfig;
}

type InnerRequestConfig = {
    workspaceId?: string;
    registry: NpmRegistryConfigEntry;
}

type PackagesVersionInfo = {
    "dist-tags": {
        latest: string
    },
    versions: {
        [version: string]: {
            dist: {
                tarball: string
            }
        }
    }
};


const INVALID_WORKSPACE_MESSAGE = "Invalid workspaceId";
const INVALID_UPSTREAM_VERSION_MESSAGE = "Invalid latest version from registry";
const DOT_DOT_SEGMENT = /^(\.|%2e){2}$/i;
const MISSING_REGISTRIES_MESSAGE = "Missing or invalid npmRegistries: expected an array";

function hasRegistryArray(body: {npmRegistries?: unknown}): boolean {
    return Array.isArray(body.npmRegistries);
}

function isSafePathSegment(value: unknown): value is string {
    return typeof value === "string" && value !== "" && value !== "." && value !== ".." && !/[\/\\\0]/.test(value);
}

// Only real HTTP error statuses (4xx and 5xx) are passed through; anything else keeps the generic 500.
const UPSTREAM_ERROR_MIN_STATUS = 400;
const UPSTREAM_ERROR_MAX_STATUS = 599;

class UpstreamResponseError extends Error {
    constructor(public readonly status: number, public readonly body: string) {
        super(`Upstream responded ${status}`);
    }
}

class PackageProcessingQueue {
    public static readonly promiseRegistry: {[packageId: string]: Promise<void>} = {};
    public static readonly resolveRegistry: {[packageId: string]:() => void} = {};

    public static add(packageId: string): void {
        PackageProcessingQueue.promiseRegistry[packageId] = new Promise<void>((resolve) => {
            PackageProcessingQueue.resolveRegistry[packageId] = resolve;
        });
    }

    public static has(packageId: string): boolean {
        return !!PackageProcessingQueue.promiseRegistry[packageId];
    }

    public static wait(packageId: string): Promise<void> {
        if (!PackageProcessingQueue.has(packageId)) {
            return Promise.resolve();
        }   
        return PackageProcessingQueue.promiseRegistry[packageId];
    }

    public static resolve(packageId: string): void {
        if (!PackageProcessingQueue.has(packageId)) {
            return;
        }
        PackageProcessingQueue.resolveRegistry[packageId]();
        delete PackageProcessingQueue.promiseRegistry[packageId];
        delete PackageProcessingQueue.resolveRegistry[packageId];
    }
}


/**
 * Initializes npm registry cache directory
 */
const CACHE_DIR = process.env.NPM_CACHE_DIR || "/tmp/npm-package-cache";
try {
    fs.mkdir(CACHE_DIR, { recursive: true });
} catch (error) {
    logger.error("Error creating cache directory", error);
}


/**
 * Fetches package info from npm registry
 */

const fetchRegistryBasePath = "/npm/registry";

export async function fetchRegistryWithConfig(request: ServerRequest, response: ServerResponse) {
    try {
        const path = request.path.replace(fetchRegistryBasePath, "");
        logger.info(`Fetch registry info for path: ${path}`);

        const pathPackageInfo = parsePackageInfoFromPath(path);
        if (!pathPackageInfo) {
            return response.status(400).send(`Invalid package path: ${path}`);
        }

        if (!hasRegistryArray(request.body)) {
            return response.status(400).send(MISSING_REGISTRIES_MESSAGE);
        }
    
        const {npmRegistries: npmRegistryConfig}: RequestConfig = request.body;

        const registry = NpmRegistryService.getRegistryEntryForPackageWithConfig(pathPackageInfo.packageId, npmRegistryConfig);

        const registryResponse = await fetchFromRegistry(path, registry);
        if (!registryResponse.ok) {
            return response.status(registryResponse.status).send(await registryResponse.text());
        }
        response.send(await registryResponse.text());
    } catch (error) {
        logger.error("Error fetching registry", error);
        response.status(500).send("Internal server error");
    }
}

export async function fetchRegistry(request: ServerRequest, response: ServerResponse) {
    try {
        const path = request.path.replace(fetchRegistryBasePath, "");
        logger.info(`Fetch registry info for path: ${path}`);

        const pathPackageInfo = parsePackageInfoFromPath(path);
        if (!pathPackageInfo) {
            return response.status(400).send(`Invalid package path: ${path}`);
        }

        const registry = NpmRegistryService.getInstance().getRegistryEntryForPackage(pathPackageInfo.packageId);
        const registryResponse = await fetchFromRegistry(path, registry);
        if (!registryResponse.ok) {
            return response.status(registryResponse.status).send(await registryResponse.text());
        }
        response.json(await registryResponse.json());
    } catch (error) {
        logger.error("Error fetching registry", error);
        response.status(500).send("Internal server error");
    }
}


/**
 * Fetches package files from npm registry if not yet cached
 */

const fetchPackageFileBasePath = "/npm/package";

export async function fetchPackageFileWithConfig(request: ServerRequest, response: ServerResponse) {
    const path = request.path.replace(fetchPackageFileBasePath, "");
    logger.info(`Fetch file for path with config: ${path}`);
    
    const pathPackageInfo = parsePackageInfoFromPath(path);
    if (!pathPackageInfo) {
        return response.status(400).send(`Invalid package path: ${path}`);
    }
    
    if (!hasRegistryArray(request.body)) {
        return response.status(400).send(MISSING_REGISTRIES_MESSAGE);
    }

    if (request.body.workspaceId !== undefined && !isSafePathSegment(request.body.workspaceId)) {
        return response.status(400).send(INVALID_WORKSPACE_MESSAGE);
    }

    const {workspaceId, npmRegistries: npmRegistryConfig}: RequestConfig = request.body;
    const registryConfig: NpmRegistryConfig = npmRegistryConfig;
    let registry: NpmRegistryConfigEntry;
    try {
        registry = NpmRegistryService.getRegistryEntryForPackageWithConfig(pathPackageInfo.packageId, registryConfig);
    } catch (error) {
        logger.error("Error resolving npm registry", error);
        return response.status(500).send("Internal server error");
    }

    return fetchPackageFileInner(request, response, {workspaceId, registry});
}

export async function fetchPackageFile(request: ServerRequest, response: ServerResponse) {
    const path = request.path.replace(fetchPackageFileBasePath, "");
    logger.info(`Fetch file for path: ${path}`);

    const pathPackageInfo = parsePackageInfoFromPath(path);
    if (!pathPackageInfo) {
        return response.status(400).send(`Invalid package path: ${path}`);
    }

    const registry = NpmRegistryService.getInstance().getRegistryEntryForPackage(pathPackageInfo.packageId);
    return fetchPackageFileInner(request, response, {registry});
}

async function fetchPackageFileInner(request: ServerRequest, response: ServerResponse, config: InnerRequestConfig) {
    try {
        const {workspaceId, registry} = config
        logger.info(`Fetch file for workspaceId: ${workspaceId}`);
        const path = request.path.replace(fetchPackageFileBasePath, "");    
        const pathPackageInfo = parsePackageInfoFromPath(path);
        if (!pathPackageInfo) {
            return response.status(400).send(`Invalid package path: ${path}`);
        }
     
        logger.debug(`Fetch file for package: ${JSON.stringify(pathPackageInfo)}`);
        const {packageId, version, file} = pathPackageInfo;
        let packageVersion = version;
    
        let packageInfo: PackagesVersionInfo | null = null;
        if (version === "latest") {
            packageInfo = await fetchPackageInfo(packageId, registry);
            if (packageInfo === null) {
                return response.status(404).send("Not found");
            }
            packageVersion = packageInfo["dist-tags"].latest;
            if (!isSafePathSegment(packageVersion)) {
                return response.status(502).send(INVALID_UPSTREAM_VERSION_MESSAGE);
            }
        }

        const baseDir = `${CACHE_DIR}/${workspaceId ?? "default"}`;
        const packageBaseDir = `${baseDir}/${packageId}/${packageVersion}/package`;
        const processingKey = packageBaseDir; // one entry per workspace, package and version
        while (PackageProcessingQueue.has(processingKey)) {
            logger.info("Waiting for package to be processed", packageId);
            await PackageProcessingQueue.wait(processingKey);
        }
        // No await between the last has() above and add() below: check and registration happen in one event-loop turn.
        PackageProcessingQueue.add(processingKey);
        try {
            const packageExists = await fileExists(`${packageBaseDir}/package.json`);
            if (!packageExists) {
                try {
                    logger.info(`Package does not exist, fetch from registy: ${packageId}@${packageVersion}`);
                    if (!packageInfo) {
                        packageInfo = await fetchPackageInfo(packageId, registry);
                    }

                    if (!packageInfo || !packageInfo.versions || !packageInfo.versions[packageVersion]) {
                        return response.status(404).send("Not found");
                    }

                    const tarball = packageInfo.versions[packageVersion].dist.tarball;
                    logger.info(`Fetching tarball: ${tarball}`);
                    await fetchAndUnpackTarball(tarball, packageId, packageVersion, registry, baseDir);
                } catch (error) {
                    logger.error(`Error fetching package: ${error} ${(error as any)?.stack}`);
                    if (error instanceof UpstreamResponseError && error.status >= UPSTREAM_ERROR_MIN_STATUS && error.status <= UPSTREAM_ERROR_MAX_STATUS) {
                        return response.status(error.status).send(error.body);
                    }
                    return response.status(500).send("Internal server error");
                }
            } else {
                logger.info(`Package already exists, serve from cache: ${packageBaseDir}/${file}`)
            }
        } finally {
            PackageProcessingQueue.resolve(processingKey);
        }

        // Fallback to index.mjs if index.js is not present
        if (file === "index.js" && !await fileExists(`${packageBaseDir}/${file}`)) {
            logger.debug("Fallback to index.mjs");
            return response.sendFile(`${packageBaseDir}/index.mjs`);
        }
    
        return response.sendFile(pathlib.resolve(`${packageBaseDir}/${file}`));
    } catch (error) {
        logger.error(`Error fetching package file: ${error} ${(error as {stack: string})?.stack?.toString()}`);
        response.status(500).send("Internal server error");
    }
};


/**
 * Helpers
 */

function parsePackageInfoFromPath(path: string): {packageId: string, organization: string, name: string, version: string, file: string} | undefined { 
    //@ts-ignore - regex groups
    const packageInfoRegex = /^\/?(?<packageId>(?:@(?<organization>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<name>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<version>[-a-z0-9><=_.^~]+))?(\/(?<file>[^\r\n]*))?$/;
    const matches = path.match(packageInfoRegex);
    if (!matches?.groups) {
        return;
    }

    let {packageId, organization, name, version, file} = matches.groups;
    if (file !== undefined && file.split(/[\/\\]/).some((segment) => DOT_DOT_SEGMENT.test(segment))) {
        return;
    }
    // also test for alpha and beta versions like 0.0.1-beta1
    version = /^\d+\.\d+\.\d+(-[\w\d]+)?/.test(version) ? version : "latest";
    
    return {packageId, organization, name, version, file};
}

function fetchFromRegistry(urlOrPath: string, config: NpmRegistryConfigEntry): Promise<Response> {
    const registryUrl = config?.registry.url;
    const headers: {[key: string]: string} = {}; 
    switch (config?.registry.auth.type) {
        case "none":
            break;
        case "basic":
            const basicUserPass = config?.registry.auth?.credentials;
            headers["Authorization"] = `Basic ${basicUserPass}`;
            break;
        case "bearer":
            const bearerToken = config?.registry.auth?.credentials;
            headers["Authorization"] = `Bearer ${bearerToken}`;
            break;
    }

    let url = urlOrPath;
    if (!urlOrPath.startsWith("http")) {
        const separator = urlOrPath.startsWith("/") ? "" : "/";
        url = `${registryUrl}${separator}${urlOrPath}`;
    }

    logger.debug(`Fetch from registry: ${url}, ${JSON.stringify(headers)}`);
    return fetch(url, {headers});
}

function fetchPackageInfo(packageName: string, config: NpmRegistryConfigEntry): Promise<PackagesVersionInfo|null> {
    return fetchFromRegistry(`/${packageName}`, config).then(res => {
        if (!res.ok) {
            logger.error(`Failed to fetch package info for package ${packageName}: ${res.statusText}`);
            return null;
        }
        return res.json();
    });
}

async function fetchAndUnpackTarball(url: string, packageId: string, packageVersion: string, config: NpmRegistryConfigEntry, baseDir: string) {
    // Fetch tarball
    const response: Response = await fetchFromRegistry(url, config);
    if (!response.ok) {
        throw new UpstreamResponseError(response.status, await response.text());
    }
    if (!await fileExists(baseDir)) {
        await fs.mkdir(baseDir, { recursive: true });
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `${baseDir}/${url.split("/").pop()}`;
    await fs.writeFile(path, buffer);

    // Unpack tarball, and remove the .tgz whether or not tar succeeds
    try {
        const destinationPath = `${baseDir}/${packageId}/${packageVersion}`;
        await fs.mkdir(destinationPath, { recursive: true });
        await new Promise<void> ((resolve, reject) => {
            const tar = spawn("tar", ["-xvf", path, "-C", destinationPath]);
            tar.on("close", (code) => code === 0 ? resolve() : reject());
        });
    } finally {
        await fs.rm(path, { force: true });
    }
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

import "../common/logger";
import fs from "fs/promises";
import { spawn } from "child_process";
import { Request as ServerRequest, Response as ServerResponse } from "express";
import { NpmRegistryService, NpmRegistryConfigEntry, NpmRegistryConfig } from "../services/npmRegistry";


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

        if (!request.body.workspaceId && !request.body.npmRegistryConfig) {
            return response.status(400).send("Missing workspaceId and/or npmRegistryConfig");
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
    
    if (!request.body.workspaceId && !request.body.npmRegistryConfig) {
        return response.status(400).send("Missing workspaceId and/or npmRegistryConfig");
    }

    const {workspaceId, npmRegistries: npmRegistryConfig}: RequestConfig = request.body;
    const registryConfig: NpmRegistryConfig = npmRegistryConfig;
    const registry = NpmRegistryService.getRegistryEntryForPackageWithConfig(pathPackageInfo.packageId, registryConfig);

    fetchPackageFileInner(request, response, {workspaceId, registry});
}

export async function fetchPackageFile(request: ServerRequest, response: ServerResponse) {
    const path = request.path.replace(fetchPackageFileBasePath, "");
    logger.info(`Fetch file for path: ${path}`);

    const pathPackageInfo = parsePackageInfoFromPath(path);
    if (!pathPackageInfo) {
        return response.status(400).send(`Invalid package path: ${path}`);
    }

    const registry = NpmRegistryService.getInstance().getRegistryEntryForPackage(pathPackageInfo.packageId);
    fetchPackageFileInner(request, response, {registry});
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
            const packageInfo: PackagesVersionInfo|null = await fetchPackageInfo(packageId, registry);
            if (packageInfo === null) {
                return response.status(404).send("Not found");
            }
            packageVersion = packageInfo["dist-tags"].latest;
        }

        // Wait for package to be processed if it's already being processed
        if (PackageProcessingQueue.has(packageId)) {
            logger.info("Waiting for package to be processed", packageId);
            await PackageProcessingQueue.wait(packageId);
        }
    
        const baseDir = `${CACHE_DIR}/${workspaceId ?? "default"}`;
        const packageBaseDir = `${baseDir}/${packageId}/${packageVersion}/package`;
        const packageExists = await fileExists(`${packageBaseDir}/package.json`)
        if (!packageExists) {
            try {
                logger.info(`Package does not exist, fetch from registy: ${packageId}@${packageVersion}`);
                PackageProcessingQueue.add(packageId);
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
                logger.error(`Error fetching package: ${error} ${(error as {stack: string}).stack}`);
                return response.status(500).send("Internal server error");
            } finally {
                PackageProcessingQueue.resolve(packageId);
            }
        } else {
            logger.info(`Package already exists, serve from cache: ${packageBaseDir}/${file}`)
        }
  
        // Fallback to index.mjs if index.js is not present
        if (file === "index.js" && !await fileExists(`${packageBaseDir}/${file}`)) {
            logger.debug("Fallback to index.mjs");
            return response.sendFile(`${packageBaseDir}/index.mjs`);
        }
    
        return response.sendFile(`${packageBaseDir}/${file}`);
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
    if (!await fileExists(baseDir)) {
        await fs.mkdir(baseDir, { recursive: true });
    }
    
    // Fetch tarball
    const response: Response = await fetchFromRegistry(url, config);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `${baseDir}/${url.split("/").pop()}`;
    await fs.writeFile(path, buffer);
    
    // Unpack tarball
    const destinationPath = `${baseDir}/${packageId}/${packageVersion}`;
    await fs.mkdir(destinationPath, { recursive: true });
    await new Promise<void> ((resolve, reject) => {
        const tar = spawn("tar", ["-xvf", path, "-C", destinationPath]);
        tar.on("close", (code) => code === 0 ? resolve() : reject());
    });

    // Cleanup
    await fs.unlink(path);
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

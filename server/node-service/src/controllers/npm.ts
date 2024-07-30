import "../common/logger";
import fs from "fs/promises";
import { spawn } from "child_process";
import { response, Request as ServerRequest, Response as ServerResponse } from "express";
import { NpmRegistryService, NpmRegistryConfigEntry, NpmRegistryConfig } from "../services/npmRegistry";


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

    public static add(packageId: string) {
        PackageProcessingQueue.promiseRegistry[packageId] = new Promise<void>((resolve) => {
            PackageProcessingQueue.resolveRegistry[packageId] = resolve;
        });
    }

    public static has(packageId: string) {
        return !!PackageProcessingQueue.promiseRegistry[packageId];
    }

    public static wait(packageId: string) {
        if (!PackageProcessingQueue.has(packageId)) {
            return Promise.resolve();
        }   
        return PackageProcessingQueue.promiseRegistry[packageId];
    }

    public static resolve(packageId: string) {
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

        const registryConfig: NpmRegistryConfig = request.body;
        const config = NpmRegistryService.getRegistryEntryForPackageWithConfig(pathPackageInfo.packageId, registryConfig);

        const registryResponse = await fetchFromRegistry(path, config);
        response.json(await registryResponse.json());
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

        const config = NpmRegistryService.getInstance().getRegistryEntryForPackage(pathPackageInfo.packageId);
        const registryResponse = await fetchFromRegistry(path, config);
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
    
    const registryConfig: NpmRegistryConfig = request.body;
    const config = NpmRegistryService.getRegistryEntryForPackageWithConfig(pathPackageInfo.packageId, registryConfig);

    fetchPackageFileInner(request, response, config);
}

export async function fetchPackageFile(request: ServerRequest, response: ServerResponse) {
    const path = request.path.replace(fetchPackageFileBasePath, "");
    logger.info(`Fetch file for path: ${path}`);

    const pathPackageInfo = parsePackageInfoFromPath(path);
    if (!pathPackageInfo) {
        return response.status(400).send(`Invalid package path: ${path}`);
    }

    const config = NpmRegistryService.getInstance().getRegistryEntryForPackage(pathPackageInfo.packageId);
    fetchPackageFileInner(request, response, config);
}

async function fetchPackageFileInner(request: ServerRequest, response: ServerResponse, config: NpmRegistryConfigEntry) {
    try {
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
            const packageInfo: PackagesVersionInfo|null = await fetchPackageInfo(packageId, config);
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
    
        const packageBaseDir = `${CACHE_DIR}/${packageId}/${packageVersion}/package`;
        const packageExists = await fileExists(`${packageBaseDir}/package.json`)
        if (!packageExists) {
            try {
                logger.info(`Package does not exist, fetch from registy: ${packageId}@${packageVersion}`);
                PackageProcessingQueue.add(packageId);
                if (!packageInfo) {
                    packageInfo = await fetchPackageInfo(packageId, config);
                }
                
                if (!packageInfo || !packageInfo.versions || !packageInfo.versions[packageVersion]) {
                    return response.status(404).send("Not found");
                }
                
                const tarball = packageInfo.versions[packageVersion].dist.tarball;
                logger.info(`Fetching tarball: ${tarball}`);
                await fetchAndUnpackTarball(tarball, packageId, packageVersion, config);
            } catch (error) {
                logger.error("Error fetching package tarball", error);
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
    const packageInfoRegex = /^\/?(?<packageId>(?:@(?<organization>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<name>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<version>[-a-z0-9><=_.^~]+))?\/(?<file>[^\r\n]*)?$/;
    const matches = path.match(packageInfoRegex);
    if (!matches?.groups) {
        return;
    }

    let {packageId, organization, name, version, file} = matches.groups;
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

async function fetchAndUnpackTarball(url: string, packageId: string, packageVersion: string, config: NpmRegistryConfigEntry) {
    const response: Response = await fetchFromRegistry(url, config);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `${CACHE_DIR}/${url.split("/").pop()}`;
    await fs.writeFile(path, buffer);
    await unpackTarball(path, packageId, packageVersion);
    await fs.unlink(path);
}

async function unpackTarball(path: string, packageId: string, packageVersion: string) {
    const destinationPath = `${CACHE_DIR}/${packageId}/${packageVersion}`;
    await fs.mkdir(destinationPath, { recursive: true });
    await new Promise<void> ((resolve, reject) => {
        const tar = spawn("tar", ["-xvf", path, "-C", destinationPath]);
        tar.on("close", (code) => {
            code === 0 ? resolve() : reject();
        });
    });
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

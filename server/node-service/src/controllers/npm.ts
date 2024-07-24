import "../common/logger";
import fs from "fs/promises";
import { spawn } from "child_process";
import { Request as ServerRequest, Response as ServerResponse } from "express";
import { NpmRegistryService, NpmRegistryConfigEntry } from "../services/npmRegistry";


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


/**
 * Initializes npm registry cache directory
 */
const CACHE_DIR = process.env.NPM_CACHE_DIR || "/tmp/npm-package-cache";
try {
    fs.mkdir(CACHE_DIR, { recursive: true });
} catch (error) {
    console.error("Error creating cache directory", error);
}


/**
 * Fetches package info from npm registry
 */
const fetchRegistryBasePath = "/npm/registry";
export async function fetchRegistry(request: ServerRequest, response: ServerResponse) {
    try {
        const path = request.path.replace(fetchRegistryBasePath, "");
        logger.info(`Fetch registry info for path: ${path}`);

        const pathPackageInfo = parsePackageInfoFromPath(path);
        if (!pathPackageInfo) {
            return response.status(400).send(`Invalid package path: ${path}`);
        }
        const {organization, name} = pathPackageInfo;
        const packageName = organization ? `@${organization}/${name}` : name;

        const registryResponse = await fetchFromRegistry(packageName, path);
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
export async function fetchPackageFile(request: ServerRequest, response: ServerResponse) {
    try {
        const path = request.path.replace(fetchPackageFileBasePath, "");
        logger.info(`Fetch file for path: ${path}`);
    
        const pathPackageInfo = parsePackageInfoFromPath(path);
        if (!pathPackageInfo) {
            return response.status(400).send(`Invalid package path: ${path}`);
        }
     
        logger.info(`Fetch file for package: ${JSON.stringify(pathPackageInfo)}`);
        const {organization, name, version, file} = pathPackageInfo;
        const packageName = organization ? `@${organization}/${name}` : name;
        let packageVersion = version;
    
        let packageInfo: PackagesVersionInfo | null = null;
        if (version === "latest") {
            const packageInfo: PackagesVersionInfo = await fetchPackageInfo(packageName);
            packageVersion = packageInfo["dist-tags"].latest;
        }
    
        const packageBaseDir = `${CACHE_DIR}/${packageName}/${packageVersion}/package`;
        const packageExists = await fileExists(`${packageBaseDir}/package.json`)
        if (!packageExists) {
            if (!packageInfo) {
                packageInfo = await fetchPackageInfo(packageName);
            }
    
            if (!packageInfo || !packageInfo.versions || !packageInfo.versions[packageVersion]) {
                return response.status(404).send("Not found");
            }
            
            const tarball = packageInfo.versions[packageVersion].dist.tarball;
            logger.info("Fetching tarball...", tarball);
            await fetchAndUnpackTarball(tarball, packageName, packageVersion);
        }
  
        // Fallback to index.mjs if index.js is not present
        if (file === "index.js" && !await fileExists(`${packageBaseDir}/${file}`)) {
            logger.info("Fallback to index.mjs");
            return response.sendFile(`${packageBaseDir}/index.mjs`);
        }
    
        return response.sendFile(`${packageBaseDir}/${file}`);
    } catch (error) {
        logger.error("Error fetching package file", error);
        response.status(500).send("Internal server error");
    }
};


/**
 * Helpers
 */

function parsePackageInfoFromPath(path: string): {organization: string, name: string, version: string, file: string} | undefined { 
    logger.info(`Parse package info from path: ${path}`);
    //@ts-ignore - regex groups
    const packageInfoRegex = /^\/?(?<fullName>(?:@(?<organization>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<name>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<version>[-a-z0-9><=_.^~]+))?\/(?<file>[^\r\n]*)?$/;
    const matches = path.match(packageInfoRegex);
    logger.info(`Parse package matches: ${JSON.stringify(matches)}`);
    if (!matches?.groups) {
        return;
    }

    let {organization, name, version, file} = matches.groups;
    version = /^\d+\.\d+\.\d+(-[\w\d]+)?/.test(version) ? version : "latest";
    
    return {organization, name, version, file};
}

function fetchFromRegistry(packageName: string, urlOrPath: string): Promise<Response> {
    const config: NpmRegistryConfigEntry = NpmRegistryService.getInstance().getRegistryEntryForPackage(packageName);
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

    logger.debug(`Fetch from registry: ${url}`);
    return fetch(url, {headers});
}

function fetchPackageInfo(packageName: string): Promise<PackagesVersionInfo> {
    return fetchFromRegistry(packageName, packageName).then(res => res.json());
}

async function fetchAndUnpackTarball(url: string, packageName: string, packageVersion: string) {
    const response: Response = await fetchFromRegistry(packageName, url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `${CACHE_DIR}/${url.split("/").pop()}`;
    await fs.writeFile(path, buffer);
    await unpackTarball(path, packageName, packageVersion);
    await fs.unlink(path);
}

async function unpackTarball(path: string, packageName: string, packageVersion: string) {
    const destinationPath = `${CACHE_DIR}/${packageName}/${packageVersion}`;
    await fs.mkdir(destinationPath, { recursive: true });
    await new Promise<void> ((resolve, reject) => {
        const tar = spawn("tar", ["-xvf", path, "-C", destinationPath]);
        tar.stdout.on("data", (data) => logger.info(data));
        tar.stderr.on("data", (data) => console.error(data));
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

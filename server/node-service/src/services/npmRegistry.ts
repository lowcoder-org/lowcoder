type BasicAuthType = {
    type: "basic",
    credentials: string,
}

type BearerAuthType = {
    type: "bearer",
    credentials: string,
};

type NoAuthType = {
    type: "none"
};

type OrganizationScope = {
    type: "organization",
    pattern: string
};

type PackageScope = {
    type: "package",
    pattern: string
};

type GlobalScope = {
    type: "global"
};

export type NpmRegistryConfigEntry = {
    scope: OrganizationScope | PackageScope | GlobalScope,
    registry: {
        url: string,
        auth: BasicAuthType | BearerAuthType | NoAuthType
    }
};

export type NpmRegistryConfig = NpmRegistryConfigEntry[];

export class NpmRegistryService {

    public static DEFAULT_REGISTRY: NpmRegistryConfigEntry = {
        scope: { type: "global" },
        registry: {
            url: "https://registry.npmjs.org",
            auth: { type: "none" }
        }
    };

    private static instance: NpmRegistryService;

    private readonly registryConfig: NpmRegistryConfig = [];

    private constructor() {
        const registryConfig = this.getRegistryConfig();
        if (registryConfig.length === 0 || !registryConfig.some(entry => entry.scope.type === "global")) {
            registryConfig.push(NpmRegistryService.DEFAULT_REGISTRY);
        }
        this.registryConfig = registryConfig;
    }

    public static getInstance(): NpmRegistryService {
        if (!NpmRegistryService.instance) {
            NpmRegistryService.instance = new NpmRegistryService();
        }
        return NpmRegistryService.instance;
    }

    private getRegistryConfig(): NpmRegistryConfig {
        const registryConfig = process.env.NPM_REGISTRY_CONFIG;
        if (!registryConfig) {
            return [];
        }
    
        try {
            const config = JSON.parse(registryConfig);
            return NpmRegistryService.sortRegistryConfig(config);
        } catch (error) {
            logger.error(`Error parsing NPM registry config: ${error}`);
            return [];
        }
    }

    private static sortRegistryConfig(registryConfig: NpmRegistryConfig): NpmRegistryConfig {
        const globalRegistries = registryConfig.filter((entry: NpmRegistryConfigEntry) => entry.scope.type === "global");
        const orgRegistries = registryConfig.filter((entry: NpmRegistryConfigEntry) => entry.scope.type === "organization");
        const packageRegistries = registryConfig.filter((entry: NpmRegistryConfigEntry) => entry.scope.type === "package");
        // Order of precedence: package > organization > global
        return [...packageRegistries, ...orgRegistries, ...globalRegistries];
    }
    
    public getRegistryEntryForPackage(packageName: string): NpmRegistryConfigEntry {
        const config: NpmRegistryConfigEntry | undefined = this.registryConfig.find(entry => {
            if (entry.scope.type === "organization") {
                return packageName.startsWith(entry.scope.pattern);
            } else if (entry.scope.type === "package") {
                return packageName === entry.scope.pattern;
            } else {
                return true;
            }
        });

        if (!config) {
            logger.info(`No registry entry found for package: ${packageName}`);
            return NpmRegistryService.DEFAULT_REGISTRY;
        } else {
            logger.info(`Found registry entry for package: ${packageName} -> ${config.registry.url}`);
        }

        return config;
    }

    public static getRegistryEntryForPackageWithConfig(packageName: string, registryConfig: NpmRegistryConfig): NpmRegistryConfigEntry {
        registryConfig = NpmRegistryService.sortRegistryConfig(registryConfig);
        const config: NpmRegistryConfigEntry | undefined = registryConfig.find(entry => {
            if (entry.scope.type === "organization") {
                return packageName.startsWith(entry.scope.pattern);
            } else if (entry.scope.type === "package") {
                return packageName === entry.scope.pattern;
            } else {
                return true;
            }
        });

        if (!config) {
            logger.info(`No registry entry found for package: ${packageName}`);
            return NpmRegistryService.DEFAULT_REGISTRY;
        } else {
            logger.info(`Found registry entry for package: ${packageName} -> ${config.registry.url}`);
        }

        return config;
    }
}

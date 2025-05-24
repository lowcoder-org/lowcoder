/**
 * Represents a DataSource configuration
 */
export interface DataSourceConfig {
    usingUri: boolean;
    srvMode: boolean;
    ssl: boolean;
    endpoints: any[];
    host: string | null;
    port: number;
    database: string | null;
    username: string;
    authMechanism: string | null;
  }
  
  /**
   * Represents a DataSource entity
   */
  export interface DataSource {
    id: string;
    createdBy: string;
    gid: string;
    name: string;
    type: string;
    organizationId: string;
    creationSource: number;
    datasourceStatus: string;
    pluginDefinition: any | null;
    createTime: number;
    datasourceConfig: DataSourceConfig;
    managed?: boolean;
  }
  
  /**
   * Represents a DataSource with additional metadata
   */
  export interface DataSourceWithMeta {
    datasource: DataSource;
    edit: boolean;
    creatorName: string;
  }

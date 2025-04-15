// types/query.types.ts
import { DeployableItem } from './deployable-item.types';

export interface LibraryQueryDSL {
  query: {
    compType: string;
    comp: {
      bodyType: string;
      body: string;
      httpMethod: string;
      path: string;
      headers: Array<{ key: string; value: string }>;
      params: Array<{ key: string; value: string }>;
      bodyFormData: Array<{ key: string; value: string; type: string }>;
    };
    id: string;
    name: string;
    order: number;
    datasourceId: string;
    triggerType: string;
    onEvent: any[];
    notification: {
      showSuccess: boolean;
      showFail: boolean;
      fail: any[];
    };
    timeout: string;
    confirmationModal: any;
    variables: any[];
    periodic: boolean;
    periodicTime: string;
    cancelPrevious: boolean;
    depQueryName: string;
    delayTime: string;
  };
}

export interface Query extends DeployableItem {
  id: string;
  gid: string;
  organizationId: string;
  name: string;
  libraryQueryDSL: LibraryQueryDSL;
  createTime: number;
  creatorName: string;
  managed?: boolean;
}

export interface QueryResponse {
  code: number;
  message: string;
  data: Query[];
  pageNum: number;
  pageSize: number;
  total: number;
  success: boolean;
}
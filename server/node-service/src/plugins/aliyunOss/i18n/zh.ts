import { en } from "./en";

export const zh: typeof en = {
  name: "阿里云对象存储",
  description: "支持OSS对象存储服务（基于 STS 身份认证）",
  skRequiredMessage: "请输入 SecretKey",
  akRequiredMessage: "请输入 AccessKey",
  arnRequiredMessage: "请输入阿里云ARN",
  endpointUrlTooltip: "STS 服务接入点",
  arnTooltip: "角色的全局资源描述符",
  bucket: "存储桶",
  region: "OSS 区域",
  returnSignedUrl: "返回文件签名地址",
  actions: "方法",
  prefix: "前缀",
  delimiter: "分隔符",
  limit: "最大文件数",
  fileName: "文件名",
  dataType: "数据类型",
  data: "数据",
  dataTooltip:"数据内容仅支持 BASE64 编码，例：window.btoa(xxx)",
  messages: {
    bucketRequired: "需要提供存储桶名称",
  },
  actionName: {
    listBuckets: "查询桶列表",
    listObjects: "获取文件列表",
    uploadFile: "上传文件",
    readFile: "读取文件",
    deleteFile: "删除文件",
  },
};

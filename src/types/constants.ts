export const ISSUE_TYPE_LABELS: Record<string, string> = {
  dimension: '尺寸不合规',
  fileSize: '文件过大',
  whiteBackground: '非白底',
  duplicate: '重复图片',
  missingAngle: '缺少角度',
  naming: '命名冲突',
};

export const IMAGE_TYPE_LABELS: Record<string, string> = {
  main: '主图',
  detail: '细节图',
  scene: '场景图',
  unknown: '未知',
};

export const SEVERITY_COLORS: Record<string, string> = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  success: '#10b981',
};

export const SEVERITY_LABELS: Record<string, string> = {
  error: '错误',
  warning: '警告',
  info: '提示',
  success: '成功',
};

export const STATUS_LABELS: Record<string, string> = {
  idle: '待处理',
  scanning: '扫描中',
  processing: '处理中',
  completed: '已完成',
  error: '错误',
  pending: '待处理',
};

export const NAMING_VARIABLES = [
  { key: '{商品编码}', label: '商品编码', description: '从文件名提取的SKU编码' },
  { key: '{平台}', label: '平台', description: '当前选择的平台名称' },
  { key: '{类型}', label: '图片类型', description: '主图/细节图/场景图' },
  { key: '{序号}', label: '序号', description: '图片在组内的序号' },
  { key: '{角度}', label: '角度', description: '图片拍摄角度' },
  { key: '{日期}', label: '日期', description: '处理日期 YYYYMMDD' },
];

export const DEFAULT_ANGLES = ['正面', '侧面', '背面', '顶部', '底部', '细节1', '细节2', '细节3'];

export const DEFAULT_NAMING_TEMPLATE = '{商品编码}_{类型}_{序号}_{角度}';

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

export const MAX_PREVIEW_SIZE = 200;

export const P_HASH_SIZE = 32;
export const P_HASH_SMALL_SIZE = 8;

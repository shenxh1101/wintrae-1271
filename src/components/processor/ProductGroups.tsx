import { useState } from 'react';
import { Package, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { useProcessStore } from '@/store/processStore';
import { IMAGE_TYPE_LABELS } from '@/types/constants';
import { cn } from '@/lib/utils';

export const ProductGroups = () => {
  const { currentBatch } = useProcessStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!currentBatch || currentBatch.productGroups.length === 0) return null;

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupImages = (group: typeof currentBatch.productGroups[0]) => {
    return currentBatch.images.filter((img) => group.imageIds.includes(img.id));
  };

  const getGroupStatus = (group: typeof currentBatch.productGroups[0]) => {
    const images = getGroupImages(group);
    const hasIssues = images.some((img) => img.issues.some((i) => !i.resolved));

    if (group.missingAngles.length > 0 || hasIssues) return 'warning';
    if (!group.hasMainImage) return 'error';
    return 'success';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-900" />
          <CardTitle>商品分组</CardTitle>
          <Badge variant="info">{currentBatch.productGroups.length} 个商品</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {currentBatch.productGroups.map((group) => {
            const images = getGroupImages(group);
            const status = getGroupStatus(group);
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id}>
                <div
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      status === 'success' && 'bg-emerald-100',
                      status === 'warning' && 'bg-amber-100',
                      status === 'error' && 'bg-red-100',
                    )}
                  >
                    {status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                    {status === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                    {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{group.productCode}</span>
                      <Badge variant="gray">{images.length} 张图片</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        主图: {group.hasMainImage ? '✓' : '✗'}
                      </span>
                      <span className="text-sm text-gray-500">
                        细节图: {group.hasDetailImages ? '✓' : '✗'}
                      </span>
                      <span className="text-sm text-gray-500">
                        场景图: {group.hasSceneImages ? '✓' : '✗'}
                      </span>
                      {group.missingAngles.length > 0 && (
                        <span className="text-sm text-amber-600">
                          缺少: {group.missingAngles.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {images.slice(0, 4).map((img) => (
                        <img
                          key={img.id}
                          src={img.preview}
                          alt={img.originalName}
                          className="w-8 h-8 rounded border-2 border-white object-cover"
                        />
                      ))}
                      {images.length > 4 && (
                        <div className="w-8 h-8 rounded border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-6 gap-3">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative group"
                        >
                          <img
                            src={img.preview}
                            alt={img.originalName}
                            className="w-full aspect-square object-cover rounded-lg border-2 border-transparent hover:border-blue-400 transition-colors"
                          />
                          <div className="absolute top-1 left-1">
                            <Badge
                              variant={
                                img.imageType === 'main'
                                  ? 'success'
                                  : img.imageType === 'detail'
                                  ? 'info'
                                  : 'warning'
                              }
                              className="text-[10px] px-1 py-0"
                            >
                              {IMAGE_TYPE_LABELS[img.imageType]?.charAt(0)}
                            </Badge>
                          </div>
                          {img.issues.some((i) => !i.resolved) && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">
                                {img.issues.filter((i) => !i.resolved).length}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

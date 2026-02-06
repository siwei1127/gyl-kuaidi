import { useEffect, useMemo, useState } from 'react';

import {
  CreateReconciliationBatchBody,
  ReconciliationBatchListItem,
} from '@shared/api.interface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { axiosForBackend } from '@/lib/axiosForBackend';

const statusLabel: Record<string, string> = {
  draft: '待导入',
  processing: '处理中',
  completed: '已完成',
  archived: '已归档',
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<ReconciliationBatchListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [courier, setCourier] = useState('');
  const [form, setForm] = useState<CreateReconciliationBatchBody>({
    name: '',
    courier: '',
    reconciliationMonth: '',
  });

  const totalSummary = useMemo(() => {
    return batches.reduce(
      (acc, item) => {
        acc.totalDifference += item.totalDifference;
        acc.exceptionCount += item.exceptionCount;
        acc.pendingExceptionCount += item.pendingExceptionCount;
        return acc;
      },
      { totalDifference: 0, exceptionCount: 0, pendingExceptionCount: 0 },
    );
  }, [batches]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await axiosForBackend.get<ReconciliationBatchListItem[]>(
        '/api/reconciliation-batches',
        {
          params: {
            status: status || undefined,
            courier: courier || undefined,
            page: 1,
            limit: 20,
          },
        },
      );
      setBatches(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, [status, courier]);

  const handleCreate = async () => {
    if (!form.name || !form.courier || !form.reconciliationMonth) {
      return;
    }

    await axiosForBackend.post('/api/reconciliation-batches', form);
    setForm({ name: '', courier: '', reconciliationMonth: '' });
    await loadBatches();
  };

  const handleArchive = async (id: string) => {
    await axiosForBackend.patch(`/api/reconciliation-batches/${id}/status`, {
      status: 'archived',
    });
    await loadBatches();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <Label>批次状态</Label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">全部</option>
            <option value="draft">待导入</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>快递公司</Label>
          <Input
            placeholder="输入快递公司"
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label>批次名称</Label>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="2025-02 顺丰华东账单"
            />
          </div>
          <div className="space-y-1">
            <Label>快递公司</Label>
            <Input
              value={form.courier}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, courier: event.target.value }))
              }
              placeholder="顺丰"
            />
          </div>
          <div className="space-y-1">
            <Label>对账月份</Label>
            <Input
              value={form.reconciliationMonth}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  reconciliationMonth: event.target.value,
                }))
              }
              placeholder="YYYY-MM"
            />
          </div>
          <Button className="self-end" onClick={handleCreate}>
            新建批次
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => (
          <Card key={batch.id}>
            <CardHeader>
              <CardTitle>{batch.name}</CardTitle>
              <CardDescription>{batch.courier}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>总差额</span>
                <span className="font-medium text-slate-900">
                  {batch.totalDifference.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>异常订单数</span>
                <span className="font-medium text-slate-900">
                  {batch.exceptionCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>待处理异常</span>
                <span className="font-medium text-slate-900">
                  {batch.pendingExceptionCount}
                </span>
              </div>
              <Badge>{statusLabel[batch.status] ?? batch.status}</Badge>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                disabled={batch.status === 'archived'}
                onClick={() => handleArchive(batch.id)}
              >
                归档批次
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-sm text-slate-500">正在加载批次数据...</div>
      )}

      {!loading && batches.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          暂无批次，请新建对账批次或调整筛选条件。
        </div>
      )}

      <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm">
        <div>
          <div className="text-xs text-slate-500">批次总差额</div>
          <div className="text-lg font-semibold text-slate-900">
            {totalSummary.totalDifference.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">异常订单总数</div>
          <div className="text-lg font-semibold text-slate-900">
            {totalSummary.exceptionCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">待处理异常</div>
          <div className="text-lg font-semibold text-slate-900">
            {totalSummary.pendingExceptionCount}
          </div>
        </div>
      </div>
    </div>
  );
}

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

const statusTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-500',
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
  const [importBatchId, setImportBatchId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importTip, setImportTip] = useState('');

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
            limit: 50,
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

  const handleImport = async () => {
    if (!importBatchId || !importFile) {
      setImportTip('请先选择批次并上传账单文件。');
      return;
    }
    setImportTip('');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const response = await axiosForBackend.post(
        `/api/reconciliation-batches/${importBatchId}/import`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      setImportTip(
        `导入完成：成功 ${response.data.insertedCount} 条，跳过 ${response.data.skippedCount} 条。`,
      );
      setImportFile(null);
      await loadBatches();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">对账批次</div>
          <div className="text-sm text-slate-500">
            维护每月账单批次，完成导入、异常审核与归档结算。
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>批次总差额</CardTitle>
            <CardDescription>汇总所有批次差额</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {totalSummary.totalDifference.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>异常订单总数</CardTitle>
            <CardDescription>待核对的异常订单</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {totalSummary.exceptionCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待处理异常</CardTitle>
            <CardDescription>仍需人工处理</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-slate-900">
            {totalSummary.pendingExceptionCount}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>批次筛选</CardTitle>
            <CardDescription>快速定位需要处理的账单批次</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>批次状态</Label>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>新建批次</CardTitle>
            <CardDescription>登记月度账单批次</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
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
            <div className="space-y-1 md:col-span-2">
              <Label>快递公司</Label>
              <Input
                value={form.courier}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, courier: event.target.value }))
                }
                placeholder="顺丰"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate}>保存批次</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账单导入</CardTitle>
          <CardDescription>
            上传快递公司账单 Excel，系统将自动标注异常订单。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[2fr_3fr_auto]">
          <div className="space-y-1">
            <Label>选择批次</Label>
            <Select
              value={importBatchId}
              onChange={(event) => setImportBatchId(event.target.value)}
            >
              <option value="">请选择批次</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>上传账单文件</Label>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:text-slate-700"
              onChange={(event) =>
                setImportFile(event.target.files?.[0] ?? null)
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleImport}
              disabled={!importBatchId || !importFile || importing}
            >
              {importing ? '导入中...' : '开始导入'}
            </Button>
          </div>
        </CardContent>
        {importTip && (
          <CardFooter className="text-xs text-slate-500">{importTip}</CardFooter>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">批次列表</div>
        {loading && <div className="text-xs text-slate-500">加载中...</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => {
          const canArchive =
            batch.pendingExceptionCount === 0 && batch.status !== 'archived';
          return (
            <Card key={batch.id} className="border-slate-200">
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
                <Badge className={statusTone[batch.status]}>
                  {statusLabel[batch.status] ?? batch.status}
                </Badge>
              </CardContent>
              <CardFooter className="items-center justify-between">
                <div className="text-xs text-slate-500">
                  {canArchive
                    ? '异常处理完成，可归档付款'
                    : '仍有待处理异常'}
                </div>
                <Button
                  variant="outline"
                  disabled={!canArchive}
                  onClick={() => handleArchive(batch.id)}
                >
                  归档批次
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {!loading && batches.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          暂无批次，请新建对账批次或调整筛选条件。
        </div>
      )}
    </div>
  );
}

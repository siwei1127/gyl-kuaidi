import { useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';

import {
  BatchUpdateOrdersBody,
  ExceptionOrderItem,
  OrderExceptionsQuery,
  OrderExceptionsResponse,
  ReconciliationBatchListItem,
} from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { axiosForBackend } from '@/lib/axiosForBackend';
import { Table as AntdTable } from '@lark-apaas/client-toolkit/antd-table';

const conclusionLabel: Record<string, string> = {
  pending: '待处理',
  approved: '通过',
  rejected: '驳回',
};

export default function ExceptionsPage() {
  const [items, setItems] = useState<ExceptionOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [batches, setBatches] = useState<ReconciliationBatchListItem[]>([]);
  const [filters, setFilters] = useState<OrderExceptionsQuery>({
    batchId: '',
    courier: '',
    exceptionType: '',
    minDiff: undefined,
    maxDiff: undefined,
    conclusion: undefined,
    page: 1,
    limit: 50,
  });
  const [batchConclusion, setBatchConclusion] =
    useState<BatchUpdateOrdersBody['conclusion']>('approved');
  const [processingNote, setProcessingNote] = useState('');

  const columns = useMemo(
    () => [
      { title: '运单号', dataIndex: 'waybillNumber', key: 'waybillNumber' },
      { title: '快递公司', dataIndex: 'courier', key: 'courier' },
      { title: '省份', dataIndex: 'province', key: 'province' },
      { title: '发货日期', dataIndex: 'shippingDate', key: 'shippingDate' },
      {
        title: '差额',
        dataIndex: 'totalDifference',
        key: 'totalDifference',
        render: (value: number) => (
          <span
            className={
              value > 0
                ? 'font-medium text-rose-600'
                : value < 0
                  ? 'font-medium text-emerald-600'
                  : 'text-slate-600'
            }
          >
            {value.toFixed(2)}
          </span>
        ),
      },
      {
        title: '异常类型',
        dataIndex: 'exceptionTypes',
        key: 'exceptionTypes',
        render: (types: string[]) => types.join(' / '),
      },
      {
        title: '结论',
        dataIndex: 'conclusion',
        key: 'conclusion',
        render: (value: string) => conclusionLabel[value] ?? value,
      },
      {
        title: '处理备注',
        dataIndex: 'processingNote',
        key: 'processingNote',
      },
    ],
    [],
  );

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys: Key[]) =>
      setSelectedKeys(keys.map((key) => String(key))),
  };

  const loadBatches = async () => {
    const response = await axiosForBackend.get<ReconciliationBatchListItem[]>(
      '/api/reconciliation-batches',
      { params: { page: 1, limit: 100 } },
    );
    setBatches(response.data);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axiosForBackend.get<OrderExceptionsResponse>(
        '/api/order-details/exceptions',
        {
          params: {
            batchId: filters.batchId || undefined,
            courier: filters.courier || undefined,
            exceptionType: filters.exceptionType || undefined,
            minDiff: filters.minDiff,
            maxDiff: filters.maxDiff,
            conclusion: filters.conclusion || undefined,
            page: filters.page,
            limit: filters.limit,
          },
        },
      );
      setItems(response.data.items);
      setTotal(response.data.total);
      setSelectedKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    void loadData();
  }, [
    filters.batchId,
    filters.courier,
    filters.exceptionType,
    filters.minDiff,
    filters.maxDiff,
    filters.conclusion,
    filters.page,
    filters.limit,
  ]);

  const handleBatchUpdate = async () => {
    if (!selectedKeys.length) {
      return;
    }

    await axiosForBackend.post('/api/order-details/batch-update', {
      waybillNumbers: selectedKeys,
      conclusion: batchConclusion,
      processingNote: processingNote || undefined,
    });

    setProcessingNote('');
    await loadData();
  };

  const handleExport = async () => {
    const response = await axiosForBackend.get(
      '/api/order-details/exceptions/export',
      {
        params: {
          batchId: filters.batchId || undefined,
          courier: filters.courier || undefined,
          exceptionType: filters.exceptionType || undefined,
          minDiff: filters.minDiff,
          maxDiff: filters.maxDiff,
          conclusion: filters.conclusion || undefined,
        },
        responseType: 'blob',
      },
    );

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `异常订单_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">异常工作台</div>
          <div className="text-sm text-slate-500">
            聚焦异常订单处理，支持批量审核与结果导出。
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          导出异常订单
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>按批次、快递公司与差额快速筛选</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <div className="space-y-1 md:col-span-2">
            <Label>对账批次</Label>
            <Select
              value={filters.batchId ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  batchId: event.target.value || undefined,
                  page: 1,
                }))
              }
            >
              <option value="">全部</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>快递公司</Label>
            <Input
              placeholder="输入快递公司"
              value={filters.courier}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  courier: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>异常类型</Label>
            <Input
              placeholder="重量偏差 / 超区费"
              value={filters.exceptionType}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  exceptionType: event.target.value,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>最小差额</Label>
            <Input
              type="number"
              value={filters.minDiff ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  minDiff: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>最大差额</Label>
            <Input
              type="number"
              value={filters.maxDiff ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  maxDiff: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                  page: 1,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>结论</Label>
            <Select
              value={filters.conclusion ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  conclusion: event.target.value
                    ? (event.target.value as OrderExceptionsQuery['conclusion'])
                    : undefined,
                  page: 1,
                }))
              }
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="approved">通过</option>
              <option value="rejected">驳回</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>批量处理</CardTitle>
          <CardDescription>
            已选 {selectedKeys.length} 条异常订单
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1">
            <Label>批量结论</Label>
            <Select
              value={batchConclusion}
              onChange={(event) =>
                setBatchConclusion(
                  event.target.value as BatchUpdateOrdersBody['conclusion'],
                )
              }
            >
              <option value="approved">通过</option>
              <option value="rejected">驳回</option>
              <option value="pending">待处理</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>处理备注</Label>
            <Textarea
              value={processingNote}
              onChange={(event) => setProcessingNote(event.target.value)}
              placeholder="填写异常处理备注"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleBatchUpdate}
              disabled={!selectedKeys.length}
            >
              批量更新
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>异常订单列表</CardTitle>
          <CardDescription>默认按差额从高到低排序</CardDescription>
        </CardHeader>
        <CardContent>
          <AntdTable
            rowKey="waybillNumber"
            loading={loading}
            dataSource={items}
            columns={columns}
            rowSelection={rowSelection}
            pagination={{
              total,
              pageSize: filters.limit,
              current: filters.page,
            }}
            onChange={(pagination: { current?: number; pageSize?: number }) => {
              setFilters((prev) => ({
                ...prev,
                page: pagination.current ?? 1,
                limit: pagination.pageSize ?? prev.limit,
              }));
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

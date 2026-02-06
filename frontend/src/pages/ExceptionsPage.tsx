import { useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';

import {
  BatchUpdateOrdersBody,
  ExceptionOrderItem,
  OrderExceptionsQuery,
  OrderExceptionsResponse,
} from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { axiosForBackend } from '@/lib/axiosForBackend';
import AntdTable from '@lark-apaas/client-toolkit/antd-table';

export default function ExceptionsPage() {
  const [items, setItems] = useState<ExceptionOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderExceptionsQuery>({
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
      },
      {
        title: '异常类型',
        dataIndex: 'exceptionTypes',
        key: 'exceptionTypes',
        render: (types: string[]) => types.join(' / '),
      },
      { title: '结论', dataIndex: 'conclusion', key: 'conclusion' },
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

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axiosForBackend.get<OrderExceptionsResponse>(
        '/api/order-details/exceptions',
        {
          params: {
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
    void loadData();
  }, [filters.courier, filters.exceptionType, filters.minDiff, filters.maxDiff, filters.conclusion]);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <div className="space-y-1 md:col-span-2">
          <Label>快递公司</Label>
          <Input
            placeholder="输入快递公司"
            value={filters.courier}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, courier: event.target.value }))
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
              }))
            }
          >
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="approved">通过</option>
            <option value="rejected">驳回</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[2fr_1fr_1fr_2fr_auto]">
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
        <div className="space-y-1 md:col-span-3">
          <Label>处理备注</Label>
          <Textarea
            value={processingNote}
            onChange={(event) => setProcessingNote(event.target.value)}
            placeholder="填写异常处理备注"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleBatchUpdate}>批量更新</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <AntdTable
          rowKey="waybillNumber"
          loading={loading}
          dataSource={items}
          columns={columns}
          rowSelection={rowSelection}
          pagination={{ total, pageSize: filters.limit }}
        />
      </div>
    </div>
  );
}

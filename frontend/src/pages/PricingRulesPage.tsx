import { useEffect, useMemo, useState } from 'react';

import {
  CreatePricingRuleBody,
  PricingRuleItem,
  PricingRuleListQuery,
  UpdatePricingRuleBody,
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

const emptyForm: CreatePricingRuleBody = {
  name: '',
  courier: '',
  firstWeight: 1,
  firstWeightPrice: 0,
  extraWeightPrice: 0,
  baseOperationFee: 0,
  toleranceExpressFee: 0,
  tolerancePackagingFee: 0,
};

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRuleItem[]>([]);
  const [filterCourier, setFilterCourier] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePricingRuleBody>(emptyForm);
  const [enabled, setEnabled] = useState(true);

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === selectedId) ?? null,
    [rules, selectedId],
  );

  const loadRules = async () => {
    const query: PricingRuleListQuery = {
      courier: filterCourier || undefined,
      enabled: filterEnabled ? filterEnabled === 'true' : undefined,
    };
    const response = await axiosForBackend.get<PricingRuleItem[]>(
      '/api/pricing-rules',
      { params: query },
    );
    setRules(response.data);
  };

  useEffect(() => {
    void loadRules();
  }, [filterCourier, filterEnabled]);

  useEffect(() => {
    if (selectedRule) {
      setForm({
        name: selectedRule.name,
        courier: selectedRule.courier,
        firstWeight: selectedRule.firstWeight,
        firstWeightPrice: selectedRule.firstWeightPrice,
        extraWeightPrice: selectedRule.extraWeightPrice,
        baseOperationFee: selectedRule.baseOperationFee,
        toleranceExpressFee: selectedRule.toleranceExpressFee,
        tolerancePackagingFee: selectedRule.tolerancePackagingFee,
      });
      setEnabled(selectedRule.enabled);
    } else {
      setForm(emptyForm);
      setEnabled(true);
    }
  }, [selectedRule]);

  const handleSave = async () => {
    if (selectedRule) {
      const payload: UpdatePricingRuleBody = {
        ...form,
        enabled,
      };
      await axiosForBackend.put(`/api/pricing-rules/${selectedRule.id}`, payload);
    } else {
      await axiosForBackend.post('/api/pricing-rules', form);
    }

    await loadRules();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-2xl font-semibold text-slate-900">计费标准</div>
        <div className="text-sm text-slate-500">
          维护快递计费规则与容差阈值，保障对账准确性。
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>规则列表</CardTitle>
            <CardDescription>按快递公司筛选现有规则</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>快递公司筛选</Label>
              <Input
                value={filterCourier}
                onChange={(event) => setFilterCourier(event.target.value)}
                placeholder="输入快递公司"
              />
            </div>
            <div className="space-y-1">
              <Label>启用状态</Label>
              <Select
                value={filterEnabled}
                onChange={(event) => setFilterEnabled(event.target.value)}
              >
                <option value="">全部</option>
                <option value="true">启用</option>
                <option value="false">停用</option>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedId(null);
              }}
            >
              新建规则
            </Button>
          </CardContent>
          <CardContent className="space-y-3 border-t border-slate-100 pt-4">
            {rules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  rule.id === selectedId
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedId(rule.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {rule.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rule.courier}
                    </div>
                  </div>
                  <Badge
                    className={
                      rule.enabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : undefined
                    }
                  >
                    {rule.enabled ? '启用' : '停用'}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedRule ? '编辑规则' : '新增规则'}</CardTitle>
            <CardDescription>
              设置首重、续重与各类费用容差
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>规则名称</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="顺丰-华东标准"
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
              <Label>首重 (kg)</Label>
              <Input
                type="number"
                value={form.firstWeight}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    firstWeight: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>首重价格</Label>
              <Input
                type="number"
                value={form.firstWeightPrice}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    firstWeightPrice: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>续重价格</Label>
              <Input
                type="number"
                value={form.extraWeightPrice}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    extraWeightPrice: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>基础操作费</Label>
              <Input
                type="number"
                value={form.baseOperationFee}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    baseOperationFee: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>快递费容差</Label>
              <Input
                type="number"
                value={form.toleranceExpressFee}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    toleranceExpressFee: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>包装费容差</Label>
              <Input
                type="number"
                value={form.tolerancePackagingFee}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    tolerancePackagingFee: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>启用状态</Label>
              <Select
                value={enabled ? 'true' : 'false'}
                onChange={(event) => setEnabled(event.target.value === 'true')}
              >
                <option value="true">启用</option>
                <option value="false">停用</option>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSave}>保存规则</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

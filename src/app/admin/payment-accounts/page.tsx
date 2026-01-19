'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PaymentAccount {
  id: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  webhookUrl?: string;
  createdAt: string;
}

export default function PaymentAccountsPage() {
  const { language } = useLanguage();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    type: 'stripe',
    accountName: '',
    accountNumber: '',
    bankName: '',
    currency: 'USD',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to load payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({
      type: 'stripe',
      accountName: '',
      accountNumber: '',
      bankName: '',
      currency: 'USD',
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      isActive: true,
      isDefault: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (account: PaymentAccount) => {
    setEditingAccount(account);
    setFormData({
      type: account.type,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName || '',
      currency: account.currency,
      apiKey: '',
      apiSecret: '',
      webhookUrl: account.webhookUrl || '',
      isActive: account.isActive,
      isDefault: account.isDefault,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingAccountId(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (account: PaymentAccount) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/payment-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          ...account,
          isActive: !account.isActive,
        }),
      });

      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Failed to toggle account status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAccount ? '/api/admin/payment-accounts' : '/api/admin/payment-accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount ? { ...formData, id: editingAccount.id } : formData),
      });

      if (response.ok) {
        await loadAccounts();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save payment account:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAccountId) return;

    try {
      const response = await fetch(`/api/admin/payment-accounts?id=${deletingAccountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAccounts();
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete payment account:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'wechat':
        return '💬';
      case 'alipay':
        return '💰';
      default:
        return '🏦';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'stripe':
        return 'Stripe';
      case 'paypal':
        return 'PayPal';
      case 'wechat':
        return 'WeChat Pay';
      case 'alipay':
        return 'Alipay';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'zh' ? '收款账户管理' : 'Payment Accounts'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'zh' ? '管理收款账户和支付方式' : 'Manage payment accounts and methods'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {language === 'zh' ? '添加账户' : 'Add Account'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '总账户数' : 'Total Accounts'}
                </p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '活跃账户' : 'Active Accounts'}
                </p>
                <p className="text-2xl font-bold">
                  {accounts.filter((a) => a.isActive).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '默认账户' : 'Default Accounts'}
                </p>
                <p className="text-2xl font-bold">
                  {accounts.filter((a) => a.isDefault).length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'zh' ? '账户列表' : 'Account List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'zh' ? '类型' : 'Type'}</TableHead>
                <TableHead>{language === 'zh' ? '账户名称' : 'Account Name'}</TableHead>
                <TableHead>{language === 'zh' ? '账户号码' : 'Account Number'}</TableHead>
                <TableHead>{language === 'zh' ? '货币' : 'Currency'}</TableHead>
                <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                <TableHead>{language === 'zh' ? '默认' : 'Default'}</TableHead>
                <TableHead className="text-right">
                  {language === 'zh' ? '操作' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(account.type)}</span>
                      <span>{getTypeName(account.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {account.accountNumber}
                  </TableCell>
                  <TableCell>{account.currency}</TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {account.isActive
                        ? (language === 'zh' ? '活跃' : 'Active')
                        : (language === 'zh' ? '停用' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.isDefault && (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        {language === 'zh' ? '默认' : 'Default'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(account)}
                        disabled={submitting}
                      >
                        {account.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAccount
                ? (language === 'zh' ? '编辑账户' : 'Edit Account')
                : (language === 'zh' ? '添加账户' : 'Add Account')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'zh'
                ? '填写收款账户信息'
                : 'Fill in the payment account details'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">
                  {language === 'zh' ? '类型' : 'Type'} *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="wechat">WeChat Pay</SelectItem>
                    <SelectItem value="alipay">Alipay</SelectItem>
                    <SelectItem value="bank_transfer">
                      {language === 'zh' ? '银行转账' : 'Bank Transfer'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">
                  {language === 'zh' ? '货币' : 'Currency'} *
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - 美元</SelectItem>
                    <SelectItem value="CNY">CNY - 人民币</SelectItem>
                    <SelectItem value="EUR">EUR - 欧元</SelectItem>
                    <SelectItem value="GBP">GBP - 英镑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="accountName">
                {language === 'zh' ? '账户名称' : 'Account Name'} *
              </Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">
                {language === 'zh' ? '账户号码' : 'Account Number'} *
              </Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
            </div>

            {formData.type === 'bank_transfer' && (
              <div>
                <Label htmlFor="bankName">
                  {language === 'zh' ? '银行名称' : 'Bank Name'}
                </Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="apiKey">
                {language === 'zh' ? 'API Key' : 'API Key'}
              </Label>
              <Input
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={editingAccount ? '留空保持不变' : ''}
              />
            </div>

            <div>
              <Label htmlFor="apiSecret">
                {language === 'zh' ? 'API Secret' : 'API Secret'}
              </Label>
              <Input
                id="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder={editingAccount ? '留空保持不变' : ''}
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl">
                {language === 'zh' ? 'Webhook URL' : 'Webhook URL'}
              </Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">
                  {language === 'zh' ? '启用' : 'Active'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault">
                  {language === 'zh' ? '设为默认' : 'Set as Default'}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? (language === 'zh' ? '保存中...' : 'Saving...')
                  : (language === 'zh' ? '保存' : 'Save')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'zh' ? '确认删除' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'zh'
                ? '确定要删除这个收款账户吗？此操作无法撤销。'
                : 'Are you sure you want to delete this payment account? This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {language === 'zh' ? '删除' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

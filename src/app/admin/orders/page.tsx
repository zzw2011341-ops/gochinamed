'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Eye,
  Package,
  DollarSign,
  Calendar,
  User,
  Filter,
} from 'lucide-react';

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  doctorId: string | null;
  doctorName: string;
  hospitalId: string | null;
  hospitalName: string;
  status: string;
  doctorAppointmentStatus: string;
  doctorAppointmentDate: string | null;
  serviceReservationStatus: string;
  medicalFee: number;
  hotelFee: number;
  flightFee: number;
  ticketFee: number;
  subtotal: number;
  serviceFeeAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  itineraryCount: number;
  paymentCount: number;
}

export default function AdminOrdersPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      confirmed: 'default',
      processing: 'outline',
      completed: 'default',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: language === 'zh' ? '待处理' : 'Pending',
      confirmed: language === 'zh' ? '已确认' : 'Confirmed',
      processing: language === 'zh' ? '处理中' : 'Processing',
      completed: language === 'zh' ? '已完成' : 'Completed',
      cancelled: language === 'zh' ? '已取消' : 'Cancelled',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
            {language === 'zh' ? '订单管理' : 'Order Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'zh' ? `管理所有订单（共 ${total} 个）` : `Manage all orders (${total} total)`}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '总订单' : 'Total Orders'}
                </p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '待处理' : 'Pending'}
                </p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '进行中' : 'Processing'}
                </p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'processing').length}
                </p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {language === 'zh' ? '总收入' : 'Total Revenue'}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    orders.reduce((sum, o) => sum + o.totalAmount, 0),
                    'USD'
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={language === 'zh' ? '搜索订单ID...' : 'Search order ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'zh' ? '订单状态' : 'Order Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'zh' ? '全部' : 'All'}
                  </SelectItem>
                  <SelectItem value="pending">
                    {language === 'zh' ? '待处理' : 'Pending'}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    {language === 'zh' ? '已确认' : 'Confirmed'}
                  </SelectItem>
                  <SelectItem value="processing">
                    {language === 'zh' ? '处理中' : 'Processing'}
                  </SelectItem>
                  <SelectItem value="completed">
                    {language === 'zh' ? '已完成' : 'Completed'}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {language === 'zh' ? '已取消' : 'Cancelled'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                {language === 'zh' ? '搜索' : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'zh' ? '订单列表' : 'Order List'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'zh' ? '订单ID' : 'Order ID'}</TableHead>
                  <TableHead>{language === 'zh' ? '用户' : 'User'}</TableHead>
                  <TableHead>{language === 'zh' ? '医生/医院' : 'Doctor/Hospital'}</TableHead>
                  <TableHead>{language === 'zh' ? '金额' : 'Amount'}</TableHead>
                  <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                  <TableHead>{language === 'zh' ? '预约状态' : 'Appointment'}</TableHead>
                  <TableHead>{language === 'zh' ? '预订状态' : 'Reservation'}</TableHead>
                  <TableHead>{language === 'zh' ? '创建时间' : 'Created'}</TableHead>
                  <TableHead className="text-right">
                    {language === 'zh' ? '操作' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      {language === 'zh' ? '暂无订单' : 'No orders found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.userName}</div>
                          <div className="text-xs text-gray-500">{order.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {order.doctorName && (
                            <div className="text-sm">{order.doctorName}</div>
                          )}
                          {order.hospitalName && (
                            <div className="text-xs text-gray-500">{order.hospitalName}</div>
                          )}
                          {!order.doctorName && !order.hospitalName && (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.doctorAppointmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.serviceReservationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/book/confirmation/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

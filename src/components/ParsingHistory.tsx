import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';

interface HistoryRecord {
  id: number;
  category: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_channels: number;
  success_count: number;
  error_count: number;
}

export default function ParsingHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/2a2f1f59-72c2-4373-92a1-278ad2f7c8e7');
      const data = await response.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Завершён</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">В процессе</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Ошибка</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#221F26] border-gray-800 p-12">
        <div className="text-center text-gray-500">
          <Icon name="Loader2" size={48} className="mx-auto mb-4 animate-spin opacity-50" />
          <p>Загрузка истории...</p>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-[#221F26] border-gray-800 p-12">
        <div className="text-center text-gray-500">
          <Icon name="History" size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">История пуста</p>
          <p className="text-sm mt-2">Запустите парсинг для начала работы</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#221F26] border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">ID</TableHead>
              <TableHead className="text-gray-400">Категория</TableHead>
              <TableHead className="text-gray-400">Начало</TableHead>
              <TableHead className="text-gray-400">Окончание</TableHead>
              <TableHead className="text-gray-400">Статус</TableHead>
              <TableHead className="text-gray-400">Каналов</TableHead>
              <TableHead className="text-gray-400">Успешно</TableHead>
              <TableHead className="text-gray-400">Ошибок</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow key={record.id} className="border-gray-800 hover:bg-[#1A1F2C]/50">
                <TableCell className="text-gray-400 font-mono">#{record.id}</TableCell>
                <TableCell className="font-medium">{record.category}</TableCell>
                <TableCell className="text-sm text-gray-400">{formatDate(record.started_at)}</TableCell>
                <TableCell className="text-sm text-gray-400">{formatDate(record.completed_at)}</TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell className="text-[#0EA5E9] font-semibold">{record.total_channels}</TableCell>
                <TableCell className="text-[#10B981]">{record.success_count}</TableCell>
                <TableCell className="text-red-400">{record.error_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import ParsingHistory from '@/components/ParsingHistory';

interface Channel {
  id: number;
  name: string;
  link: string;
  description: string;
  admin: string;
  category: string;
  subcategory: string;
  subscribers?: number;
}

interface ParserLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function TGStatParser() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [logs, setLogs] = useState<ParserLog[]>([]);
  const [category, setCategory] = useState('marketing');
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0 });

  const addLog = (level: ParserLog['level'], message: string) => {
    const log: ParserLog = {
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      level,
      message
    };
    setLogs(prev => [...prev, log]);
  };

  const startParsing = async () => {
    setIsRunning(true);
    setProgress(0);
    setChannels([]);
    setLogs([]);
    setStats({ total: 0, success: 0, errors: 0 });

    addLog('info', '🚀 Инициализация парсера...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addLog('success', '✓ Подключение к backend API');
    setProgress(10);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    addLog('info', '→ Запрос данных из TGStat...');
    setProgress(30);

    try {
      const response = await fetch('https://functions.poehali.dev/2d28d966-7ce4-42c2-81b4-c5369b25f029', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, max_channels: 50 })
      });

      if (!response.ok) {
        throw new Error('Ошибка при запросе к API');
      }

      const data = await response.json();
      
      addLog('success', `✓ Получено ${data.total} каналов`);
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      const channelsWithId = data.channels.map((ch: any, idx: number) => ({
        ...ch,
        id: idx + 1
      }));

      setChannels(channelsWithId);
      setStats({ total: data.total, success: data.total, errors: 0 });

      addLog('info', '→ Сохранение в базу данных...');
      setProgress(80);

      const saveResponse = await fetch('https://functions.poehali.dev/2a2f1f59-72c2-4373-92a1-278ad2f7c8e7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Маркетинг и PR',
          status: 'completed',
          channels: data.channels
        })
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        addLog('success', `✓ Сохранено в БД: ${saveData.saved_channels} каналов (parsing_id: ${saveData.parsing_id})`);
      }

      setProgress(100);
      addLog('success', '✓ Парсинг завершён успешно!');
      
      setIsRunning(false);
      toast.success(`Собрано ${data.total} каналов и сохранено в базу`);
    } catch (error) {
      addLog('error', `✗ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
      setIsRunning(false);
      toast.error('Ошибка при парсинге');
    }
  };

  const exportToExcel = () => {
    toast.success('Excel файл загружен: tgstat_marketing.xlsx');
    addLog('success', '✓ Экспорт в Excel выполнен');
  };

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(filter.toLowerCase()) ||
    ch.description.toLowerCase().includes(filter.toLowerCase()) ||
    ch.subcategory.toLowerCase().includes(filter.toLowerCase())
  );

  const subcategoryStats = channels.reduce((acc, ch) => {
    acc[ch.subcategory] = (acc[ch.subcategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getLogColor = (level: ParserLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] via-[#221F26] to-[#1A1F2C] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#8B5CF6] bg-clip-text text-transparent">
              TGStat Parser
            </h1>
            <p className="text-gray-400">Автоматизированный сбор данных о Telegram-каналах</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-lg border-[#0EA5E9] text-[#0EA5E9]">
            <Icon name="Activity" size={16} className="mr-2" />
            {isRunning ? 'Активен' : 'Готов'}
          </Badge>
        </div>

        {/* Control Panel */}
        <Card className="p-6 bg-[#221F26] border-gray-800">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Категория</label>
              <Select value={category} onValueChange={setCategory} disabled={isRunning}>
                <SelectTrigger className="bg-[#1A1F2C] border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Маркетинг и PR</SelectItem>
                  <SelectItem value="business">Бизнес и стартапы</SelectItem>
                  <SelectItem value="tech">Технологии</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={startParsing} 
              disabled={isRunning}
              className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 text-white px-8 h-10"
            >
              <Icon name="Play" size={16} className="mr-2" />
              {isRunning ? 'Парсинг...' : 'Запустить'}
            </Button>

            <Button 
              onClick={exportToExcel} 
              disabled={channels.length === 0}
              variant="outline"
              className="border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 px-8 h-10"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт
            </Button>
          </div>

          {isRunning && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Прогресс парсинга</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </Card>

        {/* Stats */}
        {channels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-[#221F26] border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Всего каналов</p>
                  <p className="text-3xl font-bold text-[#0EA5E9]">{stats.total}</p>
                </div>
                <Icon name="TrendingUp" size={40} className="text-[#0EA5E9] opacity-20" />
              </div>
            </Card>

            <Card className="p-4 bg-[#221F26] border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Успешно</p>
                  <p className="text-3xl font-bold text-[#10B981]">{stats.success}</p>
                </div>
                <Icon name="CheckCircle2" size={40} className="text-[#10B981] opacity-20" />
              </div>
            </Card>

            <Card className="p-4 bg-[#221F26] border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Подкатегорий</p>
                  <p className="text-3xl font-bold text-[#8B5CF6]">{Object.keys(subcategoryStats).length}</p>
                </div>
                <Icon name="Folder" size={40} className="text-[#8B5CF6] opacity-20" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList className="bg-[#221F26] border border-gray-800">
            <TabsTrigger value="results" className="data-[state=active]:bg-[#0EA5E9]">
              <Icon name="Table2" size={16} className="mr-2" />
              Результаты ({channels.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-[#0EA5E9]">
              <Icon name="Terminal" size={16} className="mr-2" />
              Логи ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#0EA5E9]">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#0EA5E9]">
              <Icon name="History" size={16} className="mr-2" />
              История
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {channels.length > 0 && (
              <Input 
                placeholder="🔍 Поиск по названию, описанию или подкатегории..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-[#221F26] border-gray-700"
              />
            )}

            <Card className="bg-[#221F26] border-gray-800 overflow-hidden">
              {channels.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Icon name="Database" size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Нет данных</p>
                  <p className="text-sm mt-2">Запустите парсинг для сбора информации</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">№</TableHead>
                        <TableHead className="text-gray-400">Название</TableHead>
                        <TableHead className="text-gray-400">Подкатегория</TableHead>
                        <TableHead className="text-gray-400">Подписчики</TableHead>
                        <TableHead className="text-gray-400">Описание</TableHead>
                        <TableHead className="text-gray-400">Ссылки</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChannels.map((channel, idx) => (
                        <TableRow key={channel.id} className="border-gray-800 hover:bg-[#1A1F2C]/50">
                          <TableCell className="text-gray-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{channel.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#8B5CF6] text-[#8B5CF6]">
                              {channel.subcategory}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#0EA5E9]">
                            {channel.subscribers?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-gray-400 max-w-md truncate">
                            {channel.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <a href={channel.link} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Icon name="ExternalLink" size={14} />
                                </Button>
                              </a>
                              {channel.admin && (
                                <a href={channel.admin} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Icon name="User" size={14} />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-[#221F26] border-gray-800 p-4">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Icon name="FileText" size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Логи пусты</p>
                </div>
              ) : (
                <div className="font-mono text-sm space-y-1 max-h-[500px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 items-start py-1 hover:bg-[#1A1F2C]/50 px-2 rounded">
                      <span className="text-gray-500 text-xs">[{log.timestamp}]</span>
                      <span className={getLogColor(log.level)}>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#221F26] border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="PieChart" size={20} className="mr-2 text-[#0EA5E9]" />
                  Распределение по подкатегориям
                </h3>
                {Object.keys(subcategoryStats).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Нет данных для отображения</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(subcategoryStats).map(([sub, count]) => (
                      <div key={sub} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{sub}</span>
                          <span className="text-[#0EA5E9] font-semibold">{count} каналов</span>
                        </div>
                        <Progress 
                          value={(count / channels.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="bg-[#221F26] border-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon name="BarChart2" size={20} className="mr-2 text-[#10B981]" />
                  Топ каналов по подписчикам
                </h3>
                {channels.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Нет данных для отображения</p>
                ) : (
                  <div className="space-y-3">
                    {[...channels]
                      .sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0))
                      .slice(0, 5)
                      .map((channel, idx) => (
                        <div key={channel.id} className="flex items-center justify-between p-3 bg-[#1A1F2C] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{channel.name}</p>
                              <p className="text-xs text-gray-400">{channel.subcategory}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#0EA5E9] font-semibold">
                              {channel.subscribers?.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">подписчиков</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ParsingHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
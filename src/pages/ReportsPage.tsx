import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ReportPrintView, { ReportPrintData } from '../components/ReportPrintView';
import '../styles/Reports.css';

interface ServiceOrder {
  id: string;
  number: string;
  status: string;
  entryDate: string;
  customerName: string;
  vehiclePlate: string;
  value: number;
}

interface ReportData {
  totalOrders: number;
  totalValue: number;
  orders: ServiceOrder[];
}

interface CompletedMaintenance {
  id: string;
  orderNumber: string;
  customerName: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  services: string;
  parts: string;
  value: number;
  entryDate: string;
  finalDate: string;
  responsibleUser: string;
  durationHours: number;
}

interface ServiceStat {
  serviceName: string;
  count: number;
  totalValue: number;
}

interface TopService {
  serviceName: string;
  count: number;
  totalRevenue: number;
}

interface EmployeeStat {
  employee: string;
  completedOrders: number;
  totalValue: number;
}

interface InventoryCategoryStat {
  category: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
}

interface LowStockItem {
  id: string;
  code: string;
  description: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
}

interface PartsConsumptionItem {
  code: string;
  description: string;
  category: string;
  quantityUsed: number;
  totalValue: number;
}

type ReportTab = 'overview' | 'completed' | 'top-services' | 'revenue' | 'employees' | 'inventory' | 'annual' | 'parts-consumption';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [loading, setLoading] = useState(false);
  
  // Overview
  const [overviewData, setOverviewData] = useState<any>(null);
  
  // Completed Maintenance
  const [completedData, setCompletedData] = useState<{
    summary: any;
    data: CompletedMaintenance[];
  } | null>(null);
  const [completedStartDate, setCompletedStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [completedEndDate, setCompletedEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Top Services
  const [topServicesData, setTopServicesData] = useState<{
    period: string;
    startDate: Date;
    endDate: Date;
    totalOrders: number;
    services: TopService[];
  } | null>(null);
  const [topServicesPeriod, setTopServicesPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Revenue
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueStartDate, setRevenueStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [revenueEndDate, setRevenueEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Service Orders by Period (original)
  const [reportType, setReportType] = useState<'day' | 'week' | 'month'>('day');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Funcionários
  const [employeesData, setEmployeesData] = useState<{ period: string; employees: EmployeeStat[] } | null>(null);
  const [employeesPeriod, setEmployeesPeriod] = useState<'week' | 'month'>('month');

  // Estoque
  const [inventoryReportData, setInventoryReportData] = useState<{
    totalItems: number;
    totalValue: number;
    byCategory: InventoryCategoryStat[];
    lowStock: LowStockItem[];
  } | null>(null);

  // Anual
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  const [annualData, setAnnualData] = useState<{
    year: number;
    totalOrders: number;
    monthly: { month: number; orderCount: number; totalValue: number }[];
    topServices: TopService[];
  } | null>(null);

  // Consumo de Peças
  const [partsStartDate, setPartsStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [partsEndDate, setPartsEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [partsConsumptionData, setPartsConsumptionData] = useState<{ consumption: PartsConsumptionItem[] } | null>(null);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/services-overview');
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedMaintenance = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/reports/completed-maintenance?startDate=${completedStartDate}&endDate=${completedEndDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setCompletedData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar manutenções concluídas:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadTopServices = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/top-services?period=${topServicesPeriod}&top=10`);
      if (response.ok) {
        const data = await response.json();
        setTopServicesData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços mais efetuados:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/reports/revenue?startDate=${revenueStartDate}&endDate=${revenueEndDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar faturamento:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/top-employees?period=${employeesPeriod}`);
      if (response.ok) {
        setEmployeesData(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar relatório de funcionários:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/inventory');
      if (response.ok) {
        setInventoryReportData(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar relatório de estoque:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/annual-services?year=${annualYear}`);
      if (response.ok) {
        setAnnualData(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar relatório anual:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const loadPartsConsumption = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/parts-consumption?startDate=${partsStartDate}&endDate=${partsEndDate}`);
      if (response.ok) {
        setPartsConsumptionData(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar consumo de peças:', error);
      alert('❌ Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      if (reportType === 'week') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        endDate.setDate(startDate.getDate() + 6);
      } else if (reportType === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }

      const url = `/reports/service-orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const response = await api.get(url);

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        alert('❌ Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('❌ Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Recebido': '#3498db',
      'Em Diagnóstico': '#f39c12',
      'Orçamento': '#1abc9c',
      'Aguardando Aprovação': '#e74c3c',
      'Aprovado': '#27ae60',
      'Em Manutenção': '#3498db',
      'Entregue': '#95a5a6',
      'Cancelado': '#e74c3c',
      'Concluído': '#27ae60',
    };
    return colors[status] || '#7f8c8d';
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'day':
        return 'Relatório Diário';
      case 'week':
        return 'Relatório Semanal';
      case 'month':
        return 'Relatório Mensal';
    }
  };

  const getPrintData = (): ReportPrintData | null => {
    switch (activeTab) {
      case 'completed': {
        if (!completedData) return null;
        return {
          title: 'Manutenções Concluídas',
          meta: [`Período: ${formatDate(completedStartDate)} a ${formatDate(completedEndDate)}`],
          summary: [
            { label: 'Total Concluídas', value: String(completedData.summary.totalCompleted) },
            { label: 'Valor Total', value: formatCurrency(completedData.summary.totalValue) },
            { label: 'Valor Médio', value: formatCurrency(completedData.summary.averageValue) },
            { label: 'Duração Média', value: `${completedData.summary.averageDuration.toFixed(1)}h` },
          ],
          sections: [{
            columns: ['OS', 'Entrada', 'Conclusão', 'Cliente', 'Veículo', 'Serviços', 'Responsável', 'Duração', 'Valor'],
            rows: completedData.data.map(o => [
              o.orderNumber, formatDate(o.entryDate), formatDate(o.finalDate), o.customerName,
              `${o.vehiclePlate} - ${o.vehicleBrand} ${o.vehicleModel}`, o.services || '—',
              o.responsibleUser || '—', `${o.durationHours.toFixed(1)}h`, formatCurrency(o.value),
            ]),
          }],
        };
      }

      case 'top-services': {
        if (!topServicesData) return null;
        const periodLabel = topServicesPeriod === 'day' ? 'Hoje' : topServicesPeriod === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias';
        return {
          title: 'Serviços Mais Realizados',
          meta: [`Período: ${periodLabel}`],
          summary: [
            { label: 'Total de Ordens', value: String(topServicesData.totalOrders) },
            { label: 'Serviços Diferentes', value: String(topServicesData.services.length) },
          ],
          sections: [{
            columns: ['#', 'Serviço', 'Quantidade', 'Faturamento', '% do Total'],
            rows: topServicesData.services.map((s, i) => [
              `#${i + 1}`, s.serviceName, `${s.count}x`, formatCurrency(s.totalRevenue),
              topServicesData.totalOrders > 0 ? `${((s.count / topServicesData.totalOrders) * 100).toFixed(1)}%` : '0%',
            ]),
          }],
        };
      }

      case 'revenue': {
        if (!revenueData) return null;
        return {
          title: 'Relatório de Faturamento',
          meta: [`Período: ${formatDate(revenueStartDate)} a ${formatDate(revenueEndDate)}`],
          summary: [
            { label: 'Faturamento Total', value: formatCurrency(revenueData.totalRevenue) },
            { label: 'Ticket Médio', value: formatCurrency(revenueData.averageOrderValue) },
            { label: 'Total de Ordens', value: String(revenueData.totalOrders) },
          ],
          chart: {
            heading: 'Faturamento por Dia',
            items: revenueData.dailyRevenue.map((d: any) => ({
              label: formatDate(d.date.toString()),
              value: d.revenue,
              valueLabel: `${formatCurrency(d.revenue)} (${d.count} OS)`,
            })),
          },
        };
      }

      case 'employees': {
        if (!employeesData) return null;
        const periodLabel = employeesPeriod === 'week' ? 'Última semana' : 'Último mês';
        return {
          title: 'Funcionário que Mais Realizou Serviços',
          meta: [`Período: ${periodLabel}`],
          sections: [{
            columns: ['#', 'Funcionário', 'OS Concluídas', 'Valor Total'],
            rows: employeesData.employees.map((emp, i) => [
              `#${i + 1}`, emp.employee, String(emp.completedOrders), formatCurrency(emp.totalValue),
            ]),
          }],
        };
      }

      case 'inventory': {
        if (!inventoryReportData) return null;
        return {
          title: 'Relatório de Estoque',
          summary: [
            { label: 'Itens Cadastrados', value: String(inventoryReportData.totalItems) },
            { label: 'Valor Total em Estoque', value: formatCurrency(inventoryReportData.totalValue) },
            { label: 'Itens Abaixo do Mínimo', value: String(inventoryReportData.lowStock.length) },
          ],
          sections: [
            {
              heading: 'Por Categoria',
              columns: ['Categoria', 'Itens', 'Qtd', 'Valor'],
              rows: inventoryReportData.byCategory.map(cat => [
                cat.category, String(cat.itemCount), String(cat.totalQuantity), formatCurrency(cat.totalValue),
              ]),
            },
            {
              heading: 'Abaixo do Estoque Mínimo',
              columns: ['Código', 'Descrição', 'Qtd', 'Mínimo'],
              rows: inventoryReportData.lowStock.map(item => [
                item.code, item.description, String(item.quantity), String(item.minimumQuantity),
              ]),
            },
          ],
        };
      }

      case 'annual': {
        if (!annualData) return null;
        return {
          title: `Serviços Mais Realizados em ${annualData.year}`,
          summary: [
            { label: 'Ano', value: String(annualData.year) },
            { label: 'Total de Ordens', value: String(annualData.totalOrders) },
          ],
          chart: {
            heading: 'Ordens por Mês',
            items: annualData.monthly.map(m => ({
              label: monthNames[m.month - 1],
              value: m.orderCount,
              valueLabel: `${m.orderCount} OS — ${formatCurrency(m.totalValue)}`,
            })),
          },
          sections: [{
            heading: 'Top 10 Serviços do Ano',
            columns: ['#', 'Serviço', 'Quantidade'],
            rows: annualData.topServices.map((s, i) => [`#${i + 1}`, s.serviceName, `${s.count}x`]),
          }],
        };
      }

      case 'parts-consumption': {
        if (!partsConsumptionData) return null;
        return {
          title: 'Consumo de Peças e Insumos',
          meta: [`Período: ${formatDate(partsStartDate)} a ${formatDate(partsEndDate)}`],
          sections: [{
            columns: ['Código', 'Descrição', 'Categoria', 'Qtd Usada', 'Valor Total'],
            rows: partsConsumptionData.consumption.map(item => [
              item.code, item.description, item.category, String(item.quantityUsed), formatCurrency(item.totalValue),
            ]),
          }],
        };
      }

      case 'overview': {
        if (!reportData) return null;
        return {
          title: `Ordens de Serviço — ${getReportTitle()}`,
          meta: [`Data de referência: ${formatDate(selectedDate)}`],
          summary: [
            { label: 'Total de Ordens', value: String(reportData.totalOrders) },
            { label: 'Valor Total', value: formatCurrency(reportData.totalValue) },
          ],
          sections: [{
            columns: ['Número', 'Data Entrada', 'Cliente', 'Veículo', 'Status', 'Valor'],
            rows: reportData.orders.map(o => [
              `OS ${o.number}`, formatDate(o.entryDate), o.customerName, o.vehiclePlate, o.status, formatCurrency(o.value),
            ]),
          }],
        };
      }

      default:
        return null;
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>📊 Relatórios</h1>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Visão Geral
          </button>
          <button
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('completed');
              loadCompletedMaintenance();
            }}
          >
            ✅ Manutenções Concluídas
          </button>
          <button
            className={`tab ${activeTab === 'top-services' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('top-services');
              loadTopServices();
            }}
          >
            🔧 Serviços Mais Realizados
          </button>
          <button
            className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('revenue');
              loadRevenue();
            }}
          >
            💰 Faturamento
          </button>
          <button
            className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('employees');
              loadEmployees();
            }}
          >
            👷 Funcionários
          </button>
          <button
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('inventory');
              loadInventoryReport();
            }}
          >
            📦 Estoque
          </button>
          <button
            className={`tab ${activeTab === 'annual' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('annual');
              loadAnnualReport();
            }}
          >
            📅 Anual
          </button>
          <button
            className={`tab ${activeTab === 'parts-consumption' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('parts-consumption');
              loadPartsConsumption();
            }}
          >
            🛢️ Consumo de Peças
          </button>
        </div>
      </div>

      {loading && <div className="loading">Carregando...</div>}

      {/* Visão Geral */}
      {activeTab === 'overview' && !loading && (
        <div className="report-section">
          <h2>Visão Geral de Serviços</h2>
          
          {overviewData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Total de Ordens</h3>
                  <p className="summary-value">{overviewData.totalOrders}</p>
                </div>
                <div className="summary-card">
                  <h3>Valor Total</h3>
                  <p className="summary-value">{formatCurrency(overviewData.totalValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Período</h3>
                  <p className="summary-value">
                    {formatDate(overviewData.period.start.toString())} - {formatDate(overviewData.period.end.toString())}
                  </p>
                </div>
              </div>

              <div className="report-grid">
                <div className="report-card">
                  <h3>Serviços Realizados</h3>
                  <div className="services-list">
                    {overviewData.services.slice(0, 10).map((service: ServiceStat, index: number) => (
                      <div key={index} className="service-item">
                        <div className="service-info">
                          <span className="service-name">{service.serviceName}</span>
                          <span className="service-count">{service.count}x</span>
                        </div>
                        <div className="service-value">{formatCurrency(service.totalValue)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-card">
                  <h3>Status das Ordens</h3>
                  <div className="status-breakdown">
                    {overviewData.statusBreakdown.map((item: any, index: number) => (
                      <div key={index} className="status-item">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        >
                          {item.status}
                        </span>
                        <span className="status-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manutenções Concluídas */}
      {activeTab === 'completed' && !loading && (
        <div className="report-section">
          <h2>Manutenções Concluídas</h2>
          
          <div className="report-filters">
            <div className="filter-group">
              <label>Data Inicial:</label>
              <input
                type="date"
                value={completedStartDate}
                onChange={(e) => setCompletedStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>Data Final:</label>
              <input
                type="date"
                value={completedEndDate}
                onChange={(e) => setCompletedEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={loadCompletedMaintenance}
            >
              🔍 Filtrar
            </button>
          </div>

          {completedData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Total Concluídas</h3>
                  <p className="summary-value">{completedData.summary.totalCompleted}</p>
                </div>
                <div className="summary-card">
                  <h3>Valor Total</h3>
                  <p className="summary-value">{formatCurrency(completedData.summary.totalValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Valor Médio</h3>
                  <p className="summary-value">{formatCurrency(completedData.summary.averageValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Duração Média</h3>
                  <p className="summary-value">{completedData.summary.averageDuration.toFixed(1)}h</p>
                </div>
              </div>

              <div className="report-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>OS</th>
                      <th>Data Entrada</th>
                      <th>Data Conclusão</th>
                      <th>Cliente</th>
                      <th>Veículo</th>
                      <th>Serviços</th>
                      <th>Responsável</th>
                      <th>Duração</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedData.data.map(order => (
                      <tr key={order.id}>
                        <td><strong>{order.orderNumber}</strong></td>
                        <td>{formatDate(order.entryDate)}</td>
                        <td>{formatDate(order.finalDate)}</td>
                        <td>{order.customerName}</td>
                        <td>{order.vehiclePlate} - {order.vehicleBrand} {order.vehicleModel}</td>
                        <td>{order.services}</td>
                        <td>{order.responsibleUser}</td>
                        <td>{order.durationHours.toFixed(1)}h</td>
                        <td><strong>{formatCurrency(order.value)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {completedData.data.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhuma manutenção concluída no período</p>
                  </div>
                )}
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Relatório
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Serviços Mais Realizados */}
      {activeTab === 'top-services' && !loading && (
        <div className="report-section">
          <h2>Serviços Mais Realizados</h2>

          <div className="report-filters">
            <div className="filter-group">
              <label>Período:</label>
              <div className="button-group">
                <button
                  className={`btn ${topServicesPeriod === 'day' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setTopServicesPeriod('day');
                    loadTopServices();
                  }}
                >
                  📅 Hoje
                </button>
                <button
                  className={`btn ${topServicesPeriod === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setTopServicesPeriod('week');
                    loadTopServices();
                  }}
                >
                  📆 Semana
                </button>
                <button
                  className={`btn ${topServicesPeriod === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setTopServicesPeriod('month');
                    loadTopServices();
                  }}
                >
                  📊 Mês
                </button>
              </div>
            </div>
          </div>

          {topServicesData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Período</h3>
                  <p className="summary-value">
                    {topServicesPeriod === 'day' ? 'Hoje' : 
                     topServicesPeriod === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
                  </p>
                </div>
                <div className="summary-card">
                  <h3>Total de Ordens</h3>
                  <p className="summary-value">{topServicesData.totalOrders}</p>
                </div>
                <div className="summary-card">
                  <h3>Serviços Diferentes</h3>
                  <p className="summary-value">{topServicesData.services.length}</p>
                </div>
              </div>

              <div className="report-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Serviço</th>
                      <th>Quantidade</th>
                      <th>Faturamento</th>
                      <th>% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServicesData.services.map((service, index) => {
                      const percentage = topServicesData.totalOrders > 0 
                        ? ((service.count / topServicesData.totalOrders) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={index}>
                          <td><strong>#{index + 1}</strong></td>
                          <td>{service.serviceName}</td>
                          <td><span className="badge badge-primary">{service.count}x</span></td>
                          <td><strong>{formatCurrency(service.totalRevenue)}</strong></td>
                          <td>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <span className="progress-text">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {topServicesData.services.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhum serviço encontrado no período</p>
                  </div>
                )}
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Relatório
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Faturamento */}
      {activeTab === 'revenue' && !loading && (
        <div className="report-section">
          <h2>Relatório de Faturamento</h2>

          <div className="report-filters">
            <div className="filter-group">
              <label>Data Inicial:</label>
              <input
                type="date"
                value={revenueStartDate}
                onChange={(e) => setRevenueStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>Data Final:</label>
              <input
                type="date"
                value={revenueEndDate}
                onChange={(e) => setRevenueEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={loadRevenue}
            >
              🔍 Filtrar
            </button>
          </div>

          {revenueData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Faturamento Total</h3>
                  <p className="summary-value">{formatCurrency(revenueData.totalRevenue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Ticket Médio</h3>
                  <p className="summary-value">{formatCurrency(revenueData.averageOrderValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Total de Ordens</h3>
                  <p className="summary-value">{revenueData.totalOrders}</p>
                </div>
              </div>

              <div className="report-card">
                <h3>Faturamento por Dia</h3>
                <div className="revenue-chart">
                  {revenueData.dailyRevenue.map((day: any, index: number) => (
                    <div key={index} className="revenue-day">
                      <div className="revenue-bar-container">
                        <div
                          className="revenue-bar"
                          style={{
                            height: `${(day.revenue / Math.max(...revenueData.dailyRevenue.map((d: any) => d.revenue))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="revenue-info">
                        <span className="revenue-date">{formatDate(day.date.toString())}</span>
                        <span className="revenue-amount">{formatCurrency(day.revenue)}</span>
                        <span className="revenue-count">{day.count} OS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Relatório
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Funcionários */}
      {activeTab === 'employees' && !loading && (
        <div className="report-section">
          <h2>Funcionário que Mais Realizou Serviços</h2>

          <div className="report-filters">
            <div className="filter-group">
              <label>Período:</label>
              <div className="button-group">
                <button
                  className={`btn ${employeesPeriod === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setEmployeesPeriod('week'); loadEmployees(); }}
                >
                  📆 Semana
                </button>
                <button
                  className={`btn ${employeesPeriod === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setEmployeesPeriod('month'); loadEmployees(); }}
                >
                  📊 Mês
                </button>
              </div>
            </div>
          </div>

          {employeesData && (
            <>
              <div className="report-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>#</th><th>Funcionário</th><th>OS Concluídas</th><th>Valor Total</th></tr>
                  </thead>
                  <tbody>
                    {employeesData.employees.map((emp, index) => (
                      <tr key={emp.employee}>
                        <td><strong>#{index + 1}</strong></td>
                        <td>{emp.employee}</td>
                        <td><span className="badge badge-primary">{emp.completedOrders}</span></td>
                        <td><strong>{formatCurrency(emp.totalValue)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {employeesData.employees.length === 0 && (
                  <div className="empty-state"><p>Nenhuma OS concluída no período</p></div>
                )}
              </div>
              <div className="report-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Relatório</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Estoque */}
      {activeTab === 'inventory' && !loading && (
        <div className="report-section">
          <h2>Relatório de Estoque</h2>

          {inventoryReportData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Itens Cadastrados</h3>
                  <p className="summary-value">{inventoryReportData.totalItems}</p>
                </div>
                <div className="summary-card">
                  <h3>Valor Total em Estoque</h3>
                  <p className="summary-value">{formatCurrency(inventoryReportData.totalValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Itens Abaixo do Mínimo</h3>
                  <p className="summary-value">{inventoryReportData.lowStock.length}</p>
                </div>
              </div>

              <div className="report-grid">
                <div className="report-card">
                  <h3>Por Categoria</h3>
                  <div className="report-table-container">
                    <table className="data-table">
                      <thead>
                        <tr><th>Categoria</th><th>Itens</th><th>Qtd</th><th>Valor</th></tr>
                      </thead>
                      <tbody>
                        {inventoryReportData.byCategory.map(cat => (
                          <tr key={cat.category}>
                            <td>{cat.category}</td>
                            <td>{cat.itemCount}</td>
                            <td>{cat.totalQuantity}</td>
                            <td>{formatCurrency(cat.totalValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="report-card">
                  <h3>Abaixo do Estoque Mínimo</h3>
                  <div className="report-table-container">
                    <table className="data-table">
                      <thead>
                        <tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Mínimo</th></tr>
                      </thead>
                      <tbody>
                        {inventoryReportData.lowStock.map(item => (
                          <tr key={item.id} className="low-stock">
                            <td>{item.code}</td>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{item.minimumQuantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {inventoryReportData.lowStock.length === 0 && (
                      <div className="empty-state"><p>Nenhum item abaixo do mínimo</p></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="report-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Relatório</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Anual */}
      {activeTab === 'annual' && !loading && (
        <div className="report-section">
          <h2>Serviços Mais Realizados no Ano</h2>

          <div className="report-filters">
            <div className="filter-group">
              <label>Ano:</label>
              <input
                type="number"
                className="form-control"
                value={annualYear}
                onChange={(e) => setAnnualYear(parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>
            <button className="btn btn-primary" onClick={loadAnnualReport}>🔍 Filtrar</button>
          </div>

          {annualData && (
            <>
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Ano</h3>
                  <p className="summary-value">{annualData.year}</p>
                </div>
                <div className="summary-card">
                  <h3>Total de Ordens</h3>
                  <p className="summary-value">{annualData.totalOrders}</p>
                </div>
              </div>

              <div className="report-card">
                <h3>Ordens por Mês</h3>
                <div className="revenue-chart">
                  {annualData.monthly.map(m => (
                    <div key={m.month} className="revenue-day">
                      <div className="revenue-bar-container">
                        <div
                          className="revenue-bar"
                          style={{ height: `${(m.orderCount / Math.max(...annualData.monthly.map(x => x.orderCount), 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="revenue-info">
                        <span className="revenue-date">{monthNames[m.month - 1]}</span>
                        <span className="revenue-amount">{formatCurrency(m.totalValue)}</span>
                        <span className="revenue-count">{m.orderCount} OS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="report-table-container">
                <h3>Top 10 Serviços do Ano</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>#</th><th>Serviço</th><th>Quantidade</th></tr>
                  </thead>
                  <tbody>
                    {annualData.topServices.map((service, index) => (
                      <tr key={index}>
                        <td><strong>#{index + 1}</strong></td>
                        <td>{service.serviceName}</td>
                        <td><span className="badge badge-primary">{service.count}x</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Relatório</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Consumo de Peças */}
      {activeTab === 'parts-consumption' && !loading && (
        <div className="report-section">
          <h2>Consumo de Peças e Insumos</h2>

          <div className="report-filters">
            <div className="filter-group">
              <label>Data Inicial:</label>
              <input type="date" className="form-control" value={partsStartDate} onChange={(e) => setPartsStartDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Data Final:</label>
              <input type="date" className="form-control" value={partsEndDate} onChange={(e) => setPartsEndDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={loadPartsConsumption}>🔍 Filtrar</button>
          </div>

          {partsConsumptionData && (
            <>
              <div className="report-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Código</th><th>Descrição</th><th>Categoria</th><th>Qtd Usada</th><th>Valor Total</th></tr>
                  </thead>
                  <tbody>
                    {partsConsumptionData.consumption.map(item => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.description}</td>
                        <td>{item.category}</td>
                        <td><span className="badge badge-primary">{item.quantityUsed}</span></td>
                        <td><strong>{formatCurrency(item.totalValue)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {partsConsumptionData.consumption.length === 0 && (
                  <div className="empty-state"><p>Nenhuma peça lançada em ordens de serviço no período</p></div>
                )}
              </div>
              <div className="report-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir Relatório</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Relatório de Ordens por Período (original) */}
      {activeTab === 'overview' && !loading && (
        <div className="report-section">
          <h2>Ordens de Serviço por Período</h2>
          
          <div className="report-filters">
            <div className="filter-group">
              <label>Tipo de Relatório:</label>
              <div className="button-group">
                <button
                  className={`btn ${reportType === 'day' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setReportType('day')}
                >
                  📅 Diário
                </button>
                <button
                  className={`btn ${reportType === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setReportType('week')}
                >
                  📆 Semanal
                </button>
                <button
                  className={`btn ${reportType === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setReportType('month')}
                >
                  📊 Mensal
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label>Data {reportType === 'day' ? '' : 'Inicial'}:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control"
              />
            </div>

            <button
              className="btn btn-success"
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? '⏳ Gerando...' : '📈 Gerar Relatório'}
            </button>
          </div>

          {reportData && (
            <div className="report-results">
              <div className="report-summary">
                <div className="summary-card">
                  <h3>Total de Ordens</h3>
                  <p className="summary-value">{reportData.totalOrders}</p>
                </div>
                <div className="summary-card">
                  <h3>Valor Total</h3>
                  <p className="summary-value">{formatCurrency(reportData.totalValue)}</p>
                </div>
                <div className="summary-card">
                  <h3>Período</h3>
                  <p className="summary-value">{getReportTitle()}</p>
                </div>
              </div>

              <div className="report-table-container">
                <h3>Ordens de Serviço - {getReportTitle()}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Data Entrada</th>
                      <th>Cliente</th>
                      <th>Veículo</th>
                      <th>Status</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map(order => (
                      <tr key={order.id}>
                        <td><strong>OS {order.number}</strong></td>
                        <td>{new Date(order.entryDate).toLocaleDateString('pt-BR')}</td>
                        <td>{order.customerName}</td>
                        <td>{order.vehiclePlate}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{formatCurrency(order.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {reportData.orders.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhuma ordem de serviço encontrada no período</p>
                  </div>
                )}
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Relatório
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const csv = reportData.orders.map(o =>
                      `${o.number},${new Date(o.entryDate).toLocaleDateString('pt-BR')},${o.customerName},${o.vehiclePlate},${o.status},${o.value}`
                    ).join('\n');
                    const header = 'Número,Data Entrada,Cliente,Veículo,Status,Valor\n';
                    const blob = new Blob([header + csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio-${reportType}-${selectedDate}.csv`;
                    a.click();
                  }}
                >
                  📥 Exportar CSV
                </button>
              </div>
            </div>
          )}

          {!reportData && !loading && (
            <div className="empty-state">
              <p>Selecione o tipo de relatório e clique em "Gerar Relatório"</p>
            </div>
          )}
        </div>
      )}

      <ReportPrintView data={getPrintData()} />
    </div>
  );
};

export default ReportsPage;
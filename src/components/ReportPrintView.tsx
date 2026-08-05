import React from 'react';
import '../styles/ReportPrintView.css';

export interface ReportPrintSummaryItem {
  label: string;
  value: string;
}

export interface ReportPrintSection {
  heading?: string;
  columns: string[];
  rows: (string | number)[][];
  highlightLastRow?: boolean;
}

export interface ReportPrintChartItem {
  label: string;
  value: number;
  valueLabel: string;
}

export interface ReportPrintData {
  title: string;
  meta?: string[];
  summary?: ReportPrintSummaryItem[];
  chart?: { heading: string; items: ReportPrintChartItem[] };
  sections?: ReportPrintSection[];
}

interface Props {
  data: ReportPrintData | null;
}

const ReportPrintView: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  const generatedAt = new Date().toLocaleString('pt-BR');
  const maxChartValue = data.chart ? Math.max(...data.chart.items.map(i => i.value), 1) : 1;

  return (
    <div className="print-only report-print">
      <div className="report-print-header">
        <div>
          <h1>Renovo Centro Automotivo</h1>
          <p>{data.title}</p>
        </div>
        <div className="report-print-generated">Gerado em {generatedAt}</div>
      </div>

      {data.meta && data.meta.length > 0 && (
        <div className="report-print-meta">
          {data.meta.map((item, index) => (
            <span key={index} className="report-print-meta-item">{item}</span>
          ))}
        </div>
      )}

      {data.summary && data.summary.length > 0 && (
        <div className="report-print-summary">
          {data.summary.map((item, index) => (
            <div key={index} className="report-print-summary-card">
              <span className="report-print-summary-label">{item.label}</span>
              <strong className="report-print-summary-value">{item.value}</strong>
            </div>
          ))}
        </div>
      )}

      {data.chart && (
        <section className="report-print-section">
          <h3>{data.chart.heading}</h3>
          <div className="report-print-chart">
            {data.chart.items.map((item, index) => (
              <div key={index} className="report-print-chart-row">
                <span className="report-print-chart-label">{item.label}</span>
                <div className="report-print-chart-track">
                  <div
                    className="report-print-chart-bar"
                    style={{ width: `${Math.max((item.value / maxChartValue) * 100, 2)}%` }}
                  />
                </div>
                <span className="report-print-chart-value">{item.valueLabel}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.sections?.map((section, index) => (
        <section key={index} className="report-print-section">
          {section.heading && <h3>{section.heading}</h3>}
          <table className="report-print-table">
            <thead>
              <tr>
                {section.columns.map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={section.highlightLastRow && rowIndex === section.rows.length - 1 ? 'report-print-row-highlight' : ''}
                >
                  {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {section.rows.length === 0 && <p className="report-print-empty">Nenhum dado encontrado para este período.</p>}
        </section>
      ))}

      <div className="report-print-footer">
        Renovo Centro Automotivo — Relatório gerado automaticamente pelo sistema de gestão.
      </div>
    </div>
  );
};

export default ReportPrintView;

import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { ReportExportFormat } from '@ecosphere/shared';
import {
  EXPORT_EXT,
  EXPORT_MIME,
  type EsgReportDataset,
  type GeneratedExportFile,
} from './report-export.types';

@Injectable()
export class ReportExportService {
  buildFilename(dataset: EsgReportDataset, format: ReportExportFormat): string {
    const stamp = dataset.meta.generatedAt.slice(0, 10);
    const slug = dataset.meta.reportType.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return `ecosphere-${slug}-${stamp}.${EXPORT_EXT[format]}`;
  }

  async generate(dataset: EsgReportDataset, format: ReportExportFormat): Promise<GeneratedExportFile> {
    const filename = this.buildFilename(dataset, format);
    let buffer: Buffer;

    switch (format) {
      case 'csv':
        buffer = await this.toCsv(dataset);
        break;
      case 'xlsx':
        buffer = await this.toXlsx(dataset);
        break;
      case 'pdf':
        buffer = await this.toPdf(dataset);
        break;
      default:
        throw new Error(`Unsupported export format: ${format satisfies never}`);
    }

    return { buffer, filename, mimeType: EXPORT_MIME[format] };
  }

  private async toCsv(dataset: EsgReportDataset): Promise<Buffer> {
    const lines: string[] = [];
    const row = (cells: (string | number)[]) =>
      cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');

    lines.push('EcoSphere ESG Management Platform — Report Export');
    lines.push(row(['Organization', dataset.meta.organizationName]));
    lines.push(row(['Report Type', dataset.meta.reportType]));
    lines.push(row(['Period Start', dataset.meta.periodStart]));
    lines.push(row(['Period End', dataset.meta.periodEnd]));
    lines.push(row(['Generated At', dataset.meta.generatedAt]));
    if (dataset.meta.departmentName) {
      lines.push(row(['Department', dataset.meta.departmentName]));
    }
    lines.push('');

    if (dataset.scores) {
      lines.push('ESG SCORES');
      lines.push(row(['Pillar', 'Score']));
      lines.push(row(['Environmental', dataset.scores.environmental.toFixed(2)]));
      lines.push(row(['Social', dataset.scores.social.toFixed(2)]));
      lines.push(row(['Governance', dataset.scores.governance.toFixed(2)]));
      lines.push(row(['Composite', dataset.scores.composite.toFixed(2)]));
      lines.push('');
    }

    lines.push('ENVIRONMENTAL');
    lines.push(row(['Metric', 'Value']));
    lines.push(row(['Total Carbon (kg CO₂e)', dataset.environmental.totalCarbonKg.toFixed(2)]));
    lines.push(row(['Scope 1 (kg)', dataset.environmental.scope1Kg.toFixed(2)]));
    lines.push(row(['Scope 2 (kg)', dataset.environmental.scope2Kg.toFixed(2)]));
    lines.push(row(['Scope 3 (kg)', dataset.environmental.scope3Kg.toFixed(2)]));
    lines.push('');

    lines.push('CARBON TREND');
    lines.push(row(['Month', 'CO₂e (kg)']));
    for (const point of dataset.environmental.carbonTrend) {
      lines.push(row([point.month, point.totalCo2e.toFixed(2)]));
    }
    lines.push('');

    lines.push('SOCIAL');
    lines.push(row(['Metric', 'Value']));
    lines.push(row(['CSR Hours', dataset.social.csrHours.toFixed(2)]));
    lines.push(row(['Participation Rate (%)', dataset.social.employeeParticipationRate]));
    lines.push(row(['Pending Approvals', dataset.social.pendingApprovals]));
    lines.push('');

    lines.push('GOVERNANCE');
    lines.push(row(['Metric', 'Value']));
    lines.push(row(['Open Compliance Issues', dataset.governance.openComplianceIssues]));
    lines.push(row(['Resolved Issues', dataset.governance.resolvedIssues]));
    lines.push(row(['Approved Framework Submissions', dataset.governance.frameworkSubmissions]));
    lines.push('');

    if (dataset.variance.length) {
      lines.push('VARIANCE');
      lines.push(row(['Metric', 'Current', 'Previous', 'Variance %']));
      for (const v of dataset.variance) {
        lines.push(
          row([
            v.metricLabel,
            v.currentValue.toFixed(2),
            v.previousValue.toFixed(2),
            v.variancePercent.toFixed(2),
          ]),
        );
      }
      lines.push('');
    }

    if (dataset.departments.length) {
      lines.push('DEPARTMENTS');
      lines.push(row(['Name', 'Code']));
      for (const d of dataset.departments) {
        lines.push(row([d.name, d.code]));
      }
    }

    return Buffer.from(lines.join('\r\n'), 'utf-8');
  }

  private async toXlsx(dataset: EsgReportDataset): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EcoSphere ESG Platform';
    workbook.created = new Date();

    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Field', key: 'field', width: 28 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    summary.addRows([
      { field: 'Organization', value: dataset.meta.organizationName },
      { field: 'Report Type', value: dataset.meta.reportType },
      { field: 'Period Start', value: dataset.meta.periodStart },
      { field: 'Period End', value: dataset.meta.periodEnd },
      { field: 'Generated At', value: dataset.meta.generatedAt },
    ]);
    if (dataset.scores) {
      summary.addRow({ field: '', value: '' });
      summary.addRow({ field: 'Environmental Score', value: dataset.scores.environmental.toFixed(2) });
      summary.addRow({ field: 'Social Score', value: dataset.scores.social.toFixed(2) });
      summary.addRow({ field: 'Governance Score', value: dataset.scores.governance.toFixed(2) });
      summary.addRow({ field: 'Composite ESG Score', value: dataset.scores.composite.toFixed(2) });
    }
    summary.getRow(1).font = { bold: true };

    const environmental = workbook.addWorksheet('Environmental');
    environmental.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    environmental.addRows([
      { metric: 'Total Carbon (kg CO₂e)', value: dataset.environmental.totalCarbonKg },
      { metric: 'Scope 1 (kg)', value: dataset.environmental.scope1Kg },
      { metric: 'Scope 2 (kg)', value: dataset.environmental.scope2Kg },
      { metric: 'Scope 3 (kg)', value: dataset.environmental.scope3Kg },
    ]);
    environmental.getRow(1).font = { bold: true };

    const trend = workbook.addWorksheet('Carbon Trend');
    trend.columns = [
      { header: 'Month', key: 'month', width: 16 },
      { header: 'CO₂e (kg)', key: 'total', width: 16 },
    ];
    trend.addRows(
      dataset.environmental.carbonTrend.map((p) => ({ month: p.month, total: p.totalCo2e })),
    );
    trend.getRow(1).font = { bold: true };

    const social = workbook.addWorksheet('Social');
    social.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    social.addRows([
      { metric: 'CSR Hours', value: dataset.social.csrHours },
      { metric: 'Participation Rate (%)', value: dataset.social.employeeParticipationRate },
      { metric: 'Pending Approvals', value: dataset.social.pendingApprovals },
    ]);
    social.getRow(1).font = { bold: true };

    const governance = workbook.addWorksheet('Governance');
    governance.columns = [
      { header: 'Metric', key: 'metric', width: 34 },
      { header: 'Value', key: 'value', width: 16 },
    ];
    governance.addRows([
      { metric: 'Open Compliance Issues', value: dataset.governance.openComplianceIssues },
      { metric: 'Resolved Issues', value: dataset.governance.resolvedIssues },
      {
        metric: 'Approved Framework Submissions',
        value: dataset.governance.frameworkSubmissions,
      },
    ]);
    governance.getRow(1).font = { bold: true };

    if (dataset.variance.length) {
      const variance = workbook.addWorksheet('Variance');
      variance.columns = [
        { header: 'Metric', key: 'label', width: 28 },
        { header: 'Current', key: 'current', width: 14 },
        { header: 'Previous', key: 'previous', width: 14 },
        { header: 'Variance %', key: 'variance', width: 14 },
      ];
      variance.addRows(
        dataset.variance.map((v) => ({
          label: v.metricLabel,
          current: v.currentValue,
          previous: v.previousValue,
          variance: v.variancePercent,
        })),
      );
      variance.getRow(1).font = { bold: true };
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async toPdf(dataset: EsgReportDataset): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).fillColor('#0f766e').text('EcoSphere ESG Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#334155').text(dataset.meta.organizationName, { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(12).fillColor('#0f172a').text('Report Metadata', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor('#475569');
      doc.text(`Type: ${dataset.meta.reportType}`);
      doc.text(`Period: ${dataset.meta.periodStart.slice(0, 10)} → ${dataset.meta.periodEnd.slice(0, 10)}`);
      doc.text(`Generated: ${dataset.meta.generatedAt}`);
      if (dataset.meta.departmentName) {
        doc.text(`Department: ${dataset.meta.departmentName}`);
      }
      doc.moveDown(1);

      if (dataset.scores) {
        doc.fontSize(12).fillColor('#0f172a').text('ESG Scores', { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor('#475569');
        doc.text(`Environmental: ${dataset.scores.environmental.toFixed(1)} / 100`);
        doc.text(`Social: ${dataset.scores.social.toFixed(1)} / 100`);
        doc.text(`Governance: ${dataset.scores.governance.toFixed(1)} / 100`);
        doc.text(`Composite: ${dataset.scores.composite.toFixed(1)} / 100`, { underline: true });
        doc.moveDown(1);
      }

      const section = (title: string, rows: [string, string][]) => {
        doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true });
        doc.moveDown(0.35);
        doc.fontSize(10).fillColor('#475569');
        for (const [label, value] of rows) {
          doc.text(`${label}: ${value}`);
        }
        doc.moveDown(0.8);
      };

      section('Environmental', [
        ['Total Carbon (kg CO₂e)', dataset.environmental.totalCarbonKg.toFixed(2)],
        ['Scope 1 (kg)', dataset.environmental.scope1Kg.toFixed(2)],
        ['Scope 2 (kg)', dataset.environmental.scope2Kg.toFixed(2)],
        ['Scope 3 (kg)', dataset.environmental.scope3Kg.toFixed(2)],
      ]);

      section('Social', [
        ['CSR Hours', dataset.social.csrHours.toFixed(2)],
        ['Participation Rate', `${dataset.social.employeeParticipationRate}%`],
        ['Pending Approvals', String(dataset.social.pendingApprovals)],
      ]);

      section('Governance', [
        ['Open Compliance Issues', String(dataset.governance.openComplianceIssues)],
        ['Resolved Issues', String(dataset.governance.resolvedIssues)],
        [
          'Approved Framework Submissions',
          String(dataset.governance.frameworkSubmissions),
        ],
      ]);

      if (dataset.variance.length) {
        doc.addPage();
        doc.fontSize(12).fillColor('#0f172a').text('Period Variance', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#475569');
        for (const v of dataset.variance) {
          doc.text(
            `${v.metricLabel}: ${v.currentValue.toFixed(2)} (was ${v.previousValue.toFixed(2)}, ${v.variancePercent >= 0 ? '+' : ''}${v.variancePercent.toFixed(1)}%)`,
          );
        }
      }

      doc.moveDown(1);
      doc.fontSize(8).fillColor('#94a3b8').text(
        'Generated by EcoSphere — Environmental, Social & Governance Management Platform',
        { align: 'center' },
      );

      doc.end();
    });
  }
}

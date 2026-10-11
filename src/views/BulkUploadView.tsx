import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
  X,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { bulkUploadLeads } from '../lib/api';

interface BulkUploadViewProps {
  onNavigate: (page: any) => void;
  onRefreshData?: () => void;
}

interface ParsedRow {
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry?: string;
  company_size?: string;
  source?: string;
  budget?: number;
  timeline?: string;
  decision_maker_seniority?: string;
  intent_score?: number;
  isValid: boolean;
  errors: string[];
}

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({ onNavigate, onRefreshData }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample CSV generator for download
  const downloadSampleTemplate = () => {
    const csvContent =
      `name,company,email,phone,industry,company_size,source,budget,timeline,decision_maker_seniority,intent_score\n` +
      `Alexander Hayes,Vanguard Logic,alex@vanguardlogic.com,+1-415-890-2100,Fintech,201-1000,Inbound Demo,130000,Immediate (<1 mo),C-Suite / VP,92\n` +
      `Beatrice Vance,BioScale Genomics,b.vance@bioscalegen.io,+1-617-555-8910,Healthcare SaaS,51-200,LinkedIn Outbound,85000,1-3 months,Director,80\n` +
      `Carlos Gomez,TerraMesh IoT,carlos@terramesh.net,+1-512-400-3321,Cloud & DevOps,1000+,Organic Search,175000,Immediate (<1 mo),C-Suite / VP,95\n` +
      `Diana Prince,Themyscira Apparel,diana@themyscira.com,+1-312-701-4490,E-commerce,11-50,Paid Ads,30000,3-6 months,Manager / Lead,55\n` +
      `Evan Ross,QuantumSec Labs,evan@quantumseclabs.com,+1-650-990-1122,Cybersecurity,51-200,G2 / Review Sites,95000,1-3 months,Director,88\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'LeadMatrix_Bulk_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVText = (text: string) => {
    setParsing(true);
    setErrorMsg(null);
    try {
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Simple regex-safe CSV tokenizer
        const values: string[] = [];
        let curr = '';
        let inQuotes = false;

        for (let char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        values.push(curr.trim());

        const rowObj: any = {};
        headers.forEach((h, index) => {
          let val = values[index] ? values[index].replace(/^["']|["']$/g, '') : '';
          rowObj[h] = val;
        });

        // Mapping standard variations
        const name = rowObj['name'] || rowObj['contact_name'] || rowObj['contact'] || '';
        const company = rowObj['company'] || rowObj['company_name'] || rowObj['account'] || '';
        const email = rowObj['email'] || rowObj['email_address'] || '';
        const phone = rowObj['phone'] || rowObj['phone_number'] || '';
        const industry = rowObj['industry'] || rowObj['vertical'] || 'Other';
        const company_size = rowObj['company_size'] || rowObj['size'] || rowObj['headcount'] || '11-50';
        const source = rowObj['source'] || rowObj['channel'] || 'Bulk Upload';
        const budget = Number(rowObj['budget'] || rowObj['acv'] || rowObj['deal_size'] || 0);
        const timeline = rowObj['timeline'] || '3-6 months';
        const decision_maker_seniority =
          rowObj['decision_maker_seniority'] || rowObj['seniority'] || rowObj['title'] || 'Manager / Lead';
        const intent_score = Number(rowObj['intent_score'] || rowObj['intent'] || 60);

        // Validation
        const rowErrors: string[] = [];
        if (!name) rowErrors.push('Missing contact name');
        if (!company) rowErrors.push('Missing company name');
        if (!email) {
          rowErrors.push('Missing email address');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          rowErrors.push('Invalid email format');
        }

        rows.push({
          name,
          company,
          email,
          phone,
          industry,
          company_size,
          source,
          budget,
          timeline,
          decision_maker_seniority,
          intent_score,
          isValid: rowErrors.length === 0,
          errors: rowErrors,
        });
      }

      setParsedRows(rows);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(selected);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('No valid rows found to import.');
      return;
    }

    try {
      setImporting(true);
      setProgress(25);
      setErrorMsg(null);

      // Simulate step progress for user feedback
      const timer = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 20 : p));
      }, 200);

      const result = await bulkUploadLeads(validRows);
      clearInterval(timer);
      setProgress(100);
      setImportResult(result);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk upload failed on server.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setErrorMsg(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-emerald-400" />
            Bulk CSV Upload & Batch Qualification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import bulk sales opportunities, auto-validate rows, run ensemble scoring, and synchronize with database.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Import Result Screen */}
      {importResult && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 text-slate-100 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Batch Import & Qualification Completed!</h3>
              <p className="text-xs text-slate-300">
                Processed records have been evaluated by the ML model and committed to database storage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block">Total Processed</span>
              <span className="text-xl font-bold font-mono text-white">{importResult.total_processed}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block">Successfully Scored</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{importResult.imported_count}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block">Duplicates Filtered</span>
              <span className="text-xl font-bold font-mono text-amber-400">{importResult.duplicates_count}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block">Row Errors</span>
              <span className="text-xl font-bold font-mono text-rose-400">{importResult.errors_count}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('leads-directory')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <span>Explore Scored Leads in Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!importResult && !file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-emerald-400 bg-emerald-950/20'
              : 'border-white/10 hover:border-emerald-500/40 bg-slate-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">
              Drop your CSV file here, or <span className="text-emerald-400">browse</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts .csv format. Compatible columns: name, company, email, phone, industry, budget, timeline, seniority, intent_score.
            </p>
          </div>
        </div>
      )}

      {/* Preview Table & Execution */}
      {!importResult && file && parsedRows.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{file.name}</span>
                <span className="text-[11px] text-slate-400">
                  {parsedRows.length} rows parsed · {validCount} valid · {invalidCount} invalid
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={importing}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing || validCount === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Scoring ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Import & Score {validCount} Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {importing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Synchronizing batch records...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Rows Preview */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md text-slate-400 font-semibold uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Industry</th>
                  <th className="py-2.5 px-3">Budget</th>
                  <th className="py-2.5 px-3">Seniority</th>
                  <th className="py-2.5 px-3">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-white/[0.02] ${
                      !row.isValid ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-semibold text-rose-400 flex items-center gap-1"
                          title={row.errors.join(', ')}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{row.name || '—'}</td>
                    <td className="py-2.5 px-3">{row.company || '—'}</td>
                    <td className="py-2.5 px-3 font-mono">{row.email || '—'}</td>
                    <td className="py-2.5 px-3">{row.industry}</td>
                    <td className="py-2.5 px-3 font-mono">${(row.budget || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3">{row.decision_maker_seniority}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

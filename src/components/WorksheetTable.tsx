import React from 'react';
import { Download, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { formatNum, formatSmartInertia, WorksheetEntry } from '../utils/physics';

interface WorksheetTableProps {
  entries: WorksheetEntry[];
  onAddCurrent: () => void;
  onLoadEntry: (entry: WorksheetEntry) => void;
  onDeleteEntry: (id: string) => void;
  disabledAdd: boolean;
}

export const WorksheetTable: React.FC<WorksheetTableProps> = ({
  entries,
  onAddCurrent,
  onLoadEntry,
  onDeleteEntry,
  disabledAdd,
}) => {
  const handleExportCsv = () => {
    const header = [
      'Keterangan',
      'Massa Piringan (kg)',
      'Jari-jari (m)',
      'Massa Beban (kg)',
      'Gaya F=mg (N)',
      'Torsi (N·m)',
      'Waktu (s)',
      'Percepatan Sudut (rad/s²)',
      'Momen Inersia Percobaan (kg·m²)',
      'Momen Inersia Teoritis (kg·m²)',
    ].join(',');

    const rows = entries.map((e) =>
      [
        `"${e.label.replace(/"/g, '""')}"`,
        e.params.M,
        e.params.R,
        e.params.m,
        e.results.force.toFixed(4),
        e.results.torque.toFixed(5),
        e.params.t.toFixed(2),
        e.results.alphaExp.toFixed(4),
        e.results.inertiaExp.toFixed(6),
        e.results.inertiaTheo.toFixed(6),
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lembar-kerja-gerak-rotasi-torsi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="lembar-kerja"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Tabel Data Percobaan Gerak Rotasi (Lembar Kerja Jobsheet)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Baris pertama memuat data pengamatan Laporan Resmi (Kelompok 1). Tambahkan hasil simulasi saat ini ke tabel untuk membandingkan variasi beban atau waktu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Unduh CSV
          </button>
          <button
            type="button"
            disabled={disabledAdd}
            onClick={onAddCurrent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Catat ke Tabel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 leading-tight">
              <th className="py-3 pl-4 pr-2.5">Percobaan</th>
              <th className="py-3 px-2.5 text-right">
                <div>Massa Piringan</div>
                <div className="font-mono font-normal text-slate-400">(kg)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Jari-jari</div>
                <div className="font-mono font-normal text-slate-400">(m)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Massa Beban</div>
                <div className="font-mono font-normal text-slate-400">(kg)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Gaya F=mg</div>
                <div className="font-mono font-normal text-slate-400">(N)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Torsi τ</div>
                <div className="font-mono font-normal text-slate-400">(N·m)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Waktu t</div>
                <div className="font-mono font-normal text-slate-400">(s)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Percepatan Sudut</div>
                <div className="font-mono font-normal text-slate-400">(rad/s²)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Inersia Percobaan</div>
                <div className="font-mono font-normal text-slate-400">(kg·m²)</div>
              </th>
              <th className="py-3 px-2.5 text-right">
                <div>Inersia Teoritis</div>
                <div className="font-mono font-normal text-slate-400">(kg·m²)</div>
              </th>
              <th className="py-3 pl-2.5 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-mono tabular-nums text-slate-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 pl-4 pr-2.5 font-sans font-medium text-slate-900 whitespace-nowrap">
                  {entry.label}
                </td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.params.M, 2)}</td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.params.R, 2)}</td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.params.m, 3)}</td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.results.force, 4)}</td>
                <td className="py-3 px-2.5 text-right font-semibold text-sky-700">
                  {formatNum(entry.results.torque, 5)}
                </td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.params.t, 2)}</td>
                <td className="py-3 px-2.5 text-right">{formatNum(entry.results.alphaExp, 4)}</td>
                <td className="py-3 px-2.5 text-right font-semibold text-slate-900">
                  {formatSmartInertia(entry.results.inertiaExp)}
                </td>
                <td className="py-3 px-2.5 text-right text-slate-600">
                  {formatSmartInertia(entry.results.inertiaTheo)}
                </td>
                <td className="py-3 pl-2.5 pr-4 text-right font-sans">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onLoadEntry(entry)}
                      aria-label={`Muat data ${entry.label}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      Muat
                    </button>
                    {!entry.isDefault && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        aria-label={`Hapus data ${entry.label}`}
                        className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

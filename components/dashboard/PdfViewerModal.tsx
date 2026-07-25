"use client";

import React from "react";
import { X, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
}

export function PdfViewerModal({ isOpen, onClose, title, fileUrl }: PdfViewerModalProps) {
  if (!isOpen || !fileUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400">PDF Hujjat Ko'rish Rejimi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
              <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
                <Download className="h-4 w-4" /> Yuklab olish
              </Button>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-100 p-2 overflow-hidden relative">
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            title={title}
            className="w-full h-full rounded-xl border border-slate-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

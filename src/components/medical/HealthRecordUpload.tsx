"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X, Check, Loader2 } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface HealthRecordUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  language?: 'en' | 'de' | 'fr' | 'zh';
  maxFiles?: number;
  maxSize?: number; // in bytes
}

const translations = {
  en: {
    title: 'Health Records Upload',
    description: 'Upload your medical records for AI analysis and doctor recommendation',
    upload: 'Upload Files',
    dragDrop: 'Drag and drop files here, or click to select',
    supportedFormats: 'Supported formats: PDF, JPG, PNG, DICOM',
    maxFiles: 'Maximum files',
    maxFileSize: 'Maximum file size',
    uploading: 'Uploading...',
    uploaded: 'Uploaded',
    error: 'Error',
    remove: 'Remove',
    analyze: 'Analyze with AI',
    analyzing: 'Analyzing...',
  },
  zh: {
    title: '健康档案上传',
    description: '上传您的医疗记录，AI将分析并为您推荐医生',
    upload: '上传文件',
    dragDrop: '拖拽文件到此处，或点击选择',
    supportedFormats: '支持格式：PDF、JPG、PNG、DICOM',
    maxFiles: '最多文件数',
    maxFileSize: '最大文件大小',
    uploading: '上传中...',
    uploaded: '已上传',
    error: '错误',
    remove: '移除',
    analyze: 'AI分析',
    analyzing: '分析中...',
  },
  de: {
    title: 'Gesundheitsakten hochladen',
    description: 'Laden Sie Ihre medizinischen Akten für AI-Analyse und Arzt-Empfehlung hoch',
    upload: 'Dateien hochladen',
    dragDrop: 'Dateien hierher ziehen oder zum Auswählen klicken',
    supportedFormats: 'Unterstützte Formate: PDF, JPG, PNG, DICOM',
    maxFiles: 'Maximale Dateien',
    maxFileSize: 'Maximale Dateigröße',
    uploading: 'Hochladen...',
    uploaded: 'Hochgeladen',
    error: 'Fehler',
    remove: 'Entfernen',
    analyze: 'Mit AI analysieren',
    analyzing: 'Analysiere...',
  },
  fr: {
    title: 'Télécharger les dossiers médicaux',
    description: 'Téléchargez vos dossiers médicaux pour l\'analyse IA et la recommandation de médecin',
    upload: 'Télécharger des fichiers',
    dragDrop: 'Glissez-déposez les fichiers ici ou cliquez pour sélectionner',
    supportedFormats: 'Formats pris en charge: PDF, JPG, PNG, DICOM',
    maxFiles: 'Fichiers maximum',
    maxFileSize: 'Taille de fichier maximale',
    uploading: 'Téléchargement...',
    uploaded: 'Téléchargé',
    error: 'Erreur',
    remove: 'Supprimer',
    analyze: 'Analyser avec IA',
    analyzing: 'Analyse...',
  },
};

export default function HealthRecordUpload({
  onFilesChange,
  language = 'en',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
}: HealthRecordUploadProps) {
  const t = translations[language];
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];

      // Check file size
      if (file.size > maxSize) {
        alert(`${t.error}: ${file.name} - ${t.maxFileSize}: ${maxSize / (1024 * 1024)}MB`);
        continue;
      }

      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
        alert(`${t.error}: ${file.name} - ${t.supportedFormats}`);
        continue;
      }

      const newFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        status: 'uploading',
      };

      newFiles.push(newFile);

      try {
        // Upload file to S3
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'health_record');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          newFile.url = data.url;
          newFile.status = 'success';
        } else {
          newFile.status = 'error';
          newFile.error = 'Upload failed';
        }
      } catch (error) {
        newFile.status = 'error';
        newFile.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const selectedFiles = e.dataTransfer.files;
    handleFileSelect(selectedFiles);
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Call AI analysis API
      const response = await fetch('/api/medical/analyze-health-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrls: files.filter(f => f.status === 'success').map(f => f.url),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Notify parent component with analysis results
        if (data.recommendations) {
          onFilesChange([...files, ...(data.recommendations as any)]);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">{t.dragDrop}</p>
          <p className="text-xs text-gray-500 mb-4">{t.supportedFormats}</p>
          <p className="text-xs text-gray-400">
            {t.maxFiles}: {maxFiles} | {t.maxFileSize}: {maxSize / (1024 * 1024)}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.dcm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(e.target.files);
              }
            }}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {file.status === 'success' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : file.status === 'error' ? (
                    <X className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {file.error && <span className="text-red-600 ml-2">- {file.error}</span>}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        {files.filter(f => f.status === 'success').length > 0 && (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.analyzing}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t.analyze}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

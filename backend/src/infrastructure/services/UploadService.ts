import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    transport: ws as any,
  },
});

export interface UploadedFileInfo {
  fileName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export class UploadService {
  private static uploadDir = path.join(__dirname, '../../../../uploads');

  static saveBase64(base64Data: string, originalName?: string): UploadedFileInfo {
    // Garantir que a pasta de uploads existe
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    let mimeType = 'application/octet-stream';
    let base64Content = base64Data;

    // Detectar data URI scheme (ex: "data:image/png;base64,iVBORw...")
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].substring(5);
        base64Content = parts[1];
      }
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const sizeBytes = buffer.length;

    // Gerar nome único para o arquivo
    const fileHash = crypto.randomBytes(8).toString('hex');
    let extension = 'bin';

    if (originalName) {
      const ext = path.extname(originalName);
      if (ext) {
        extension = ext.substring(1);
      }
    } else {
      // Tentar adivinhar extensão a partir do mime-type
      const mimeMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      };
      extension = mimeMap[mimeType] || 'bin';
    }

    const cleanName = originalName
      ? path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '_')
      : 'upload';
    
    const uniqueFileName = `${cleanName}_${fileHash}.${extension}`;
    const filePath = path.join(this.uploadDir, uniqueFileName);

    // Escrever arquivo no disco
    fs.writeFileSync(filePath, buffer);

    // URL relativa de acesso estático
    const fileUrl = `/uploads/${uniqueFileName}`;

    return {
      fileName: originalName || uniqueFileName,
      filePath,
      fileUrl,
      mimeType,
      sizeBytes,
    };
  }

  static async uploadBase64ToSupabase(base64Data: string, originalName?: string): Promise<UploadedFileInfo> {
    let mimeType = 'application/octet-stream';
    let base64Content = base64Data;

    // Detect data URI scheme (ex: "data:image/png;base64,iVBORw...")
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].substring(5);
        base64Content = parts[1];
      }
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const sizeBytes = buffer.length;

    // 1. Validate file size (5MB max)
    if (sizeBytes > 5 * 1024 * 1024) {
      throw { status: 400, message: 'O arquivo excede o limite de 5MB.' };
    }

    // 2. Validate file format (PNG, JPEG, PDF)
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    let extension = 'bin';
    if (originalName) {
      const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
      const allowedExts = ['.png', '.jpg', '.jpeg', '.pdf'];
      if (!allowedMimeTypes.includes(mimeType) && !allowedExts.includes(ext)) {
        throw { status: 400, message: 'Formato de arquivo inválido. Apenas PNG, JPEG e PDF são permitidos.' };
      }
      extension = ext.substring(1);
    } else {
      if (!allowedMimeTypes.includes(mimeType)) {
        throw { status: 400, message: 'Formato de arquivo inválido. Apenas PNG, JPEG e PDF são permitidos.' };
      }
      const mimeMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'application/pdf': 'pdf',
      };
      extension = mimeMap[mimeType] || 'bin';
    }

    // Generate unique name for the file
    const fileHash = crypto.randomBytes(8).toString('hex');
    const cleanName = originalName
      ? originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_')
      : 'upload';
    const uniqueFileName = `${cleanName}_${fileHash}.${extension}`;

    // Upload to Supabase Storage in the "files" bucket
    const { data, error } = await supabase.storage
      .from('files')
      .upload(uniqueFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw { status: 500, message: `Erro ao enviar arquivo para o Supabase: ${error.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(uniqueFileName);

    return {
      fileName: originalName || uniqueFileName,
      filePath: uniqueFileName,
      fileUrl: publicUrl,
      mimeType,
      sizeBytes,
    };
  }
}

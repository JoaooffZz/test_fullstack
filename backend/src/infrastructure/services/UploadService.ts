import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
}

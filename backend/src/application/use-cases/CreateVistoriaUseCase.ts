import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { UploadRepository } from '../../core/ports/repositories/UploadRepository';
import { UploadService } from '../../infrastructure/services/UploadService';
import { prisma } from '../../infrastructure/database/prisma';
import { VistoriaType } from '../../generated/prisma/client';

interface PhotoInput {
  base64: string;
  name?: string;
}

interface CreateVistoriaInput {
  obraUuid: string;
  companyUuid: string;
  createdByUuid?: string | null;
  type: VistoriaType;
  description?: string | null;
  photos?: PhotoInput[];
}

export class CreateVistoriaUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private uploadRepository: UploadRepository,
  ) {}

  async execute(input: CreateVistoriaInput): Promise<any> {
    const obra = await this.obraRepository.findById(input.obraUuid, input.companyUuid);
    if (!obra) throw { status: 404, message: 'Obra não encontrada' };

    const vistoria = await prisma.obraVistoria.create({
      data: {
        obraUuid: input.obraUuid,
        createdByUuid: input.createdByUuid,
        type: input.type,
        description: input.description,
      },
    });

    const savedPhotos: any[] = [];

    if (input.photos && input.photos.length > 0) {
      for (const photo of input.photos) {
        try {
          const fileInfo = UploadService.saveBase64(photo.base64, photo.name);
          const uploadRecord = await this.uploadRepository.create({
            companyUuid: input.companyUuid,
            entityType: 'obra_vistoria',
            entityUuid: vistoria.uuid,
            fileName: fileInfo.fileName,
            fileUrl: fileInfo.fileUrl,
            mimeType: fileInfo.mimeType,
            sizeBytes: fileInfo.sizeBytes,
          });
          savedPhotos.push(uploadRecord);
        } catch (e: any) {
          console.error('Erro ao salvar foto da vistoria:', e.message);
        }
      }
    }

    return { ...vistoria, photos: savedPhotos };
  }
}

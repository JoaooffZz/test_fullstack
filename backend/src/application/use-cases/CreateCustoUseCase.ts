import { ObraRepository } from '../../core/ports/repositories/ObraRepository';
import { ObraCustoRepository } from '../../core/ports/repositories/ObraCustoRepository';
import { UploadRepository } from '../../core/ports/repositories/UploadRepository';
import { ObraCusto } from '../../core/domain/ObraCusto';
import { UploadService } from '../../infrastructure/services/UploadService';
import { CostCategory } from '../../generated/prisma/client';

interface CreateCustoInput {
  obraUuid: string;
  companyUuid: string;
  createdByUuid?: string | null;
  description: string;
  category: CostCategory;
  value: number;
  date: Date | string;
  receipt?: { base64: string; name?: string } | null;
}

export class CreateCustoUseCase {
  constructor(
    private obraRepository: ObraRepository,
    private custoRepository: ObraCustoRepository,
    private uploadRepository: UploadRepository,
  ) {}

  async execute(input: CreateCustoInput): Promise<{ uuid?: string; obraUuid: string; description: string; category: CostCategory; value: number | bigint; date: Date; receipt?: any }> {
    const obra = await this.obraRepository.findById(input.obraUuid, input.companyUuid);
    if (!obra) throw { status: 404, message: 'Obra não encontrada' };

    if (input.value <= 0) {
      throw { status: 400, message: 'O valor do custo deve ser maior que zero' };
    }

    const custo = new ObraCusto({
      obraUuid: input.obraUuid,
      createdByUuid: input.createdByUuid,
      description: input.description,
      category: input.category,
      value: input.value,
      date: new Date(input.date),
    });

    const created = await this.custoRepository.create(custo);
    let receipt: any = null;

    if (input.receipt) {
      try {
        const fileInfo = UploadService.saveBase64(input.receipt.base64, input.receipt.name);
        receipt = await this.uploadRepository.create({
          companyUuid: input.companyUuid,
          entityType: 'obra_custo',
          entityUuid: created.uuid!,
          fileName: fileInfo.fileName,
          fileUrl: fileInfo.fileUrl,
          mimeType: fileInfo.mimeType,
          sizeBytes: fileInfo.sizeBytes,
        });
      } catch (e: any) {
        console.error('Erro ao salvar comprovante:', e.message);
      }
    }

    return { ...created, receipt };
  }
}

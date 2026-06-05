export interface UploadRecord {
  uuid?: string;
  createdAt?: Date;
  companyUuid: string;
  entityType: string;
  entityUuid: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: bigint | number | null;
}

export interface UploadRepository {
  create(record: UploadRecord): Promise<UploadRecord>;
  findByEntity(entityUuid: string, entityType: string, companyUuid: string): Promise<UploadRecord[]>;
}

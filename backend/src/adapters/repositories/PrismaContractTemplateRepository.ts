import { ContractTemplateRepository } from '../../core/ports/repositories/ContractTemplateRepository';
import { ContractTemplate } from '../../core/domain/ContractTemplate';
import { prisma } from '../../infrastructure/database/prisma';
import { ContractType, TemplateFieldType } from '../../generated/prisma/client';

export class PrismaContractTemplateRepository implements ContractTemplateRepository {
  async create(template: ContractTemplate): Promise<ContractTemplate> {
    const created = await prisma.$transaction(async (tx) => {
      const templateRecord = await tx.contractTemplate.create({
        data: {
          companyUuid: template.companyUuid,
          name: template.name,
          type: template.type,
          description: template.description,
          body: template.body,
          isActive: template.isActive,
        },
      });

      if (template.fields && template.fields.length > 0) {
        await tx.contractTemplateField.createMany({
          data: template.fields.map((f, index) => ({
            templateUuid: templateRecord.uuid,
            key: f.key,
            label: f.label,
            fieldType: f.fieldType as TemplateFieldType,
            isRequired: f.isRequired ?? true,
            sortOrder: f.sortOrder ?? index,
          })),
        });
      }

      return tx.contractTemplate.findUniqueOrThrow({
        where: { uuid: templateRecord.uuid },
        include: { fields: true },
      });
    });

    return new ContractTemplate({
      uuid: created.uuid,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      companyUuid: created.companyUuid,
      name: created.name,
      type: created.type as ContractType,
      description: created.description,
      body: created.body,
      isActive: created.isActive,
      fields: created.fields.map((f) => ({
        uuid: f.uuid,
        createdAt: f.createdAt,
        templateUuid: f.templateUuid,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType as any,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      })),
    });
  }

  async findById(uuid: string, companyUuid: string): Promise<ContractTemplate | null> {
    const record = await prisma.contractTemplate.findFirst({
      where: { uuid, companyUuid },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!record) return null;

    return new ContractTemplate({
      uuid: record.uuid,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      companyUuid: record.companyUuid,
      name: record.name,
      type: record.type as ContractType,
      description: record.description,
      body: record.body,
      isActive: record.isActive,
      fields: record.fields.map((f) => ({
        uuid: f.uuid,
        createdAt: f.createdAt,
        templateUuid: f.templateUuid,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType as any,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      })),
    });
  }

  async list(companyUuid: string, type?: ContractType): Promise<ContractTemplate[]> {
    const records = await prisma.contractTemplate.findMany({
      where: {
        companyUuid,
        isActive: true,
        ...(type ? { type } : {}),
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(
      (record) =>
        new ContractTemplate({
          uuid: record.uuid,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          companyUuid: record.companyUuid,
          name: record.name,
          type: record.type as ContractType,
          description: record.description,
          body: record.body,
          isActive: record.isActive,
          fields: record.fields.map((f) => ({
            uuid: f.uuid,
            createdAt: f.createdAt,
            templateUuid: f.templateUuid,
            key: f.key,
            label: f.label,
            fieldType: f.fieldType as any,
            isRequired: f.isRequired,
            sortOrder: f.sortOrder,
          })),
        }),
    );
  }
}

/**
 * Utilitário para converter dados em formato CSV para download.
 * Garante o tratamento correto de delimitadores, aspas e caracteres especiais (acentos).
 */
export class CsvHelper {
  /**
   * Converte um array de objetos para uma string CSV legível no Excel.
   * Adiciona o BOM de UTF-8 (\uFEFF) no início para preservar a acentuação.
   */
  static toCsv(headers: string[], rows: string[][]): string {
    const BOM = '\uFEFF';

    const escapeField = (field: any): string => {
      if (field === null || field === undefined) {
        return '';
      }
      let val = String(field);
      // Se houver aspas, ponto e vírgula, quebra de linha ou vírgula, envolve em aspas duplas
      if (val.includes('"') || val.includes(';') || val.includes('\n') || val.includes('\r') || val.includes(',')) {
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }
      return val;
    };

    const headerLine = headers.map(escapeField).join(';');
    const rowsLines = rows.map((row) => row.map(escapeField).join(';'));

    return BOM + [headerLine, ...rowsLines].join('\r\n');
  }
}

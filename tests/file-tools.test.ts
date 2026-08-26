import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  compressionSavingPercent,
  parsePageSelection,
  replaceFileExtension,
  totalFileBytes,
  validateFileBatch,
} from '../src/core/file-processing';
import { bytesToPdfBlob, inspectPdf, mergePdfs, splitPdf } from '../src/core/pdf-processing';
import { assertToolModule } from '../src/core/tool-contract';
import { fileTools } from '../src/data/file-tools';
import { toolRegistry } from '../src/data/tools';

async function createPdf(name: string, pages: number): Promise<File> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([320, 480]);
  document.setTitle(name);
  return new File([await document.save() as BlobPart], `${name}.pdf`, { type: 'application/pdf' });
}

describe('Phase 3 File Tools', () => {
  it('registers twenty-three active, offline, client-side tools', () => {
    expect(fileTools).toHaveLength(23);
    expect(fileTools.every(({ status, processing, supportsOffline }) => status === 'active' && processing === 'client-side' && supportsOffline)).toBe(true);
  });

  it('lazy-loads every File Tool with matching Registry metadata', async () => {
    const fileIds = new Set<string>(fileTools.map(({ id }) => id));
    const entries = toolRegistry.filter(({ metadata }) => fileIds.has(metadata.id));
    expect(entries).toHaveLength(23);
    for (const entry of entries) {
      const module = await entry.load();
      expect(() => assertToolModule(module, entry.metadata.id)).not.toThrow();
      expect(module.metadata).toBe(entry.metadata);
    }
  });

  it('validates batches, filenames and compression savings', () => {
    const files = [new File(['abc'], 'one.txt', { type: 'text/plain' }), new File(['de'], 'two.txt', { type: 'text/plain' })];
    expect(totalFileBytes(files)).toBe(5);
    expect(() => validateFileBatch(files, { maxFiles: 2, maxBytes: 5, acceptedTypes: ['text/plain'], label: 'ไฟล์ข้อความ' })).not.toThrow();
    expect(() => validateFileBatch(files, { maxFiles: 1, maxBytes: 5, acceptedTypes: ['text/plain'], label: 'ไฟล์ข้อความ' })).toThrow('ไม่เกิน 1');
    expect(replaceFileExtension('photo.png', '-compressed', 'webp')).toBe('photo-compressed.webp');
    expect(compressionSavingPercent(1_000, 620)).toBe(38);
  });

  it('parses page selections without duplicates and rejects invalid ranges', () => {
    expect(parsePageSelection('1-3, 3, 5', 5)).toEqual([0, 1, 2, 4]);
    expect(() => parsePageSelection('0,2', 5)).toThrow('ระหว่าง 1 ถึง 5');
    expect(() => parsePageSelection('5-2', 5)).toThrow('ระหว่าง 1 ถึง 5');
  });

  it('inspects, merges and splits PDF files locally', async () => {
    const first = await createPdf('First', 2);
    const second = await createPdf('Second', 1);
    await expect(inspectPdf(first)).resolves.toMatchObject({ pageCount: 2, title: 'First' });
    const merged = await mergePdfs([first, second]);
    expect(merged.pageCount).toBe(3);
    expect(bytesToPdfBlob(merged.bytes).type).toBe('application/pdf');
    const mergedFile = new File([merged.bytes as BlobPart], 'merged.pdf', { type: 'application/pdf' });
    const split = await splitPdf(mergedFile, '2-3');
    expect(split.selectedPages).toEqual([1, 2]);
    await expect(inspectPdf(new File([split.bytes as BlobPart], 'split.pdf', { type: 'application/pdf' }))).resolves.toMatchObject({ pageCount: 2 });
  });
});

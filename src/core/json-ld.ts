export type JsonLdType = 'Article' | 'Product' | 'Organization' | 'FAQPage' | 'BreadcrumbList';

export interface JsonLdFields {
  name: string;
  description: string;
  url: string;
  image: string;
  author: string;
  price: string;
  currency: string;
  faq: string;
  breadcrumbs: string;
}

function optionalUrl(value: string): string | undefined {
  if (!value.trim()) return undefined;
  try { return new URL(value).toString(); } catch { throw new Error(`URL ไม่ถูกต้อง: ${value}`); }
}

export function generateJsonLd(type: JsonLdType, fields: JsonLdFields): Record<string, unknown> {
  const url = optionalUrl(fields.url);
  const image = optionalUrl(fields.image);
  const base: Record<string, unknown> = { '@context': 'https://schema.org', '@type': type };
  if (fields.name.trim()) base.name = fields.name.trim();
  if (fields.description.trim()) base.description = fields.description.trim();
  if (url) base.url = url;
  if (image) base.image = image;
  if (type === 'Article' && fields.author.trim()) base.author = { '@type': 'Person', name: fields.author.trim() };
  if (type === 'Product') {
    if (!fields.price.trim()) throw new Error('Product ต้องมีราคา');
    const price = Number(fields.price);
    if (!Number.isFinite(price) || price < 0) throw new Error('ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
    base.offers = { '@type': 'Offer', price, priceCurrency: fields.currency.trim() || 'THB', availability: 'https://schema.org/InStock' };
  }
  if (type === 'FAQPage') {
    const items = fields.faq.split(/\r?\n/).map((line) => line.split('::')).filter(([question, answer]) => question?.trim() && answer?.trim());
    if (!items.length) throw new Error('FAQPage ต้องมีคำถามและคำตอบรูปแบบ คำถาม::คำตอบ อย่างน้อยหนึ่งรายการ');
    base.mainEntity = items.map((parts) => { const question = parts[0] ?? ''; const answer = parts[1] ?? ''; return { '@type': 'Question', name: question.trim(), acceptedAnswer: { '@type': 'Answer', text: answer.trim() } }; });
  }
  if (type === 'BreadcrumbList') {
    const items = fields.breadcrumbs.split(/\r?\n/).map((line) => line.split('::')).filter(([name, item]) => name?.trim() && item?.trim());
    if (!items.length) throw new Error('BreadcrumbList ต้องมีรายการรูปแบบ ชื่อ::URL อย่างน้อยหนึ่งรายการ');
    base.itemListElement = items.map((parts, index) => { const name = parts[0] ?? ''; const item = parts[1] ?? ''; return { '@type': 'ListItem', position: index + 1, name: name.trim(), item: optionalUrl(item.trim()) }; });
  }
  return base;
}

export function jsonLdScript(json: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(json, null, 2)}\n</script>`;
}

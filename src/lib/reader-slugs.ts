import type { ReaderId } from '@/lib/schemas';

export type CanonicalReaderId =
  | 'ba_ngoai'
  | 'chi_dai'
  | 'ban_than'
  | 'thay_cu_meo';

/**
 * Normalizes any ReaderId (including legacy aliases) to one of the 4 canonical Reader IDs.
 */
export function normalizeCanonicalReaderId(
  readerId?: string | null
): CanonicalReaderId {
  if (readerId === 'chi_dai' || readerId === 'ba_co_mo_hon') {
    return 'chi_dai';
  }
  if (readerId === 'ban_than' || readerId === 'phap_su_toi_co') {
    return 'ban_than';
  }
  if (readerId === 'thay_cu_meo' || readerId === 'tong_tai_ly_tri') {
    return 'thay_cu_meo';
  }
  return 'ba_ngoai';
}

/**
 * Mapping between Reader ID and canonical URL Slug
 */
export const READER_SLUG_MAP: Record<ReaderId, string> = {
  ba_ngoai: 'ba-ngoai',
  chi_dai: 'chi-dai',
  ban_than: 'ban-than',
  thay_cu_meo: 'thay-cu-meo',
  // Legacy aliases redirect cleanly to canonical slugs
  ba_co_mo_hon: 'chi-dai',
  tien_tu_chua_lanh: 'ba-ngoai',
  tong_tai_ly_tri: 'thay-cu-meo',
  phap_su_toi_co: 'ban-than',
};

/**
 * Maps any URL slug (canonical or legacy) to a valid canonical ReaderId present in READERS.
 */
export const SLUG_TO_READER_ID: Record<string, CanonicalReaderId> = {
  'ba-ngoai': 'ba_ngoai',
  'chi-dai': 'chi_dai',
  'ban-than': 'ban_than',
  'thay-cu-meo': 'thay_cu_meo',
  // Legacy hyphenated slugs map to canonical Reader IDs so old URLs never 404
  'ba-co-mo-hon': 'chi_dai',
  'tien-tu-chua-lanh': 'ba_ngoai',
  'tong-tai-ly-tri': 'thay_cu_meo',
  'phap-su-toi-co': 'ban_than',
  // Direct ID as slug resilience
  ba_ngoai: 'ba_ngoai',
  chi_dai: 'chi_dai',
  ban_than: 'ban_than',
  thay_cu_meo: 'thay_cu_meo',
  ba_co_mo_hon: 'chi_dai',
  tien_tu_chua_lanh: 'ba_ngoai',
  tong_tai_ly_tri: 'thay_cu_meo',
  phap_su_toi_co: 'ban_than',
};

export const ALL_READER_SLUGS = [
  'ba-ngoai',
  'chi-dai',
  'ban-than',
  'thay-cu-meo',
  'ba-co-mo-hon',
  'tien-tu-chua-lanh',
  'tong-tai-ly-tri',
  'phap-su-toi-co',
] as const;

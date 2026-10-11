import type { ReaderId } from '@/lib/schemas';

/**
 * Mapping between Reader ID (ba_co_mo_hon) and URL Slug (ba-co-mo-hon)
 */
export const READER_SLUG_MAP: Record<ReaderId, string> = {
  ba_co_mo_hon: 'ba-co-mo-hon',
  tien_tu_chua_lanh: 'tien-tu-chua-lanh',
  tong_tai_ly_tri: 'tong-tai-ly-tri',
  phap_su_toi_co: 'phap-su-toi-co',
};

export const SLUG_TO_READER_ID: Record<string, ReaderId> = {
  'ba-co-mo-hon': 'ba_co_mo_hon',
  'tien-tu-chua-lanh': 'tien_tu_chua_lanh',
  'tong-tai-ly-tri': 'tong_tai_ly_tri',
  'phap-su-toi-co': 'phap_su_toi_co',
  // Also support direct ID as slug for resilience
  'ba_co_mo_hon': 'ba_co_mo_hon',
  'tien_tu_chua_lanh': 'tien_tu_chua_lanh',
  'tong_tai_ly_tri': 'tong_tai_ly_tri',
  'phap_su_toi_co': 'phap_su_toi_co',
};

export const ALL_READER_SLUGS = [
  'ba-co-mo-hon',
  'tien-tu-chua-lanh',
  'tong-tai-ly-tri',
  'phap-su-toi-co',
] as const;

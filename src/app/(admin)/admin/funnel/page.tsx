'use client';

import React, { useState, useEffect } from 'react';
import { FunnelAnalyticsModal } from '@/components/FunnelAnalyticsModal';
import { AdminAuthGate } from '@/components/AdminAuthGate';
import { useRouter } from 'next/navigation';
import type { HealthResponse } from '@/app/api/health/route';
import { Cpu, ShieldCheck, Activity } from 'lucide-react';

export default function AdminFunnelPage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch {
        // preserve fallback state
      } finally {
        setLoadingHealth(false);
      }
    }
    void loadHealth();
  }, []);

  return (
    <AdminAuthGate
      title="Tarot Couple — Bảng Điều Khiển Quản Trị & Funnel"
      description="Nhập mã bí mật ADMIN_SECRET để xem số liệu funnel, sức khỏe Gemini AI & trạng thái Supabase."
    >
      <div className="min-h-screen bg-[#0B0A12] text-[#F8F5F0] p-4 sm:p-8">
        {/* System & AI / Supabase Health Status Banner */}
        <div className="max-w-4xl mx-auto mb-6 p-5 rounded-2xl bg-[#13111E] border border-[#C9A24A]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262235] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#C9A24A]" />
              <h1 className="font-display text-base sm:text-lg font-bold text-[#F8F5F0]">
                Trạng Thái Hệ Thống Diagnostics & AI/Supabase Health View
              </h1>
            </div>
            <span className="text-xs text-[#9E96B0] font-mono">
              {health?.timestamp
                ? `Cập nhật: ${new Date(health.timestamp).toLocaleTimeString('vi-VN')}`
                : loadingHealth
                  ? 'Đang kiểm tra...'
                  : 'Ngoại tuyến'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Gemini AI Status */}
            <div className="p-3.5 rounded-xl bg-[#09080D] border border-[#262235] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E5C687] flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#C9A24A]" />
                  Gemini AI Engine
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    (health?.ai.configuredKeysCount ?? 0) > 0
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {health?.ai.configuredKeysCount ?? 0} Keys sẵn sàng
                </span>
              </div>
              <p className="text-[#9E96B0]">
                Model chính:{' '}
                <strong className="text-[#F8F5F0] font-mono">
                  {health?.ai.primaryModel || 'gemini-3.5-flash-lite'}
                </strong>
              </p>
              <div>
                <span className="text-[#9E96B0] block mb-1">Chuỗi ưu tiên dự phòng:</span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {(
                    health?.ai.modelChain ?? [
                      'gemini-3.5-flash-lite',
                      'gemini-3.1-flash-lite',
                      'gemini-3.6-flash',
                      'gemini-3-flash-preview',
                    ]
                  ).map((model, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-[#1C172B] border border-[#262235] text-[#E5C687]"
                    >
                      {idx + 1}. {model}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Supabase Status */}
            <div className="p-3.5 rounded-xl bg-[#09080D] border border-[#262235] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E5C687] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C9A24A]" />
                  Supabase Database
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    health?.supabase.connected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-400/40'
                  }`}
                >
                  Chế độ: {health?.supabase.mode === 'hybrid' ? 'Hybrid (Cloud REST)' : 'Local Memory Fallback'}
                </span>
              </div>
              <p className="text-[#9E96B0]">
                Kết nối:{' '}
                <span
                  className={`font-semibold ${
                    health?.supabase.connected ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {health?.supabase.connected ? '● Kết nối REST thành công' : '○ Local Memory Fallback'}
                </span>
              </p>
              <p className="text-[#9E96B0]">
                Bảng dữ liệu:{' '}
                <span
                  className={`font-semibold ${
                    health?.supabase.tablesReady ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {health?.supabase.tablesReady
                    ? '✅ Sẵn sàng 6/6 bảng'
                    : health?.supabase.missingTables && health.supabase.missingTables.length > 0
                      ? `Thiếu: ${health.supabase.missingTables.join(', ')}`
                      : 'Chưa kiểm tra'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <FunnelAnalyticsModal
          isOpen={true}
          onClose={() => router.push('/')}
          bannerHealth={health}
        />
      </div>
    </AdminAuthGate>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Loader2, LogOut } from 'lucide-react';

interface AdminAuthGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminAuthGate({
  children,
  title = 'Khu Vực Quản Trị Hệ Thống',
  description = 'Vui lòng nhập mã bí mật ADMIN_SECRET để truy cập bảng điều khiển nội bộ.',
}: AdminAuthGateProps) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function checkCurrentAuth() {
      try {
        const res = await fetch('/api/admin/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // preserve unauthenticated state
      } finally {
        setCheckingAuth(false);
      }
    }
    void checkCurrentAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) {
      setErrorMsg('Vui lòng nhập mã bí mật Admin.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
      } else {
        setErrorMsg(data.message || 'Mã bí mật không hợp lệ.');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setIsAuthenticated(false);
      setSecretInput('');
    } catch {
      // ignore
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0A12] text-[#F8F5F0] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#C9A24A] animate-spin mb-3" />
        <p className="text-sm text-[#9E96B0]">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0A12] text-[#F8F5F0] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#13111E] border border-[#C9A24A]/40 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#09080D] border border-[#C9A24A]/30 flex items-center justify-center text-[#C9A24A] shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[#9E96B0]">
              {description}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-secret-input"
                className="block text-xs font-semibold text-[#E5C687] mb-1.5"
              >
                Mã bí mật Quản trị (ADMIN_SECRET)
              </label>
              <div className="relative">
                <input
                  id="admin-secret-input"
                  type="password"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Nhập secret key..."
                  className="w-full px-4 py-3 rounded-xl bg-[#09080D] border border-[#262235] focus:border-[#C9A24A] focus:outline-none text-[#F8F5F0] text-sm font-mono placeholder:text-[#5E5873] pr-10"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-[#5E5873] absolute right-3 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A24A] to-[#E5C687] hover:opacity-90 active:scale-[0.99] text-[#09080D] font-bold text-sm shadow-lg shadow-[#C9A24A]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                'Mở Khóa Quản Trị'
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#262235] text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Top right admin session badge */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#13111E]/90 border border-[#C9A24A]/40 backdrop-blur-md text-[11px] text-[#E5C687] shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Admin Đã Xác Thực</span>
        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất Admin"
          className="ml-1 text-[#9E96B0] hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

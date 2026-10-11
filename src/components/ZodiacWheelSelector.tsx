'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ZODIAC_LIST = [
  { sign: 'Bạch Dương', symbol: '♈', date: '21/3 - 19/4', element: 'Lửa' },
  { sign: 'Kim Ngưu', symbol: '♉', date: '20/4 - 20/5', element: 'Đất' },
  { sign: 'Song Tử', symbol: '♊', date: '21/5 - 21/6', element: 'Khí' },
  { sign: 'Cự Giải', symbol: '♋', date: '22/6 - 22/7', element: 'Nước' },
  { sign: 'Sư Tử', symbol: '♌', date: '23/7 - 22/8', element: 'Lửa' },
  { sign: 'Xử Nữ', symbol: '♍', date: '23/8 - 22/9', element: 'Đất' },
  { sign: 'Thiên Bình', symbol: '♎', date: '23/9 - 23/10', element: 'Khí' },
  { sign: 'Bọ Cạp', symbol: '♏', date: '24/10 - 22/11', element: 'Nước' },
  { sign: 'Nhân Mã', symbol: '♐', date: '23/11 - 21/12', element: 'Lửa' },
  { sign: 'Ma Kết', symbol: '♑', date: '22/12 - 19/1', element: 'Đất' },
  { sign: 'Bảo Bình', symbol: '♒', date: '20/1 - 18/2', element: 'Khí' },
  { sign: 'Song Ngư', symbol: '♓', date: '19/2 - 20/3', element: 'Nước' },
];

interface ZodiacWheelSelectorProps {
  selectedSign: string;
  onSelectSign: (sign: string) => void;
}

export function ZodiacWheelSelector({
  selectedSign,
  onSelectSign,
}: ZodiacWheelSelectorProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-[#D9B36A] uppercase tracking-wider">
          Chọn Cung Hoàng Đạo (Tùy chọn)
        </label>
        {selectedSign && (
          <button
            type="button"
            onClick={() => onSelectSign('')}
            className="text-[10px] text-[#9E96B0] hover:text-[#E5C687] underline cursor-pointer"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ZODIAC_LIST.map((item) => {
          const isSelected = selectedSign.includes(item.sign);

          return (
            <motion.button
              key={item.sign}
              type="button"
              whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
              onClick={() => onSelectSign(`${item.sign} (${item.symbol})`)}
              className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[#1E1933] border-[#D9B36A] shadow-[0_0_15px_rgba(217,179,106,0.3)] text-[#F8F5F0]'
                  : 'bg-[#0B0A12]/90 border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0] hover:border-[#D9B36A]/40'
              }`}
            >
              <span className="text-lg mb-0.5">{item.symbol}</span>
              <span className="text-[11px] font-bold block leading-tight">{item.sign}</span>
              <span className="text-[9px] text-[#9E96B0] mt-0.5 opacity-80">{item.element}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

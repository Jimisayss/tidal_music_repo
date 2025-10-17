'use client';

import { ChangeEvent } from 'react';
import type { AudioQuality } from '@/lib/types';

interface FormatDropdownProps {
  options: AudioQuality[];
  value: AudioQuality;
  onChange: (quality: AudioQuality) => void;
}

export function FormatDropdown({ options, value, onChange }: FormatDropdownProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as AudioQuality);
  };

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
      Quality
      <select
        value={value}
        onChange={handleChange}
        className="rounded-full border border-cyan-500/40 bg-slate-900/90 px-3 py-1 text-xs font-semibold text-cyan-100 focus:border-cyan-300 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-900 text-slate-100">
            {option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}



/** Shared Tailwind classes for readable forms and controls */
const fieldBase =
  "rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-600 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

export const inputClass = `w-full ${fieldBase}`;

export const inputClassInline = `flex-1 ${fieldBase}`;

export const selectClass = fieldBase;

export const labelClass = "block text-sm font-semibold text-zinc-800";

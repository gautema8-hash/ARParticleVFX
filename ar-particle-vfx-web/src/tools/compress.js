// src/tools/compress.js — 代码压缩（去注释 + 去空白，保护字符串字面量）
export function minifyCode(code) {
  if (!code) return '';
  const strings = [];
  // 先抽离字符串字面量，避免压缩时破坏其内部的注释符号与空白
  code = code.replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, (m) => {
    strings.push(m);
    return `\u0000${strings.length - 1}\u0000`;
  });
  code = code
    .replace(/\/\*[\s\S]*?\*\//g, '')      // 块注释 /* ... */
    .replace(/\/\/[^\n]*/g, '')            // 行注释 //
    .replace(/\s+/g, ' ')                  // 压缩空白
    .replace(/\s*([{};:,>])\s*/g, '$1')    // 去标点前后空格
    .replace(/\)\s*\{/g, '){')             // ) { → ){
    .trim();
  // 还原字符串字面量
  return code.replace(/\u0000(\d+)\u0000/g, (_, i) => strings[+i]);
}

// 全站 UI 质感：点击水花反馈 + 深空/白昼主题切换
export function initUiEffects() {
  const savedTheme = localStorage.getItem('arpfx_theme');
  if (savedTheme === 'day') document.body.classList.add('theme-day');

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, a, .btn, .chip');
    if (!target || target.disabled || target.dataset.noRipple === 'true') return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ui-ripple';
    const diameter = Math.max(rect.width, rect.height) * 1.45;
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;
    target.classList.add('ui-ripple-host');
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 720);
  });
}

export function toggleTheme() {
  const day = document.body.classList.toggle('theme-day');
  localStorage.setItem('arpfx_theme', day ? 'day' : 'space');
  window.dispatchEvent(new CustomEvent('theme:change', { detail: day ? 'day' : 'space' }));
  return day;
}

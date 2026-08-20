// Toast notification system
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icons[type] || 'info'}</span>${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal system
export function showModal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
  const container = document.getElementById('modal-container');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3 style="font-size:20px;font-weight:600;margin-bottom:12px;font-family:Inter,sans-serif">${title}</h3>
      <div style="font-size:14px;color:#434655;margin-bottom:24px;font-family:Inter,sans-serif">${body}</div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button id="modal-cancel" style="padding:8px 20px;border:1px solid #c3c6d7;border-radius:6px;font-family:Inter,sans-serif;font-size:14px;cursor:pointer;background:white">${cancelText}</button>
        <button id="modal-confirm" style="padding:8px 20px;border:none;border-radius:6px;font-family:Inter,sans-serif;font-size:14px;cursor:pointer;background:${danger ? '#ba1a1a' : '#004ac6'};color:white">${confirmText}</button>
      </div>
    </div>
  `;

  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#modal-confirm').onclick = async () => {
    if (onConfirm) await onConfirm();
    overlay.remove();
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  container.appendChild(overlay);
  return overlay;
}

// Input modal for notes
export function showInputModal({ title, placeholder = '', onConfirm }) {
  const container = document.getElementById('modal-container');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3 style="font-size:20px;font-weight:600;margin-bottom:12px;font-family:Inter,sans-serif">${title}</h3>
      <textarea id="modal-input" placeholder="${placeholder}" style="width:100%;padding:10px;border:1px solid #c3c6d7;border-radius:6px;font-family:Inter,sans-serif;font-size:14px;resize:vertical;min-height:80px;box-sizing:border-box"></textarea>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px">
        <button id="modal-cancel" style="padding:8px 20px;border:1px solid #c3c6d7;border-radius:6px;font-family:Inter,sans-serif;font-size:14px;cursor:pointer;background:white">Cancel</button>
        <button id="modal-confirm" style="padding:8px 20px;border:none;border-radius:6px;font-family:Inter,sans-serif;font-size:14px;cursor:pointer;background:#004ac6;color:white">Submit</button>
      </div>
    </div>
  `;
  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#modal-confirm').onclick = async () => {
    const val = overlay.querySelector('#modal-input').value;
    if (onConfirm) await onConfirm(val);
    overlay.remove();
  };
  container.appendChild(overlay);
  overlay.querySelector('#modal-input').focus();
  return overlay;
}

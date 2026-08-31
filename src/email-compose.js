(() => {
  const dialog = document.querySelector('#email-dialog');
  const form = document.querySelector('#email-form');
  const from = document.querySelector('#email-from');
  const to = document.querySelector('#email-to');
  const subject = document.querySelector('#email-subject');
  const message = document.querySelector('#email-message');
  const files = document.querySelector('#email-files');
  const fileStatus = document.querySelector('#email-file-status');
  const helper = document.querySelector('#email-helper');

  if (!dialog || !form) return;

  try { from.value = localStorage.getItem('dephanie-email-from') || ''; } catch (_) {}

  const open = event => {
    event.preventDefault();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.setTimeout(() => (from.value ? subject : from).focus(), 80);
  };
  const close = () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  document.querySelectorAll('.js-email-compose').forEach(button => button.addEventListener('click', open));
  dialog.querySelector('.email-close').addEventListener('click', close);
  dialog.querySelector('.email-cancel').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });

  files.addEventListener('change', () => {
    const selected = [...files.files];
    fileStatus.textContent = selected.length ? selected.map(file => file.name).join(', ') : 'No files selected';
    helper.textContent = selected.length
      ? 'On supported devices, Send opens the native share sheet with your attachments.'
      : 'Your default mail app will complete the send securely.';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try { localStorage.setItem('dephanie-email-from', from.value); } catch (_) {}

    const selected = [...files.files];
    const sharePayload = {
      files:selected,
      title:subject.value,
      text:`To: ${to.value}\nFrom: ${from.value}\n\n${message.value}`
    };

    if (selected.length && navigator.share && navigator.canShare?.({ files:selected })) {
      try {
        await navigator.clipboard?.writeText(to.value);
        helper.textContent = 'Recipient copied. Choose your email app in the share sheet.';
        await navigator.share(sharePayload);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const attachmentNote = selected.length
      ? `\n\nAttachments selected: ${selected.map(file => file.name).join(', ')}\nPlease attach these files in your mail app before sending.`
      : '';
    const body = `From: ${from.value}\n\n${message.value}${attachmentNote}`;
    window.location.href = `mailto:${encodeURIComponent(to.value)}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(body)}`;
    helper.textContent = selected.length
      ? 'Your mail app is opening. Add the selected files there before sending.'
      : 'Your mail app is opening.';
  });
})();

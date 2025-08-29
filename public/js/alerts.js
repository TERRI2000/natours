/* eslint-disable */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
// type is 'success' or 'error'
export const showAlert = (type, msg, time = 7, showResendButton = false) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">
    ${msg}
    ${showResendButton ? '<button class="alert__resend-btn" id="resend-confirmation">Resend confirmation email</button>' : ''}
  </div>`;

  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  // Додати обробник для кнопки resend
  if (showResendButton) {
    const resendBtn = document.getElementById('resend-confirmation');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        // Отримати email користувача
        const user = document.querySelector('body').dataset.user;
        if (user) {
          const userData = JSON.parse(user);

          // Імпортуємо функцію динамічно
          const { resendConfirmationEmail } = await import('./login.js');
          await resendConfirmationEmail(userData.email);

          hideAlert();
        } else {
          showAlert(
            'error',
            'Unable to get user email. Please try logging in again.',
          );
        }
      });
    }
  }

  window.setTimeout(hideAlert, time * 1000);
};

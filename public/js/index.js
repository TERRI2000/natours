/* eslint-disable */
// public/js/index.js
import 'core-js';
import 'regenerator-runtime/runtime';
import axios from 'axios';

// Імпорт модулів
import { displayMap } from './leaflet';
import {
  login,
  logout,
  signup,
  resendConfirmationEmail,
  forgotPassword,
  resetPassword,
} from './login';
import { updateSettings } from './updateSettings.js';
import { bookTourPayPal } from './paypal';
import { showAlert } from './alerts';
import { createReview, updateReview, deleteReview, getReview } from './reviews';
import {
  loadTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  createTourWithImage,
  updateTourWithImage,
  updateUserRole,
  deleteUser,
  deleteReviewAdmin,
  deleteBookingAdmin,
  updateBookingStatus,
} from './admin';

window.axios = axios;

let selectedTourDateId = null;

// ===== УНІВЕРСАЛЬНІ ФУНКЦІЇ МОДАЛЬНИХ ВІКОН =====
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
};

const closeAllModals = () => {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.style.display = 'none';
  });
  document.body.style.overflow = '';
};

// Універсальна функція підтвердження
const showConfirmation = (modalId, onConfirm, onCancel = null) => {
  const modal = document.getElementById(modalId);
  if (!modal) {
   
    return;
  }

  openModal(modalId);

  const confirmBtn = modal.querySelector('.confirm-delete-btn');
  const cancelBtn = modal.querySelector('.cancel-delete-btn');
  const closeBtn = modal.querySelector('.modal__close-confirm, .modal__close');

  // Створюємо нові елементи щоб уникнути дублювання обробників
  const newConfirmBtn = confirmBtn ? confirmBtn.cloneNode(true) : null;
  const newCancelBtn = cancelBtn ? cancelBtn.cloneNode(true) : null;
  const newCloseBtn = closeBtn ? closeBtn.cloneNode(true) : null;

  // Замінюємо старі елементи новими
  if (newConfirmBtn && newCancelBtn) {
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    if (closeBtn && newCloseBtn) {
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }

    // Додаємо обробники
    newConfirmBtn.addEventListener('click', () => {
      closeModal(modalId);
      if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
      closeModal(modalId);
      if (onCancel) onCancel();
    });

    if (newCloseBtn) {
      newCloseBtn.addEventListener('click', () => {
        closeModal(modalId);
        if (onCancel) onCancel();
      });
    }
  }

  // Закриття по кліку поза модальним вікном
  const outsideClickHandler = (e) => {
    if (e.target === modal) {
      closeModal(modalId);
      if (onCancel) onCancel();
      modal.removeEventListener('click', outsideClickHandler);
    }
  };
  modal.addEventListener('click', outsideClickHandler);
};

// ===== ІНІЦІАЛІЗАЦІЯ =====
document.addEventListener('DOMContentLoaded', () => {
  // ===== КАРТА =====
  const mapElement = document.getElementById('map');
  if (mapElement) {
    const locations = JSON.parse(mapElement.dataset.locations);
    displayMap(locations);
  }

  // ===== ЛОГІН =====
  const loginForm = document.querySelector('.form--login');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
    });
  }

  // ===== ЛОГАУТ =====
  const logoutBtn = document.querySelector('.nav__el--logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      console.log('Logging out...');
      e.preventDefault();
      logout();
    });
  }

  // ===== ПОПЕРЕДНІЙ ПЕРЕГЛЯД ФОТО =====
  const filetag = document.querySelector('#photo');
  const preview = document.querySelector('.form__user-photo');

  const readURL = (input) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.setAttribute('src', e.target.result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  if (filetag && preview) {
    filetag.addEventListener('change', function () {
      readURL(this);
    });
  }

  // ===== ОНОВЛЕННЯ ДАНИХ КОРИСТУВАЧА =====
  const userDataForm = document.querySelector('.form-user-data');
  if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);
      updateSettings(form, 'data');
    });
  }

  // ===== ЗМІНА ПАРОЛЮ =====
  const userPasswordForm = document.querySelector('.form-user-password');
  if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      document.querySelector('.btn--save-password').textContent = 'Updating...';

      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;

      await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        'password',
      );

      document.querySelector('.btn--save-password').textContent =
        'Save password';
      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    });
  }

  // ===== РЕЄСТРАЦІЯ =====
  const signupForm = document.querySelector('.form--signup');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      signup(name, email, password, passwordConfirm);
    });
  }

  // ===== ВИБІР ДАТИ ТУРУ =====
  const dateCards = document.querySelectorAll(
    '.date-card:not(.date-card--sold-out)',
  );
  dateCards.forEach((card) => {
    card.addEventListener('click', () => {
      // Видалити попередній вибір
      document.querySelectorAll('.date-card').forEach((c) => {
        c.classList.remove('date-card--selected');
      });

      // Додати клас до вибраної дати
      card.classList.add('date-card--selected');
      selectedTourDateId = card.dataset.dateId;

      // Оновити кнопку
      const bookBtn = document.getElementById('book-tour');
      if (bookBtn) {
        bookBtn.textContent = 'Book selected date';
        bookBtn.style.display = 'inline-block';
      }

     
    });
  });

  // ===== БРОНЮВАННЯ ТУРУ =====
  const bookBtn = document.getElementById('book-tour');
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!selectedTourDateId) {
        showAlert('error', 'Please select a tour date first!');
        return;
      }

      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset;
      bookTourPayPal(tourId, selectedTourDateId);
    });
  }

  // ===== ПОВТОРНА ВІДПРАВКА EMAIL =====
  const resendEmailBtn = document.getElementById('resend-email-btn');
  const resendEmailInline = document.getElementById('resend-email-inline');
  const confirmEmailNav = document.getElementById('confirm-email-nav');

  const handleResendEmail = async (e) => {
    e.preventDefault();
    const userDataEl = document.querySelector('body').dataset.user;
    if (userDataEl) {
      const userData = JSON.parse(userDataEl);
      await resendConfirmationEmail(userData.email);
    }
  };

  if (resendEmailBtn) {
    resendEmailBtn.addEventListener('click', handleResendEmail);
  }
  if (resendEmailInline) {
    resendEmailInline.addEventListener('click', handleResendEmail);
  }
  if (confirmEmailNav) {
    confirmEmailNav.addEventListener('click', handleResendEmail);
  }

  // ===== ЗАБУТИЙ ПАРОЛЬ =====
  const forgotPasswordForm = document.querySelector('.form--forgot-password');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      if (!email) {
        showAlert('error', 'Please provide your email address!');
        return;
      }
      forgotPassword(email);
    });
  }

  // ===== СКИДАННЯ ПАРОЛЮ =====
  const resetPasswordForm = document.querySelector('.form--reset-password');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      if (!password || !passwordConfirm) {
        showAlert('error', 'Please fill in all fields!');
        return;
      }
      if (password !== passwordConfirm) {
        showAlert('error', 'Passwords do not match!');
        return;
      }

      const token = window.location.pathname.split('/').pop();
      resetPassword(password, passwordConfirm, token);
    });
  }

  // ===== СТВОРЕННЯ ВІДГУКУ =====
  const reviewForm = document.querySelector('.form--review');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = document.getElementById('rating').value;
      const review = document.getElementById('review').value;
      const tourId = reviewForm.dataset.tourId;

      if (!rating || !review) {
        showAlert('error', 'Please provide both rating and review!');
        return;
      }
      createReview(tourId, rating, review);
    });
  }

  // ===== РЕДАГУВАННЯ ВІДГУКУ НА СТОРІНЦІ ТУРУ =====
  const editReviewForm = document.querySelector('.form--edit-review');
  if (editReviewForm) {
    editReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const reviewId = editReviewForm.dataset.reviewId;
      const rating = document.getElementById('edit-rating').value;
      const review = document.getElementById('edit-review-text').value;

      if (!rating || !review) {
        showAlert('error', 'Please provide both rating and review!');
        return;
      }
      updateReview(reviewId, rating, review);
    });

    // Кнопка видалення відгуку на сторінці туру
    const deleteReviewBtn = document.getElementById('delete-review');
    if (deleteReviewBtn) {
      deleteReviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const reviewId = editReviewForm.dataset.reviewId;

        showConfirmation('delete-review-confirm-modal', () => {
          deleteReview(reviewId);
        });
      });
    }
  }

  // ===== ВІДГУКИ НА СТОРІНЦІ АККАУНТУ =====
  // Кнопки редагування відгуків
  const editReviewBtns = document.querySelectorAll('.edit-review-btn');
  editReviewBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const reviewId = e.target.dataset.reviewId;

      try {
        const response = await axios.get(`/api/v1/reviews/${reviewId}`);
        const review = response.data.data.data;

        // Заповнити форму в модальному вікні
        const modalReviewId = document.getElementById('modal-review-id');
        const modalRating = document.getElementById('modal-rating');
        const modalReviewText = document.getElementById('modal-review');

        if (modalReviewId && modalRating && modalReviewText) {
          modalReviewId.value = reviewId;
          modalRating.value = review.rating;
          modalReviewText.value = review.review;

          openModal('edit-review-modal');
        } else {
          showAlert('error', 'Modal form elements not found');
        }
      } catch (err) {
        showAlert('error', 'Could not load review data');
    
      }
    });
  });

  // Кнопки видалення відгуків
  const deleteReviewBtns = document.querySelectorAll('.delete-review-btn');
  deleteReviewBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const reviewId = e.target.dataset.reviewId;

      showConfirmation('delete-confirm-modal', () => {
        deleteReview(reviewId);
      });
    });
  });

  // Форма редагування відгуку в модальному вікні
  const editReviewModalForm = document.getElementById('edit-review-modal-form');
  if (editReviewModalForm) {
    editReviewModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const reviewId = document.getElementById('modal-review-id').value;
      const rating = document.getElementById('modal-rating').value;
      const reviewText = document.getElementById('modal-review').value;

      if (!rating || !reviewText) {
        showAlert('error', 'Please provide both rating and review!');
        return;
      }

      try {
        const res = await axios.patch(`/api/v1/reviews/${reviewId}`, {
          rating,
          review: reviewText,
        });

        if (res.data.status === 'success') {
          showAlert('success', 'Review updated successfully!');
          closeModal('edit-review-modal');
          setTimeout(() => {
            location.reload();
          }, 1500);
        }
      } catch (err) {
        showAlert(
          'error',
          err.response?.data?.message || 'Error updating review',
        );
     
      }
    });
  }

  // ===============================
  // ===== ADMIN FUNCTIONALITY =====
  // ===============================

  const currentPage =
    document.body.dataset.currentPage ||
    new URLSearchParams(window.location.search).get('page') ||
    window.location.pathname.split('/').pop();

 

  // ===== ADMIN: MANAGE TOURS =====
  if (
    currentPage === 'admin-tours' ||
    window.location.pathname === '/admin/tours'
  ) {
    // Завантажити тури при відкритті сторінки
    loadTours();

    // Кнопка "Create New Tour"
    const createTourBtn = document.getElementById('create-tour-btn');
    if (createTourBtn) {
      createTourBtn.addEventListener('click', () => {
        // Очистити форму та відкрити модальне вікно
        const tourForm = document.getElementById('tour-form');
        if (tourForm) {
          tourForm.reset();
          document.getElementById('tour-id').value = '';

          // Змінити заголовок модального вікна
          const modalTitle = document.querySelector(
            '#tour-modal .heading-tertiary',
          );
          if (modalTitle) modalTitle.textContent = 'Create New Tour';

          openModal('tour-modal');
        }
      });
    }

    // ГОЛОВНИЙ ОБРОБНИК ФОРМИ ТУРУ
    const tourForm = document.getElementById('tour-form');
    if (tourForm) {
      tourForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleTourFormSubmit();
      });
    }

    // ОБРОБНИК ДЛЯ КНОПКИ "SAVE CHANGES" (event delegation)
    document.addEventListener('click', async (e) => {
      // Перевіряємо різні можливі селектори кнопки
      if (
        e.target.textContent?.trim() === 'SAVE CHANGES' ||
        e.target.textContent?.trim() === 'Save Changes' ||
        e.target.id === 'save-tour-btn' ||
        (e.target.classList.contains('btn--green') &&
          e.target.closest('#tour-modal'))
      ) {
        e.preventDefault();
       
        await handleTourFormSubmit();
      }

      // Обробник для кнопки Cancel
      if (
        e.target.textContent?.trim() === 'CANCEL' ||
        e.target.textContent?.trim() === 'Cancel' ||
        (e.target.classList.contains('btn--grey') &&
          e.target.closest('#tour-modal'))
      ) {
        e.preventDefault();
        closeModal('tour-modal');
      }
    });

    // ОБРОБНИК ДЛЯ ЗАВАНТАЖЕННЯ ФОТО
    const setupImageUpload = () => {
      const imageInput = document.getElementById('tour-image-cover');
      const imagePreview = document.getElementById('tour-image-preview');

      if (imageInput && imagePreview) {
        // Видалити попередні обробники
        const newImageInput = imageInput.cloneNode(true);
        imageInput.parentNode.replaceChild(newImageInput, imageInput);

        newImageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            // Перевірити розмір файлу (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
              showAlert('error', 'Image size must be less than 5MB');
              newImageInput.value = '';
              return;
            }

            // Перевірити тип файлу
            if (!file.type.startsWith('image/')) {
              showAlert('error', 'Please select a valid image file');
              newImageInput.value = '';
              return;
            }

            // Показати превью
            const reader = new FileReader();
            reader.onload = (e) => {
              imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
          }
        });
      }
    };

    // ФУНКЦІЯ ОБРОБКИ ФОРМИ ТУРУ
    const handleTourFormSubmit = async () => {
      try {
        

        const tourId = document.getElementById('tour-id')?.value || '';
        const imageFile = document.getElementById('tour-image-cover').files[0];

        // Якщо це створення нового туру або є новий файл зображення - використовуємо FormData
        if (!tourId || imageFile) {
          // Створити FormData для підтримки файлів
          const formData = new FormData();

          // Додати текстові поля
          formData.append(
            'name',
            document.getElementById('tour-name')?.value.trim() || '',
          );
          formData.append(
            'price',
            document.getElementById('tour-price')?.value || '0',
          );
          formData.append(
            'duration',
            document.getElementById('tour-duration')?.value || '0',
          );
          formData.append(
            'maxGroupSize',
            document.getElementById('tour-max-group-size')?.value || '15',
          );
          formData.append(
            'difficulty',
            document.getElementById('tour-difficulty')?.value || '',
          );
          formData.append(
            'summary',
            document.getElementById('tour-summary')?.value.trim() || '',
          );
          formData.append(
            'description',
            document.getElementById('tour-description')?.value.trim() || '',
          );

          // Додати файл обкладинки якщо є
          if (imageFile) {
            formData.append('imageCover', imageFile);
          }

          // Додати startLocation якщо заповнено
          const startLocationDesc = document
            .getElementById('tour-start-location-desc')
            ?.value.trim();
          if (startLocationDesc) {
            formData.append(
              'startLocation',
              JSON.stringify({
                type: 'Point',
                coordinates: [-80.185942, 25.774772],
                address: startLocationDesc,
                description: startLocationDesc,
              }),
            );
          }

          // Валідація для створення нового туру
          if (!tourId && !imageFile) {
            showAlert('error', 'Cover image is required for new tours');
            return;
          }

          // Показати індикатор завантаження
          const saveBtn = document.querySelector('#tour-modal .btn--green');
          const originalText = saveBtn?.textContent || '';
          if (saveBtn) {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
          }

          // Виконати операцію
          if (tourId) {
            await updateTourWithImage(tourId, formData);
          } else {
            await createTourWithImage(formData);
          }

          // Відновити кнопку
          if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          }
        } else {
          // Для редагування без нового файлу використовуємо звичайний JSON
          const tourData = {
            name: document.getElementById('tour-name')?.value.trim() || '',
            price: Number(document.getElementById('tour-price')?.value || 0),
            duration: Number(
              document.getElementById('tour-duration')?.value || 0,
            ),
            maxGroupSize: Number(
              document.getElementById('tour-max-group-size')?.value || 15,
            ),
            difficulty: document.getElementById('tour-difficulty')?.value || '',
            summary:
              document.getElementById('tour-summary')?.value.trim() || '',
            description:
              document.getElementById('tour-description')?.value.trim() || '',
          };

          // Додати startLocation якщо заповнено
          const startLocationDesc = document
            .getElementById('tour-start-location-desc')
            ?.value.trim();
          if (startLocationDesc) {
            tourData.startLocation = {
              type: 'Point',
              coordinates: [-80.185942, 25.774772],
              address: startLocationDesc,
              description: startLocationDesc,
            };
          }

          // Валідація
          const validationErrors = [];

          if (!tourData.name || tourData.name.length < 10) {
            validationErrors.push('Name must be at least 10 characters long');
          }
          if (!tourData.price || tourData.price <= 0) {
            validationErrors.push('Price must be greater than 0');
          }
          if (!tourData.duration || tourData.duration <= 0) {
            validationErrors.push('Duration must be greater than 0');
          }
          if (!tourData.maxGroupSize || tourData.maxGroupSize <= 0) {
            validationErrors.push('Max group size must be greater than 0');
          }
          if (!tourData.difficulty) {
            validationErrors.push('Please select difficulty level');
          }
          if (!tourData.summary) {
            validationErrors.push('Summary is required');
          }

          if (validationErrors.length > 0) {
            showAlert(
              'error',
              'Please fix the following errors:\n' +
                validationErrors.join('\n'),
            );
            return;
          }

          // Показати індикатор завантаження
          const saveBtn = document.querySelector('#tour-modal .btn--green');
          const originalText = saveBtn?.textContent || '';
          if (saveBtn) {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
          }

          // Оновити тур без файлу
          await updateTour(tourId, tourData);

          // Відновити кнопку
          if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          }
        }

        // Закрити модальне вікно
        closeModal('tour-modal');
      } catch (err) {
        // Відновити кнопку при помилці
        const saveBtn = document.querySelector('#tour-modal .btn--green');
        if (saveBtn) {
          saveBtn.textContent = 'SAVE CHANGES';
          saveBtn.disabled = false;
        }
      }
    };

    // Додати setup для завантаження зображень
    setTimeout(() => {
      setupImageUpload();
    }, 500);
  }

  // ===== ADMIN: EVENT DELEGATION FOR DYNAMIC CONTENT =====

  // Універсальна обробка кліків для адмін функцій
  document.addEventListener('click', async (e) => {
    // ===== TOURS MANAGEMENT =====
    if (e.target.classList.contains('edit-tour-btn')) {
      const tourId = e.target.dataset.tourId;

      try {
        const tour = await getTour(tourId);

        // Заповнити форму тільки тими полями які можна редагувати
        document.getElementById('tour-id').value = tour._id || '';
        document.getElementById('tour-name').value = tour.name || '';
        document.getElementById('tour-price').value = tour.price || '';
        document.getElementById('tour-duration').value = tour.duration || '';
        document.getElementById('tour-max-group-size').value =
          tour.maxGroupSize || 15;
        document.getElementById('tour-difficulty').value =
          tour.difficulty || '';
        document.getElementById('tour-summary').value = tour.summary || '';
        document.getElementById('tour-description').value =
          tour.description || '';

        // НЕ ВСТАНОВЛЮЙТЕ ЗНАЧЕННЯ ДЛЯ FILE INPUT!
        // Замість цього очистіть поле файлу і покажіть поточне зображення
        const fileInput = document.getElementById('tour-image-cover');
        if (fileInput) {
          fileInput.value = ''; // Очистити input файлу
        }

        // Показати поточну обкладинку в preview
        const imagePreview = document.getElementById('tour-image-preview');
        const currentImageInfo = document.getElementById('current-image-info');

        if (imagePreview && tour.imageCover) {
          imagePreview.src = `/img/tours/${tour.imageCover}`;
          imagePreview.onerror = function () {
            this.src = '/img/users/default.jpg';
          };

          if (currentImageInfo) {
            currentImageInfo.textContent = `Current: ${tour.imageCover}`;
          }
        } else if (imagePreview) {
          imagePreview.src = '/img/users/default.jpg';
          if (currentImageInfo) {
            currentImageInfo.textContent = 'Current: No image selected';
          }
        }

        // Start Location
        if (tour.startLocation && tour.startLocation.description) {
          document.getElementById('tour-start-location-desc').value =
            tour.startLocation.description;
        } else {
          document.getElementById('tour-start-location-desc').value = '';
        }

        // Змінити заголовок модального вікна
        const modalTitle = document.querySelector(
          '#tour-modal .heading-tertiary',
        );
        if (modalTitle) modalTitle.textContent = 'Edit Tour';

        openModal('tour-modal');

        // Переконатися що обробники встановлені
        setTimeout(() => {
          setupImageUpload();
        }, 100);
      } catch (err) {
        showAlert('error', 'Error loading tour data');

      }
    }

    if (e.target.classList.contains('admin-delete-tour-btn')) {
      const tourId = e.target.dataset.tourId;
      showConfirmation('delete-tour-modal', () => {
        deleteTour(tourId);
      });
    }

    // ===== USERS MANAGEMENT =====
    if (e.target.classList.contains('delete-user-btn')) {
      const userId = e.target.dataset.userId;
      showConfirmation('delete-user-modal', () => {
        deleteUser(userId);
      });
    }

    // ===== REVIEWS MANAGEMENT (ADMIN) =====
    if (e.target.classList.contains('admin-delete-review-btn')) {
      const reviewId = e.target.dataset.reviewId;
      showConfirmation('delete-confirm-modal', () => {
        deleteReviewAdmin(reviewId);
      });
    }

    // ===== BOOKINGS MANAGEMENT =====
    if (e.target.classList.contains('delete-booking-btn')) {
      const bookingId = e.target.dataset.bookingId;
      showConfirmation('delete-booking-modal', () => {
        deleteBookingAdmin(bookingId);
      });
    }
  });

  // ===== USER ROLE SELECT CHANGE =====
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('admin-role-select')) {
      const userId = e.target.dataset.userId;
      const newRole = e.target.value;
      updateUserRole(userId, newRole);
    }

    // ===== BOOKING STATUS SELECT CHANGE =====
    if (e.target.classList.contains('admin-booking-status')) {
      const bookingId = e.target.dataset.bookingId;
      const newStatus = e.target.value;
      updateBookingStatus(bookingId, newStatus);
    }
  });

  // ===== ГЛОБАЛЬНІ ОБРОБНИКИ МОДАЛЬНИХ ВІКОН =====

  // Закриття по хрестику
  document.addEventListener('click', (e) => {
    if (
      e.target.classList.contains('modal__close') ||
      e.target.classList.contains('modal__close-confirm') ||
      e.target.classList.contains('modal__close-btn')
    ) {
      closeAllModals();
    }

    // Закриття по кліку поза модальним вікном
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });

  // Закриття по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

});

// Функція видалення відгуку
const deleteReview = async (reviewId) => {
  try {
    await axios.delete(`/api/v1/reviews/${reviewId}`);
    showAlert('success', 'Review deleted successfully!');
    setTimeout(() => {
      location.reload();
    }, 1500);
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Error deleting review');

  }
};

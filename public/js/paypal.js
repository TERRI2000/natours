/* eslint-disable */
// public/js/paypal.js

import { loadScript } from '@paypal/paypal-js';
import { showAlert } from './alerts.js';
import axios from 'axios';

export const bookTourPayPal = async (tourId, tourDateId) => {
  const bookBtn = document.getElementById('book-tour');

  if (bookBtn) {
    bookBtn.style.display = 'none';
  }
  try {
    if (!tourId || !tourDateId) {
      showAlert('error', 'Tour ID and Date ID are required!');
      if (bookBtn) bookBtn.style.display = 'block';
      return;
    }
    // 1) Get checkout session from API
    const session = await window.axios(
      `/api/v1/bookings/checkout-session/${tourId}`,
    );

    // 2) Load PayPal script
    const paypal = await loadScript({
      'client-id': session.data.paypalClientId, // Отримуємо з API
      currency: 'USD',
    });

    // 3) Render PayPal button
    paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create(session.data.paypalOrder);
        },

        onApprove: async (data, actions) => {
          try {
            // Завершуємо платіж
            const orderData = await actions.order.capture();

            // Готуємо дані для бронювання
            const bookingData = {
              paypalOrderId: orderData.id,
              tourId: tourId,
              tourDateId: tourDateId,
              price: orderData.purchase_units[0].amount.value,
            };
          
            // Відправляємо запит на створення бронювання
            const response = await axios.post('/api/v1/bookings', bookingData);

            if (response.data.status === 'success') {
              showAlert('success', 'Booking successful!');
              window.setTimeout(() => {
                location.assign('/my-tours');
              }, 1500);
            }
          } catch (error) {
        
            // Тут додаємо перевірку на статус 403 (email не підтверджено)
            if (error.response?.status === 403) {
              showAlert(
                'error',
                'Please confirm your email address first. Check your inbox for the confirmation link.',
                15,
                true,
              );
            } else if (error.response?.status === 400) {
              // Показати конкретну помилку з сервера
              const errorMessage =
                error.response?.data?.message || 'Booking failed';

              if (errorMessage.includes('already booked')) {
                showAlert(
                  'error',
                  'You have already booked this tour! Check your bookings in "My Tours".',
                  8,
                );
              } else {
                showAlert('error', errorMessage, 8);
              }
            } else {
              showAlert('error', 'Booking failed. Please try again.');
            }
          }
        },

        onError: (err) => {
     
          showAlert('error', 'Something went wrong processing your payment!');
        },
      })
      .render('#paypal-button-container');
  } catch (err) {

    // Показуємо більш детальну помилку
    if (err.response && err.response.data && err.response.data.message) {
      showAlert('error', err.response.data.message);
    } else {
      showAlert('error', 'Something went wrong!');
    }

    // Повертаємо кнопку назад
    if (bookBtn) {
      bookBtn.style.display = 'block';
    }
  }
};

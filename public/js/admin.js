import axios from 'axios';
import { showAlert } from './alerts';

// ===== TOURS MANAGEMENT =====

// Функція для завантаження та відображення турів у таблиці
export const loadTours = async () => {
  try {
    const res = await axios.get('/api/v1/tours');
  
    
    if (!res.data || res.data.status !== 'success') {
      throw new Error('Invalid API response status');
    }
    
    let tours;
    if (res.data.data && res.data.data.tour) {
      tours = res.data.data.tour;
    } else if (res.data.data && res.data.data.data) {
      tours = res.data.data.data;
    } else if (res.data.data && Array.isArray(res.data.data)) {
      tours = res.data.data;
    } else {
     
      throw new Error('No tours data found in response');
    }
    
    if (!Array.isArray(tours)) {
      throw new Error('Tours data is not an array');
    }
    
    const tableBody = document.getElementById('tours-table-body');
    if (!tableBody) {
      
      return;
    }
    
    if (tours.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem;">
            <p>No tours found.</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tableBody.innerHTML = tours.map(tour => `
      <tr data-tour-id="${tour._id}">
        <td>
          ${tour.imageCover ? 
            `<img src="/img/tours/${tour.imageCover}" alt="${tour.name}" class="admin-table__image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
             <div class="admin-table__image-placeholder" style="display: none;">
               <span>No Image</span>
             </div>` 
            :
            `<div class="admin-table__image-placeholder">
               <span>No Image</span>
             </div>`
          }
        </td>
        <td>${tour.name || 'N/A'}</td>
        <td>$${tour.price || 0}</td>
        <td class="capitalize">${tour.difficulty || 'N/A'}</td>
        <td>${tour.duration || 0} days</td>
        <td>${tour.ratingsAverage ? tour.ratingsAverage.toFixed(1) : 'N/A'} (${tour.ratingsQuantity || 0})</td>
        <td class="admin-actions">
          <button class="btn btn--small btn--green edit-tour-btn" data-tour-id="${tour._id}">Edit</button>
          <button class="btn btn--small btn--red admin-delete-tour-btn" data-tour-id="${tour._id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
   
    
  } catch (err) {
    showAlert('error', 'Error loading tours: ' + err.message);
    
    const tableBody = document.getElementById('tours-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem;">
            <p>Error loading tours: ${err.message}</p>
            <button class="btn btn--small btn--green" onclick="window.location.reload()">Reload</button>
          </td>
        </tr>
      `;
    }
  }
};

// Функція для отримання одного туру (для редагування)
export const getTour = async (tourId) => {
  try {
    const res = await axios.get(`/api/v1/tours/${tourId}`);

    // Правильний доступ до даних туру
    let tour;
    if (res.data.data && res.data.data.tour) {
      // Якщо це один тур, він може бути в data.tour
      tour = res.data.data.tour;
    } else if (res.data.data && res.data.data.data) {
      // Стандартна структура
      tour = res.data.data.data;
    } else if (res.data.data) {
      tour = res.data.data;
    } else {
      
      throw new Error('No tour data found in response');
    }

  
    return tour;
  } catch (err) {
  
    throw err;
  }
};

export const createTourWithImage = async (formData) => {
  try {
    const res = await axios.post('/api/v1/tours', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Tour created successfully!');
      loadTours();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error creating tour';
    showAlert('error', message);

  }
};

export const updateTourWithImage = async (tourId, formData) => {
  try {
    const res = await axios.patch(`/api/v1/tours/${tourId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Tour updated successfully!');
      loadTours();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error updating tour';
    showAlert('error', message);
  
  }
};

// Оригінальні функції залишити для зворотної сумісності
export const createTour = async (tourData) => {
  try {
    const res = await axios.post('/api/v1/tours', tourData);

    if (res.data.status === 'success') {
      showAlert('success', 'Tour created successfully!');
      loadTours();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error creating tour';
    showAlert('error', message);
   
  }
};

export const updateTour = async (tourId, tourData) => {
  try {
    const res = await axios.patch(`/api/v1/tours/${tourId}`, tourData);

    if (res.data.status === 'success') {
      showAlert('success', 'Tour updated successfully!');
      loadTours();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error updating tour';
    showAlert('error', message);
    
  }
};

export const deleteTour = async (tourId) => {
  try {
    await axios.delete(`/api/v1/tours/${tourId}`);
    showAlert('success', 'Tour deleted successfully!');
    loadTours(); // Оновлюємо таблицю після видалення
  } catch (err) {
    const message = err.response?.data?.message || 'Error deleting tour';
    showAlert('error', message);

  }
};

// ===== USER MANAGEMENT =====
export const updateUserRole = async (userId, newRole) => {
  try {
    const res = await axios.patch(`/api/v1/users/${userId}`, { role: newRole });

    if (res.data.status === 'success') {
      showAlert('success', 'User role updated!');
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error updating user role';
    showAlert('error', message);
  }
};

export const deleteUser = async (userId) => {
  try {
    await axios.delete(`/api/v1/users/${userId}`);
    showAlert('success', 'User deleted successfully!');

    // Видаляємо рядок з таблиці замість перезавантаження сторінки
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (userRow) {
      userRow.remove();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error deleting user';
    showAlert('error', message);

  }
};

// ===== REVIEWS MANAGEMENT =====
export const deleteReviewAdmin = async (reviewId) => {
  try {
    await axios.delete(`/api/v1/reviews/${reviewId}`);
    showAlert('success', 'Review deleted successfully!');

    // Видаляємо рядок з таблиці
    const reviewRow = document.querySelector(
      `tr[data-review-id="${reviewId}"]`,
    );
    if (reviewRow) {
      reviewRow.remove();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error deleting review';
    showAlert('error', message);

  }
};

// ===== BOOKINGS MANAGEMENT =====
export const deleteBookingAdmin = async (bookingId) => {
  try {
    await axios.delete(`/api/v1/bookings/${bookingId}`);
    showAlert('success', 'Booking deleted successfully!');

    // Видаляємо рядок з таблиці
    const bookingRow = document.querySelector(
      `tr[data-booking-id="${bookingId}"]`,
    );
    if (bookingRow) {
      bookingRow.remove();
    }
  } catch (err) {
    const message = err.response?.data?.message || 'Error deleting booking';
    showAlert('error', message);
 
  }
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const res = await axios.patch(`/api/v1/bookings/${bookingId}`, {
      status: newStatus,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Booking status updated!');
    }
  } catch (err) {
    const message =
      err.response?.data?.message || 'Error updating booking status';
    showAlert('error', message);
  }
};

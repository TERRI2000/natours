import axios from 'axios';
import { showAlert } from './alerts';

export const createReview = async (tourId, rating, review) => {
  try {
  
    const res = await axios({
      method: 'POST',
      url: `/api/v1/reviews`,
      data: {
        tour: tourId,
        rating: parseInt(rating),
        review,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Review submitted successfully!');
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const updateReview = async (reviewId, rating, review) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/reviews/${reviewId}`,
      data: {
        rating: parseInt(rating),
        review,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Review updated successfully!');
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/api/v1/reviews/${reviewId}`,
    });

    showAlert('success', 'Review deleted successfully!');
    setTimeout(() => {
      location.reload();
    }, 1500);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const getReview = async (reviewId) => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/api/v1/reviews/${reviewId}`,
    });

    return res.data.data.data;
  } catch (err) {

    showAlert(
      'error',
      err.response?.data?.message || 'Could not load review data',
    );
    throw err;
  }
};

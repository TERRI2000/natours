// Utility function to get correct image URL based on environment
exports.getImageUrl = (imagePath, type = 'users') => {
  if (!imagePath) return `/img/${type}/default.jpg`;
  
  // Якщо це вже повний URL (Cloudinary), повертаємо як є
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Якщо це локальний файл, додаємо префікс
  return `/img/${type}/${imagePath}`;
};

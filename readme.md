# Natours - Adventure Tour Booking Website

A modern web application for booking adventure tours around the world. Users can explore different tours, read reviews, and book their perfect adventure.

## About This Project

Natours is a full-stack web application that helps people find and book amazing nature tours. The website shows different tours with beautiful photos, detailed information, and real user reviews. Users can create accounts, choose their favorite tours, and pay safely online.

## Main Features

### For All Users
- **Browse Tours**: Look at different adventure tours with photos and descriptions
- **Tour Details**: See tour prices, difficulty levels, dates, and locations on interactive maps
- **User Reviews**: Read what other people think about each tour

### For Registered Users
- **Create Account**: Sign up with email and password
- **User Profile**: Upload profile photos and manage personal information
- **Book Tours**: Choose dates and pay for tours using PayPal
- **Write Reviews**: Share experiences and rate tours after booking

### For Administrators
- **Manage Tours**: Add, edit, or delete tour information
- **User Management**: Control user accounts and permissions
- **Review Management**: Monitor and manage user reviews
- **Booking Overview**: Track all bookings and payments

## Technologies Used

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web framework for building APIs
- **MongoDB**: Database for storing all information
- **Mongoose**: Tool for working with MongoDB data

### Frontend
- **HTML5 & CSS3**: Website structure and styling
- **JavaScript**: Interactive features and user interface
- **Pug**: Template engine for creating web pages

### Security & Authentication
- **JWT Tokens**: Secure user login system
- **Password Encryption**: Safe password storage
- **Data Validation**: Check all user input for security

### Payment & External Services
- **PayPal Integration**: Safe online payments
- **Email Service**: Send confirmation emails to users
- **Image Processing**: Optimize uploaded photos

## How to Run This Project

1. **Download the code**:
   ```bash
   git clone https://github.com/TERRI2000/natours.git
   cd natours
   ```

2. **Install required packages**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file with your database and email settings

4. **Start the application**:
   ```bash
   npm start
   ```

5. **Open in browser**:
   Go to `http://localhost:3000`

## Project Structure

- `controllers/` - Handle user requests and responses
- `models/` - Database structure and rules
- `routes/` - URL paths and navigation
- `views/` - Web page templates
- `public/` - CSS, JavaScript, and image files
- `utils/` - Helper functions and tools

## What I Learned

Building this project helped me learn:
- How to create a complete web application from start to finish
- Working with databases and user authentication
- Building secure payment systems
- Creating responsive websites that work on all devices
- Managing user data safely and efficiently
- Deploying applications to the internet

## Future Improvements

- Add social media login (Google)
- Implement tour recommendations based on user preferences
- Add real-time chat support for customers

## Contact

If you have questions about this project or want to collaborate, please contact me through GitHub.

---

**Built with modern web technologies for learning and portfolio purposes.**